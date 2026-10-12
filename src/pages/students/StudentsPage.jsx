import React, { useMemo, useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Group,
  Paper,
  Progress,
  ScrollArea,
  Select,
  Table,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconFilter, IconPlus, IconTable } from '@tabler/icons-react';
import PageHeader from '../../components/common/PageHeader';
import SearchBox from '../../components/common/SearchBox';
import TableActions from '../../components/common/TableActions';
import EmptyState from '../../components/common/EmptyState';
import { fields, studentStatuses } from '../../data';
import {
  formatDate,
  formatDuration,
  initials,
  initialsColor,
  statusColor,
  totalSeconds,
} from '../../utils/formatters';

export default function StudentsPage({
  students = [],
  batches = [],
  attendance = [],
  search = '',
  setSearch,
  onAdd,
  onEdit,
  onDelete,
  attendanceThreshold = '75',
  onNavigate,
}) {
  const [fieldFilter, setFieldFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');

  const filtered = useMemo(() => {
    return students.filter((student) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        [student.name, student.email, student.lmsUsername, student.field, student.batch, student.phone].some((value) =>
          String(value || '').toLowerCase().includes(q)
        );
      return (
        matchesSearch &&
        (fieldFilter === 'all' || student.field === fieldFilter) &&
        (statusFilter === 'all' || student.status === statusFilter) &&
        (batchFilter === 'all' || student.batch === batchFilter)
      );
    });
  }, [students, search, fieldFilter, statusFilter, batchFilter]);

  const uniqueFields = useMemo(() => {
    const list = [...new Set([...fields, ...students.map((s) => s.field).filter(Boolean)])].sort();
    return [{ value: 'all', label: 'All fields' }, ...list.map((f) => ({ value: f, label: f }))];
  }, [students]);

  const uniqueBatches = useMemo(() => {
    const map = new Map();
    batches.forEach((b) => {
      if (b.name) {
        const count = students.filter((s) => s.batch === b.name || s.batch === b.id).length;
        map.set(b.name, `${b.code ? `[${b.code}] ` : ''}${b.name} (${count})`);
      }
    });
    students.forEach((s) => {
      if (s.batch && !map.has(s.batch)) {
        map.set(s.batch, s.batch);
      }
    });
    return [
      { value: 'all', label: 'All batches' },
      ...Array.from(map.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [batches, students]);

  const statusOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All statuses' },
      ...studentStatuses.map((v) => ({ value: v, label: v })),
    ];
  }, []);

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="Your learners, all in one place. Synchronized in real time with your batch spreadsheet tables."
        eyebrow="LEARNER DIRECTORY"
        action={
          <Button leftSection={<IconPlus size={17} />} onClick={onAdd}>
            Add student
          </Button>
        }
      />

      {/* Cohort Sync Metrics Summary */}
      <Group gap="xs" mb="md" wrap="wrap">
        <Badge size="md" variant="light" color="indigo" radius="md">
          {students.length} Total Enrolled Learners
        </Badge>
        <Badge size="md" variant="light" color="teal" radius="md">
          {students.filter((s) => s.batch).length} Assigned to Cohorts
        </Badge>
        {students.some((s) => !s.batch) && (
          <Badge size="md" variant="light" color="orange" radius="md">
            {students.filter((s) => !s.batch).length} Unassigned
          </Badge>
        )}
        <Badge size="md" variant="outline" color="blue" radius="md">
          {batches.length} Dynamic Batches Connected
        </Badge>
      </Group>

      <div className="toolbar-row">
        <SearchBox value={search} onChange={setSearch} placeholder="Search by name, email, field, LMS ID..." />
        <Select
          className="filter-select"
          leftSection={<IconFilter size={15} />}
          data={uniqueFields}
          value={fieldFilter}
          onChange={(v) => setFieldFilter(v || 'all')}
          searchable
        />
        <Select
          className="filter-select batch-filter"
          data={uniqueBatches}
          value={batchFilter}
          onChange={(v) => setBatchFilter(v || 'all')}
          searchable
        />
        <Select
          className="filter-select status-filter"
          data={statusOptions}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v || 'all')}
        />
        <Text size="sm" c="dimmed" className="result-count">
          {filtered.length} learners
        </Text>
      </div>

      <Paper className="table-card" withBorder radius="lg">
        {filtered.length ? (
          <ScrollArea>
            <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover miw={1000}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Student</Table.Th>
                  <Table.Th>Training field</Table.Th>
                  <Table.Th>Batch / cohort</Table.Th>
                  <Table.Th>Enrolled</Table.Th>
                  <Table.Th>Attendance</Table.Th>
                  <Table.Th>Learning time</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th ta="right">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((student) => {
                  const records = attendance.filter((item) => item.studentId === student.id);
                  const attended = records.filter((item) =>
                    ['Present', 'Late'].includes(item.status)
                  ).length;
                  const rate = records.length ? Math.round((attended / records.length) * 100) : 0;
                  const studentSeconds = records.reduce(
                    (sum, item) => sum + totalSeconds(item.segments),
                    0
                  );

                  const matchingBatch = batches.find(
                    (b) => b.name === student.batch || b.id === student.batch || (b.code && b.code === student.batch)
                  );

                  return (
                    <Table.Tr key={student.id}>
                      <Table.Td>
                        <Group gap="sm" wrap="nowrap">
                          <Avatar color={initialsColor(student.name)} radius="xl">
                            {initials(student.name)}
                          </Avatar>
                          <div>
                            <Group gap={6} align="center">
                              <Text fw={650} size="sm">
                                {student.name}
                              </Text>
                              {student.lmsUsername && (
                                <Badge size="xs" variant="outline" color="indigo">
                                  {student.lmsUsername}
                                </Badge>
                              )}
                            </Group>
                            <Text c="dimmed" size="xs">
                              {student.email}
                            </Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <div className="field-cell">
                          <span className="field-dot" />
                          {student.field}
                        </div>
                      </Table.Td>
                      <Table.Td>
                        {matchingBatch ? (
                          <Tooltip
                            label={`Trainer: ${matchingBatch.trainer || 'Unassigned'} · ${matchingBatch.timing || 'Schedule TBA'} · Click to view spreadsheet`}
                            withArrow
                          >
                            <Group
                              gap={6}
                              align="center"
                              style={{ cursor: onNavigate ? 'pointer' : 'default' }}
                              onClick={() => onNavigate?.('/batches')}
                            >
                              {matchingBatch.code && (
                                <Badge size="xs" variant="filled" color="indigo" radius="sm">
                                  {matchingBatch.code}
                                </Badge>
                              )}
                              <Text size="sm" fw={600} c="indigo.8">
                                {matchingBatch.name}
                              </Text>
                            </Group>
                          </Tooltip>
                        ) : student.batch ? (
                          <Badge size="sm" variant="light" color="gray">
                            {student.batch}
                          </Badge>
                        ) : (
                          <Badge size="xs" variant="dot" color="orange">
                            Unassigned
                          </Badge>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {formatDate(student.enrollmentDate)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <div className="attendance-mini">
                          <div>
                            <Text size="sm" fw={650}>
                              {records.length ? `${rate}%` : '—'}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {records.length ? `${attended}/${records.length} sessions` : 'No records'}
                            </Text>
                          </div>
                          {records.length > 0 && (
                            <Progress
                              value={rate}
                              size="xs"
                              w={56}
                              color={rate >= Number(attendanceThreshold) ? 'teal' : 'orange'}
                              radius="xl"
                            />
                          )}
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={700} size="sm">
                          {formatDuration(studentSeconds)}
                        </Text>
                        <Text c="dimmed" size="xs">
                          Across sessions
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={statusColor(student.status)} variant="light" radius="sm">
                          {student.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} justify="flex-end" wrap="nowrap">
                          {matchingBatch && onNavigate && (
                            <Tooltip label={`Open "${matchingBatch.name}" dynamic spreadsheet table`} withArrow>
                              <ActionIcon
                                variant="subtle"
                                color="indigo"
                                size="sm"
                                radius="md"
                                onClick={() => onNavigate('/batches')}
                                aria-label="Open in Batch Table"
                              >
                                <IconTable size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                          <TableActions
                            onEdit={() => onEdit(student)}
                            onDelete={() => onDelete(student)}
                          />
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        ) : (
          <EmptyState
            title="No students found"
            description="Try changing your filters, or add a learner to get started."
            action={
              <Button leftSection={<IconPlus size={16} />} onClick={onAdd}>
                Add student
              </Button>
            }
          />
        )}
        <div className="table-footer">
          <Text size="xs" c="dimmed">
            Student records · All changes are editable
          </Text>
          <Text size="xs" c="dimmed">
            Showing {filtered.length} of {students.length}
          </Text>
        </div>
      </Paper>
    </>
  );
}
