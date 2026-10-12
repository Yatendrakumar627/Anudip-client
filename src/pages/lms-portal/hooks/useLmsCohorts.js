import { useMemo } from 'react';

export function useLmsCohorts(batches = [], students = []) {
  return useMemo(() => {
    const list = [];
    const seenCohortKeys = new Set();

    // Pre-index students for O(1) lookups instead of repeated O(N) array scans
    const studentsByLms = new Map();
    const studentsByEmail = new Map();
    const studentsByName = new Map();
    const studentsByBatch = new Map();

    (students || []).forEach((s) => {
      const sLms = String(s.lmsUsername || '').trim().toLowerCase();
      const sEmail = String(s.email || '').trim().toLowerCase();
      const sName = String(s.name || '').trim().toLowerCase();
      const sBatch = String(s.batch || '').trim().toLowerCase();

      if (sLms && !studentsByLms.has(sLms)) studentsByLms.set(sLms, s);
      if (sEmail && !studentsByEmail.has(sEmail)) studentsByEmail.set(sEmail, s);
      if (sName && !studentsByName.has(sName)) studentsByName.set(sName, s);

      if (sBatch) {
        if (!studentsByBatch.has(sBatch)) studentsByBatch.set(sBatch, []);
        studentsByBatch.get(sBatch).push(s);
      }
    });

    // 1. Process batches passed from state/props
    (batches || []).forEach((b, idx) => {
      const bName = String(b.name || `Batch ${idx + 1}`);
      const bId = String(b.id || `batch_${idx + 1}`);
      const bNameLower = bName.toLowerCase();
      const bIdLower = bId.toLowerCase();
      seenCohortKeys.add(bIdLower);
      seenCohortKeys.add(bNameLower);

      const cohortStudents = [];
      const seenStudentKeys = new Set();

      // Collect all restricted keys and labels for this cohort from batch settings
      const restrictedKeySet = new Set();
      (b.columns || []).forEach((c) => {
        if (c && (c.hiddenOnLms || c.hidden || c.visible === false)) {
          if (c.key) {
            const k = String(c.key).toLowerCase().trim();
            restrictedKeySet.add(k);
            restrictedKeySet.add(k.replace(/[^a-z0-9]/g, ''));
          }
          if (c.label) {
            const l = String(c.label).toLowerCase().trim();
            restrictedKeySet.add(l);
            restrictedKeySet.add(l.replace(/[^a-z0-9]/g, ''));
          }
        }
      });

      // Filter visible columns for the LMS Portal strictly
      const visibleColumns = (b.columns || []).filter((c) => {
        if (!c) return false;
        if (c.hiddenOnLms || c.hidden || c.visible === false) return false;
        const k = String(c.key || '').toLowerCase().trim();
        const l = String(c.label || '').toLowerCase().trim();
        const kClean = k.replace(/[^a-z0-9]/g, '');
        const lClean = l.replace(/[^a-z0-9]/g, '');
        return !restrictedKeySet.has(k) && !restrictedKeySet.has(l) && !restrictedKeySet.has(kClean) && !restrictedKeySet.has(lClean);
      });

      // A. Extract from batch.rows (dynamic spreadsheet table)
      if (b.rows && Array.isArray(b.rows) && b.rows.length > 0) {
        b.rows.forEach((row, rIdx) => {
          const lmsUsername = String(
            row.lmsUsername != null
              ? row.lmsUsername
              : row['LMS User ID'] != null
              ? row['LMS User ID']
              : row['lms_id'] != null
              ? row['lms_id']
              : ''
          ).trim();
          const name = String(row.name != null ? row.name : row['Student Name'] || '').trim();
          const email = String(row.email != null ? row.email : row['Email'] || '').trim();
          const phone = String(row.phone != null ? row.phone : row['Phone'] || '').trim();

          // Custom dynamic fields created in this batch's spreadsheet - strictly visible columns only
          const customFields = [];
          visibleColumns.forEach((col) => {
            const kNorm = String(col.key || '').toLowerCase().trim();
            const lNorm = String(col.label || '').toLowerCase().trim();
            if (
              !['name', 'lmsusername', 'lmspassword', 'email'].includes(kNorm) &&
              !['student name', 'user name', 'lms user id', 'password', 'email'].includes(lNorm)
            ) {
              const val = row[col.key] ?? row[col.label];
              customFields.push({
                key: col.key,
                label: col.label || col.key,
                value: val != null && String(val).trim() !== '' ? String(val) : '—',
                type: col.type,
              });
            }
          });

          // O(1) student matching in global state for password/phone fallback
          const curLms = lmsUsername.toLowerCase();
          const curEmail = email.toLowerCase();
          const curName = name.toLowerCase();

          const matchedSeed =
            (curLms ? studentsByLms.get(curLms) : null) ||
            (curEmail ? studentsByEmail.get(curEmail) : null) ||
            (curName ? studentsByName.get(curName) : null);

          // Deeply sanitize rawRow to purge all restricted details
          const sanitizedRawRow = { ...row };
          Object.keys(sanitizedRawRow).forEach((rk) => {
            const normRk = String(rk).toLowerCase().trim();
            const cleanRk = normRk.replace(/[^a-z0-9]/g, '');
            if (restrictedKeySet.has(normRk) || restrictedKeySet.has(cleanRk)) {
              delete sanitizedRawRow[rk];
            }
          });

          const isPhoneRestricted =
            restrictedKeySet.has('phone') ||
            restrictedKeySet.has('mobileno') ||
            restrictedKeySet.has('mobile') ||
            restrictedKeySet.has('contact');

          const isEmailRestricted =
            restrictedKeySet.has('email') ||
            restrictedKeySet.has('emailid') ||
            restrictedKeySet.has('mail');

          const studentObj = {
            ...sanitizedRawRow,
            id: row.id || `batch_${b.id}_row_${rIdx}`,
            lmsUsername,
            name: name || 'Student',
            lmsPassword: row.lmsPassword != null ? String(row.lmsPassword) : matchedSeed?.lmsPassword || '',
            email: isEmailRestricted ? '' : (email || matchedSeed?.email || ''),
            phone: isPhoneRestricted ? '' : (phone || matchedSeed?.phone || ''),
            field: b.field || matchedSeed?.field || '',
            batch: bName,
            batchId: bId,
            batchCode: b.code || '',
            batchStatus: b.status || 'Active',
            trainer: b.trainer || '',
            timing: b.timing || '',
            meetLink: b.meetLink || '',
            customFields,
            rawRow: sanitizedRawRow,
            source: 'dynamic_batch',
          };

          // Remove any studentObj property matching restricted keys
          restrictedKeySet.forEach((rk) => {
            if (rk && studentObj[rk] !== undefined && !['id', 'name', 'lmsusername', 'lmspassword'].includes(rk)) {
              delete studentObj[rk];
            }
          });

          const sKey = `${lmsUsername || name || rIdx}_${bName}`.toLowerCase();
          seenStudentKeys.add(sKey);
          cohortStudents.push(studentObj);
        });
      }

      // B. Attach global students assigned to this cohort in O(1) batch lookup
      const batchAssignedStudents = [
        ...(studentsByBatch.get(bNameLower) || []),
        ...((bIdLower !== bNameLower && studentsByBatch.get(bIdLower)) || []),
      ];

      batchAssignedStudents.forEach((s, sIdx) => {
        const sLms = String(s.lmsUsername || '').trim();
        const sName = String(s.name || '').trim();
        const sKey = `${sLms || sName || sIdx}_${bName}`.toLowerCase();
        if (!seenStudentKeys.has(sKey)) {
          seenStudentKeys.add(sKey);
          cohortStudents.push({
            ...s,
            id: s.id || `std_${sIdx}`,
            lmsUsername: sLms,
            name: sName || 'Student',
            lmsPassword: s.lmsPassword || '',
            email: s.email || '',
            phone: s.phone || '',
            field: s.field || b.field || '',
            batch: bName,
            batchId: bId,
            batchCode: b.code || '',
            batchStatus: b.status || 'Active',
            trainer: b.trainer || '',
            timing: b.timing || '',
            meetLink: b.meetLink || '',
            customFields: [],
            rawRow: s,
            source: 'global_directory',
          });
        }
      });

      list.push({
        id: bId,
        name: bName,
        code: b.code || '',
        field: b.field || '',
        trainer: b.trainer || '',
        timing: b.timing || '',
        meetLink: b.meetLink || '',
        status: b.status || 'Active',
        startDate: b.startDate,
        endDate: b.endDate,
        description: b.description,
        columns: visibleColumns,
        restrictedKeys: Array.from(restrictedKeySet),
        students: cohortStudents,
      });
    });

    // 2. Incorporate any students with a batch not yet listed in `batches`
    (students || []).forEach((s) => {
      const sBatch = String(s.batch || '').trim();
      if (sBatch && !seenCohortKeys.has(sBatch.toLowerCase())) {
        seenCohortKeys.add(sBatch.toLowerCase());
        const extraId = `batch_extra_${sBatch.replace(/\s+/g, '_').toLowerCase()}`;
        list.push({
          id: extraId,
          name: sBatch,
          code: '',
          field: s.field || '',
          trainer: s.trainer || '',
          timing: s.timing || '',
          meetLink: s.meetLink || '',
          status: 'Active',
          columns: [],
          students: [
            {
              ...s,
              batchId: extraId,
              batchCode: '',
              batchStatus: 'Active',
              trainer: s.trainer || '',
              timing: s.timing || '',
              meetLink: s.meetLink || '',
              customFields: [],
              rawRow: s,
            },
          ],
        });
      }
    });

    return list;
  }, [batches, students]);
}
