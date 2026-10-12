import React, { useMemo, useRef, useState } from 'react';
import { Button, Group } from '@mantine/core';
import Papa from 'papaparse';
import { IconDownload, IconPlus } from '@tabler/icons-react';
import PageHeader from '../../components/common/PageHeader';
import { attendanceStatuses } from '../../data';
import { formatDate, totalSeconds } from '../../utils/formatters';
import { showError, showWarning } from '../../utils/notifications';

// Subcomponents
import AttendanceNote from './components/AttendanceNote';
import AttendanceStats from './components/AttendanceStats';
import AttendanceToolbar from './components/AttendanceToolbar';
import AttendanceTable from './components/AttendanceTable';

export default function AttendancePage({
  students = [],
  sessions = [],
  attendance = [],
  search = '',
  setSearch,
  onAdd,
  onEdit,
  onDelete,
  onImport,
  onSync,
}) {
  const [sessionFilter, setSessionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const activeSession = sessions.find((s) => s.id === sessionFilter);

  // Filtered rows
  const visibleRows = useMemo(() => {
    let list = attendance.filter((a) => sessionFilter === 'all' || a.sessionId === sessionFilter);
    list = list
      .map((record) => ({
        ...record,
        student: students.find((s) => s.id === record.studentId),
        session: sessions.find((s) => s.id === record.sessionId),
      }))
      .filter((record) => record.student);

    const q = search.toLowerCase();
    return list
      .filter((record) => {
        const matchSearch =
          !q ||
          [record.student?.name, record.student?.email, record.student?.field, record.session?.title].some(
            (v) => String(v || '').toLowerCase().includes(q)
          );
        return matchSearch && (statusFilter === 'all' || record.status === statusFilter);
      })
      .sort((a, b) => totalSeconds(b.segments) - totalSeconds(a.segments));
  }, [attendance, students, sessions, sessionFilter, statusFilter, search]);

  // Aggregate stats
  const currentTotal = visibleRows.reduce((sum, row) => sum + totalSeconds(row.segments), 0);
  const presentCount = visibleRows.filter((row) => ['Present', 'Late'].includes(row.status)).length;
  const attendanceRate = visibleRows.length
    ? Math.round((presentCount / visibleRows.length) * 100)
    : 0;

  // Import CSV parsing
  const parseImport = (file) => {
    if (!file) return;
    if (sessionFilter === 'all') {
      showWarning(
        'Select the session this Google Meet report belongs to, then import the CSV.',
        'Choose a session first'
      );
      return;
    }

    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data.map((row) => {
            const name = row['Name'] || row['Participant Name'] || row['Full Name'] || '';
            const email = row['Email'] || row['Participant Email'] || '';
            const joinedAt = row['Join Time'] || row['First Join'] || row['Join time'] || '';
            const leftAt = row['Leave Time'] || row['Last Leave'] || row['Leave time'] || '';
            const duration = row['Duration'] || row['Duration (minutes)'] || '';

            return {
              name: name.trim(),
              email: email.trim(),
              joinedAt: joinedAt.trim(),
              leftAt: leftAt.trim(),
              duration: duration.trim(),
              raw: row,
            };
          });

          const matched = [];
          const unmatched = [];

          rows.forEach((row) => {
            const rEmail = String(row.email || '').trim().toLowerCase();
            const rName = String(row.name || '').trim().toLowerCase();

            const student = students.find((s) => {
              const sEmail = String(s.email || '').trim().toLowerCase();
              const sName = String(s.name || '').trim().toLowerCase();
              const sMeet = String(s.meetDisplayName || '').trim().toLowerCase();

              return (
                (rEmail && sEmail && sEmail === rEmail) ||
                (rName && sName && sName === rName) ||
                (rName && sMeet && sMeet === rName)
              );
            });

            if (student) {
              matched.push({ student, row });
            } else if (row.name || row.email) {
              unmatched.push(row);
            }
          });

          await onImport({
            sessionId: sessionFilter,
            matched,
            unmatched,
            fileName: file.name,
          });
        } catch (error) {
          showError(error);
        } finally {
          setImporting(false);
          if (fileRef.current) fileRef.current.value = '';
        }
      },
      error: (error) => {
        setImporting(false);
        showError(error);
      },
    });
  };

  // Export CSV
  const exportCsv = () => {
    const rows = visibleRows.map((row) => ({
      student: row.student?.name || '',
      email: row.student?.email || '',
      session: row.session?.title || '',
      date: row.date || '',
      status: row.status || '',
      join_times: (row.segments || []).map((s) => s.joinedAt).join(' | '),
      leave_times: (row.segments || []).map((s) => s.leftAt || '').join(' | '),
      total_minutes: Math.round(totalSeconds(row.segments) / 60),
      source: row.source || 'manual',
      notes: row.notes || '',
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${sessionFilter !== 'all' ? sessionFilter : 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sessionOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All sessions' },
      ...sessions.map((s) => ({
        value: s.id,
        label: `${s.title} · ${formatDate(s.date)}`,
      })),
    ];
  }, [sessions]);

  const statusOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All statuses' },
      ...attendanceStatuses.map((v) => ({ value: v, label: v })),
    ];
  }, []);

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle="Track who attended, when they joined, when they left and their total learning time."
        eyebrow="STUDENT ENGAGEMENT"
        action={
          <Group gap="xs">
            <Button
              variant="default"
              leftSection={<IconDownload size={16} />}
              onClick={exportCsv}
            >
              Export CSV
            </Button>
            <Button leftSection={<IconPlus size={17} />} onClick={onAdd}>
              Add record
            </Button>
          </Group>
        }
      />

      <AttendanceNote />

      <AttendanceStats
        visibleCount={visibleRows.length}
        presentCount={presentCount}
        attendanceRate={attendanceRate}
        currentTotal={currentTotal}
        activeSessionTitle={activeSession?.title || 'Across all sessions'}
      />

      <AttendanceToolbar
        search={search}
        setSearch={setSearch}
        sessionOptions={sessionOptions}
        sessionFilter={sessionFilter}
        setSessionFilter={setSessionFilter}
        statusOptions={statusOptions}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        importing={importing}
        fileRef={fileRef}
        onImportFile={parseImport}
      />

      <AttendanceTable
        visibleRows={visibleRows}
        onEdit={onEdit}
        onDelete={onDelete}
        onSync={onSync}
      />
    </>
  );
}
