import { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { seedData } from '../data';
import { showError, showSuccess } from '../utils/notifications';

function unifyStudentsWithBatchRows(studentsList = [], batchesList = []) {
  const studentMap = new Map();
  (studentsList || []).forEach((st) => {
    if (st.id) studentMap.set(st.id, { ...st });
    if (st.email) studentMap.set(String(st.email).toLowerCase(), { ...st });
  });

  (batchesList || []).forEach((batch) => {
    (batch.rows || []).forEach((row, idx) => {
      if (!row || !row.name) return;
      const idKey = row.id;
      const emailKey = row.email ? String(row.email).toLowerCase() : null;
      const existing = (idKey && studentMap.get(idKey)) || (emailKey && studentMap.get(emailKey));

      if (existing) {
        if (!existing.batch) existing.batch = batch.name;
        if (!existing.field && batch.field) existing.field = batch.field;
        if (!existing.lmsUsername && row.lmsUsername) existing.lmsUsername = String(row.lmsUsername);
        if (!existing.lmsPassword && row.lmsPassword) existing.lmsPassword = String(row.lmsPassword);
        if (!existing.phone && row.phone) existing.phone = String(row.phone);
        Object.keys(row).forEach((k) => {
          if (existing[k] === undefined && row[k] !== undefined) {
            existing[k] = row[k];
          }
        });
        if (idKey) studentMap.set(idKey, existing);
        if (emailKey) studentMap.set(emailKey, existing);
      } else {
        const synthId = row.id || `row_st_${batch.id || 'b'}_${idx}`;
        const cleanName = String(row.name);
        const batchSuffix = String(batch.id || 'b').replace(/[^a-z0-9]/gi, '').toLowerCase();
        const newStudent = {
          id: synthId,
          ...row,
          name: cleanName,
          email: row.email
            ? String(row.email)
            : `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.')}.${batchSuffix}_${idx}@example.org`,
          phone: row.phone ? String(row.phone) : '',
          field: batch.field || 'General Training',
          batch: batch.name,
          status: row.status || 'Active',
          lmsUsername: row.lmsUsername ? String(row.lmsUsername) : '',
          lmsPassword: row.lmsPassword ? String(row.lmsPassword) : '',
          enrollmentDate: row.enrollmentDate || batch.startDate || '',
        };
        studentMap.set(synthId, newStudent);
        if (newStudent.email) studentMap.set(String(newStudent.email).toLowerCase(), newStudent);
      }
    });
  });

  const seenIds = new Set();
  const result = [];
  studentMap.forEach((st) => {
    if (!seenIds.has(st.id)) {
      seenIds.add(st.id);
      result.push(st);
    }
  });
  return result;
}

export function useWorkspaceData() {
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      let data;
      try {
        data = await api.getWorkspace();
      } catch {
        const [studentsData, sessionsData, attendanceData, placementsData, batchesData] = await Promise.all([
          api.list('students'),
          api.list('sessions'),
          api.list('attendance'),
          api.list('placements'),
          api.list('batches'),
        ]);
        data = {
          students: studentsData,
          sessions: sessionsData,
          attendance: attendanceData,
          placements: placementsData,
          batches: batchesData,
        };
      }

      const effectiveBatches = data.batches && data.batches.length ? data.batches : (seedData.batches || []);
      const unifiedStudents = unifyStudentsWithBatchRows(data.students || [], effectiveBatches);

      setStudents(unifiedStudents);
      setSessions(data.sessions || []);
      setAttendance(data.attendance || []);
      setPlacements(data.placements || []);
      setBatches(effectiveBatches);
    } catch (error) {
      showError(error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    reload()
      .catch((error) => {
        if (isMounted) showError(error);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reload]);

  // Smart background sync: pauses when browser tab is inactive/hidden, resumes on tab focus
  const [, forceClockTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (api.demoMode) {
        forceClockTick((tick) => tick + 1);
      } else {
        reload().catch(() => {});
      }
    }, 45_000);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden && !api.demoMode) {
        reload().catch(() => {});
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      clearInterval(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [reload]);

  const saveRecord = async (type, payload, recordId) => {
    const resource =
      type === 'student'
        ? 'students'
        : type === 'session'
        ? 'sessions'
        : type === 'attendance'
        ? 'attendance'
        : type === 'batch'
        ? 'batches'
        : 'placements';

    if (type === 'attendance') {
      if (recordId) await api.update(resource, recordId, payload);
      else await api.upsertAttendance(payload);
    } else if (recordId) {
      const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(recordId);
      if (!api.demoMode && !isValidMongoId) {
        const { id: _ignoredId, ...cleanPayload } = payload;
        await api.create(resource, cleanPayload);
      } else {
        try {
          await api.update(resource, recordId, payload);
        } catch (err) {
          if (!api.demoMode && (err.message?.includes('Invalid record ID') || err.message?.includes('not found') || err.message?.includes('400') || err.message?.includes('404'))) {
            const { id: _ignoredId, ...cleanPayload } = payload;
            await api.create(resource, cleanPayload);
          } else {
            throw err;
          }
        }
      }
    } else {
      await api.create(resource, payload);
    }

    await reload();

    const entityName =
      type === 'student'
        ? 'Student'
        : type === 'session'
        ? 'Training session'
        : type === 'attendance'
        ? 'Attendance record'
        : type === 'batch'
        ? 'Batch'
        : 'Placement';

    showSuccess(`${entityName} ${recordId ? 'updated' : 'created'}.`);
  };

  const deleteBatchWithOptions = async (batch, { deleteStudents = false } = {}) => {
    if (!batch) return;
    const batchId = batch.id;
    const batchName = batch.name;

    // 1. Identify enrolled students
    const enrolledStudents = students.filter(
      (s) => s.batch === batchName || (batchId && s.batch === batchId)
    );

    if (deleteStudents) {
      // Cascading delete: permanently delete enrolled students in parallel
      await Promise.allSettled(
        enrolledStudents.map((st) => api.remove('students', st.id))
      );
    } else {
      // Keep students safe in directory by setting batch: '' (unassigned) in parallel
      await Promise.allSettled(
        enrolledStudents.map((st) => api.update('students', st.id, { ...st, batch: '' }))
      );
    }

    // 2. Delete the batch itself
    if (batchId) {
      const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(batchId);
      if (api.demoMode || isValidMongoId) {
        try {
          await api.remove('batches', batchId);
        } catch (err) {
          console.error(`Failed to delete batch ${batchId}:`, err);
        }
      }
    }

    await reload();

    if (deleteStudents) {
      showSuccess(
        `Batch "${batchName}" and ${enrolledStudents.length} enrolled learner record(s) deleted.`,
        'Batch & Table Deleted'
      );
    } else {
      showSuccess(
        `Batch "${batchName}" deleted. ${enrolledStudents.length} learner(s) preserved in directory.`,
        'Batch Deleted'
      );
    }
  };

  const clearBatchTable = async (batch) => {
    if (!batch) return;
    const batchId = batch.id;
    const batchName = batch.name;

    // 1. Find and disassociate enrolled students in parallel so table rows are not auto-populated
    const enrolledStudents = students.filter(
      (s) => s.batch === batchName || (batchId && s.batch === batchId)
    );
    await Promise.allSettled(
      enrolledStudents.map((st) => api.update('students', st.id, { ...st, batch: '' }))
    );

    // 2. Clear rows on the batch while preserving custom columns and batch metadata
    const updatedBatch = {
      ...batch,
      rows: [],
    };
    await saveRecord('batch', updatedBatch, batchId);

    showSuccess(
      `Cleared all table rows for "${batchName}". Batch details and custom columns remain intact.`,
      'Table Cleared'
    );
  };

  const deleteRecord = async (resource, recordId) => {
    await api.remove(resource, recordId);
    await reload();
    showSuccess('Record deleted.');
  };

  const deleteMultipleRecords = async (resource, recordIds) => {
    if (!recordIds || !recordIds.length) return;
    await Promise.allSettled(recordIds.map((id) => api.remove(resource, id)));
    await reload();
    showSuccess(
      `${recordIds.length} ${resource === 'students' ? 'learner' : 'record'}(s) deleted successfully.`,
      'Bulk Deletion'
    );
  };

  const importAttendance = async (record) => {
    await api.upsertAttendance(record);
    await reload();
  };

  const syncMeet = async (sessionId) => {
    const result = await api.syncMeet(sessionId);
    await reload();
    showSuccess(
      `${result.imported ?? 0} attendance record(s) updated from Google Meet.`,
      'Meet attendance synced'
    );
    return result;
  };

  return {
    students,
    sessions,
    attendance,
    placements,
    batches,
    loading,
    reload,
    saveRecord,
    deleteRecord,
    deleteMultipleRecords,
    deleteBatchWithOptions,
    clearBatchTable,
    importAttendance,
    syncMeet,
  };
}
