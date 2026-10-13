import React, { useMemo, useState, useEffect } from 'react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Checkbox,
  Group,
  Menu,
  Modal,
  Pagination,
  Paper,
  Progress,
  ScrollArea,
  SegmentedControl,
  Select,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Tooltip,
  Alert,
} from '@mantine/core';
import {
  IconCheck,
  IconCopy,
  IconDownload,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconEyeOff,
  IconFilter,
  IconLayoutGrid,
  IconList,
  IconPlus,
  IconSchool,
  IconSortAscending,
  IconTable,
  IconTrash,
  IconUserCheck,
  IconUserExclamation,
  IconUsers,
  IconX,
  IconAlertTriangle,
} from '@tabler/icons-react';
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
import { showSuccess, showError } from '../../utils/notifications';

export default function StudentsPage({
  students = [],
  batches = [],
  attendance = [],
  search = '',
  setSearch,
  onAdd,
  onEdit,
  onDelete,
  onDeleteMultiple,
  attendanceThreshold = '75',
  onNavigate,
}) {
  // Default view mode is table form (with option to toggle cards)
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('anudip-students-view-mode') || 'table';
  });

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('anudip-students-view-mode', mode);
    } catch {}
  };

  // Filters & Sorting state
  const [fieldFilter, setFieldFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name_asc');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Quick Student Detail Modal
  const [previewStudent, setPreviewStudent] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setPage(1);
  }, [search, fieldFilter, statusFilter, batchFilter, sortBy, pageSize]);

  // Clean selectedIds if students are removed
  useEffect(() => {
    const existingIdSet = new Set(students.map((s) => s.id));
    setSelectedIds((prev) => prev.filter((id) => existingIdSet.has(id)));
  }, [students]);

  // Unique fields for filter dropdown
  const uniqueFields = useMemo(() => {
    const list = [...new Set([...fields, ...students.map((s) => s.field).filter(Boolean)])].sort();
    return [{ value: 'all', label: 'All Fields' }, ...list.map((f) => ({ value: f, label: f }))];
  }, [students]);

  // Unique batches for filter dropdown
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

    const unassignedCount = students.filter((s) => !s.batch).length;

    return [
      { value: 'all', label: 'All Batches / Cohorts' },
      ...(unassignedCount > 0 ? [{ value: 'unassigned', label: `⚠️ Unassigned (${unassignedCount})` }] : []),
      ...Array.from(map.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [batches, students]);

  const statusOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Statuses' },
      ...studentStatuses.map((v) => ({ value: v, label: v })),
    ];
  }, []);

  const sortOptions = [
    { value: 'name_asc', label: 'Name (A → Z)' },
    { value: 'name_desc', label: 'Name (Z → A)' },
    { value: 'date_desc', label: 'Enrolled (Newest first)' },
    { value: 'date_asc', label: 'Enrolled (Oldest first)' },
    { value: 'attendance_desc', label: 'Attendance (Highest first)' },
    { value: 'attendance_asc', label: 'Attendance (Lowest first)' },
  ];

  // Helper map for student attendance stats
  const attendanceStatsMap = useMemo(() => {
    const map = new Map();
    students.forEach((student) => {
      const records = attendance.filter((item) => item.studentId === student.id);
      const attended = records.filter((item) => ['Present', 'Late'].includes(item.status)).length;
      const rate = records.length ? Math.round((attended / records.length) * 100) : 0;
      const sec = records.reduce((sum, item) => sum + totalSeconds(item.segments), 0);
      map.set(student.id, { recordsCount: records.length, attendedCount: attended, rate, totalSec: sec });
    });
    return map;
  }, [students, attendance]);

  // Filtered & Sorted learners list
  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase().trim();
    const result = students.filter((student) => {
      const matchesSearch =
        !q ||
        [student.name, student.email, student.lmsUsername, student.field, student.batch, student.phone].some((value) =>
          String(value || '').toLowerCase().includes(q)
        );

      const matchesBatch =
        batchFilter === 'all'
          ? true
          : batchFilter === 'unassigned'
          ? !student.batch
          : student.batch === batchFilter;

      return (
        matchesSearch &&
        (fieldFilter === 'all' || student.field === fieldFilter) &&
        (statusFilter === 'all' || student.status === statusFilter) &&
        matchesBatch
      );
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      if (sortBy === 'date_desc') return new Date(b.enrollmentDate || 0) - new Date(a.enrollmentDate || 0);
      if (sortBy === 'date_asc') return new Date(a.enrollmentDate || 0) - new Date(b.enrollmentDate || 0);
      if (sortBy === 'attendance_desc') {
        const rateA = attendanceStatsMap.get(a.id)?.rate || 0;
        const rateB = attendanceStatsMap.get(b.id)?.rate || 0;
        return rateB - rateA;
      }
      if (sortBy === 'attendance_asc') {
        const rateA = attendanceStatsMap.get(a.id)?.rate || 0;
        const rateB = attendanceStatsMap.get(b.id)?.rate || 0;
        return rateA - rateB;
      }
      return 0;
    });

    return result;
  }, [students, search, fieldFilter, statusFilter, batchFilter, sortBy, attendanceStatsMap]);

  // Paginated learners for the current page
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Multi-selection helpers
  const currentPageIds = useMemo(() => paginatedStudents.map((s) => s.id), [paginatedStudents]);
  const isAllCurrentPageSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));
  const isSomeCurrentPageSelected =
    currentPageIds.some((id) => selectedIds.includes(id)) && !isAllCurrentPageSelected;

  const toggleSelectAllCurrentPage = () => {
    if (isAllCurrentPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const toggleSelectStudent = (studentId) => {
    setSelectedIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const selectAllFiltered = () => {
    setSelectedIds(filtered.map((s) => s.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Perform bulk deletion
  const handleConfirmBulkDelete = async () => {
    if (!selectedIds.length) return;
    setBulkDeleting(true);
    try {
      if (onDeleteMultiple) {
        await onDeleteMultiple(selectedIds);
      } else if (onDelete) {
        for (const id of selectedIds) {
          const studentObj = students.find((s) => s.id === id);
          if (studentObj) await onDelete(studentObj);
        }
      }
      setSelectedIds([]);
      setBulkDeleteModalOpen(false);
    } catch (err) {
      showError(err);
    } finally {
      setBulkDeleting(false);
    }
  };

  // Export learners to Excel
  const handleExportExcel = async (exportOnlySelected = false) => {
    const listToExport = exportOnlySelected
      ? students.filter((s) => selectedIds.includes(s.id))
      : filtered;

    if (!listToExport.length) {
      showError(new Error('No learners available to export.'));
      return;
    }

    const XLSX = await import('xlsx');

    const data = listToExport.map((s, idx) => {
      const stats = attendanceStatsMap.get(s.id) || { recordsCount: 0, attendedCount: 0, rate: 0, totalSec: 0 };
      return {
        '#': idx + 1,
        'Student Name': s.name || '',
        'Email Address': s.email || '',
        'Phone Number': s.phone || '',
        'LMS User Name': s.lmsUsername || '',
        'LMS Password': s.lmsPassword || '',
        'Training Field': s.field || '',
        'Batch / Cohort': s.batch || 'Unassigned',
        'Enrollment Date': formatDate(s.enrollmentDate),
        'Status': s.status || 'Active',
        'Attendance %': `${stats.rate}%`,
        'Attended Sessions': `${stats.attendedCount}/${stats.recordsCount}`,
        'Learning Duration': formatDuration(stats.totalSec),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Learners Directory');

    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((r) => String(r[key] || '').length)) + 3,
    }));
    worksheet['!cols'] = colWidths;

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Anudip_Learners_Directory_${dateStr}.xlsx`);
    showSuccess(`Exported ${listToExport.length} learners to Excel successfully.`);
  };

  // Overview metrics
  const totalEnrolled = students.length;
  const assignedCount = useMemo(() => students.filter((s) => s.batch).length, [students]);
  const unassignedCount = totalEnrolled - assignedCount;
  const activeCount = useMemo(() => students.filter((s) => s.status === 'Active').length, [students]);
  const overallAvgAttendance = useMemo(() => {
    if (!students.length) return 0;
    let sum = 0;
    students.forEach((s) => {
      sum += attendanceStatsMap.get(s.id)?.rate || 0;
    });
    return Math.round(sum / students.length);
  }, [students, attendanceStatsMap]);

  const hasActiveFilters =
    Boolean(search) || fieldFilter !== 'all' || batchFilter !== 'all' || statusFilter !== 'all';

  const resetAllFilters = () => {
    setSearch?.('');
    setFieldFilter('all');
    setBatchFilter('all');
    setStatusFilter('all');
    setSortBy('name_asc');
  };

  const selectedStudentsObjects = useMemo(() => {
    return students.filter((s) => selectedIds.includes(s.id));
  }, [students, selectedIds]);

  return (
    <>
      <PageHeader
        title="Students Directory"
        subtitle="Manage enrolled learners, batch cohort assignments, LMS access credentials, and track session attendance in real time."
        eyebrow="LEARNER WORKSPACE"
        action={
          <Group gap="xs" style={{ width: '100%' }}>
            <Button
              variant="default"
              leftSection={<IconDownload size={16} />}
              onClick={() => handleExportExcel(false)}
              disabled={!filtered.length}
            >
              Export Excel
            </Button>
            <Button leftSection={<IconPlus size={16} />} onClick={onAdd}>
              Add student
            </Button>
          </Group>
        }
      />

      {/* Justified Responsive 5-card / 2x2 Mobile KPI Stats Grid */}
      <div className="students-stats-grid">
        <div className="students-stat-box">
          <div className="students-stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>
            <IconUsers size={20} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Total Enrolled
            </Text>
            <Text size="xl" fw={800} c="dark.7">
              {totalEnrolled}
            </Text>
          </div>
        </div>

        <div className="students-stat-box">
          <div className="students-stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <IconSchool size={20} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Assigned Cohort
            </Text>
            <Group gap={4} align="baseline">
              <Text size="xl" fw={800} c="dark.7">
                {assignedCount}
              </Text>
              <Text size="xs" c="teal" fw={700}>
                ({totalEnrolled ? Math.round((assignedCount / totalEnrolled) * 100) : 0}%)
              </Text>
            </Group>
          </div>
        </div>

        <div
          className="students-stat-box"
          style={{ cursor: unassignedCount > 0 ? 'pointer' : 'default' }}
          onClick={() => unassignedCount > 0 && setBatchFilter('unassigned')}
          title={unassignedCount > 0 ? 'Click to filter unassigned learners' : undefined}
        >
          <div className="students-stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <IconUserExclamation size={20} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Unassigned
            </Text>
            <Group gap={4} align="baseline">
              <Text size="xl" fw={800} c={unassignedCount > 0 ? 'orange.8' : 'dark.7'}>
                {unassignedCount}
              </Text>
              {unassignedCount > 0 && (
                <Badge size="xs" color="orange" variant="light" style={{ padding: '0 4px', height: 16 }}>
                  Filter
                </Badge>
              )}
            </Group>
          </div>
        </div>

        <div className="students-stat-box">
          <div className="students-stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <IconUserCheck size={20} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Active Learners
            </Text>
            <Text size="xl" fw={800} c="dark.7">
              {activeCount}
            </Text>
          </div>
        </div>

        {/* 5th Card: Avg Attendance (spans 2 columns on mobile) */}
        <div className="students-stat-box">
          <div className="students-stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <IconCheck size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Avg. Attendance
            </Text>
            <Group gap={8} align="center" wrap="nowrap">
              <Text size="lg" fw={800} c="indigo.8" style={{ whiteSpace: 'nowrap' }}>
                {overallAvgAttendance}%
              </Text>
              <Progress
                value={overallAvgAttendance}
                size="sm"
                color={overallAvgAttendance >= Number(attendanceThreshold) ? 'teal' : 'orange'}
                radius="xl"
                style={{ flex: 1, minWidth: 60 }}
              />
            </Group>
          </div>
        </div>
      </div>

      {/* Bulk Action Banner (Justified for both mobile and desktop) */}
      {selectedIds.length > 0 && (
        <div className="students-bulk-banner">
          <div className="students-bulk-top-group">
            <Group gap="xs" align="center">
              <Badge size="md" variant="filled" color="indigo" radius="md">
                {selectedIds.length} selected
              </Badge>

              {selectedIds.length < filtered.length && (
                <Button
                  variant="subtle"
                  color="gray"
                  size="compact-xs"
                  styles={{ root: { color: '#c7d2fe' } }}
                  onClick={selectAllFiltered}
                >
                  All ({filtered.length})
                </Button>
              )}
            </Group>

            <Button
              variant="subtle"
              color="gray"
              size="compact-xs"
              styles={{ root: { color: '#e0e7ff' } }}
              onClick={clearSelection}
              leftSection={<IconX size={12} />}
            >
              Deselect
            </Button>
          </div>

          <div className="students-bulk-actions-group">
            <Button
              variant="light"
              color="indigo"
              size="xs"
              leftSection={<IconDownload size={14} />}
              onClick={() => handleExportExcel(true)}
              styles={{ root: { background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff' } }}
            >
              Export ({selectedIds.length})
            </Button>
            <Button
              variant="filled"
              color="red"
              size="xs"
              leftSection={<IconTrash size={14} />}
              onClick={() => setBulkDeleteModalOpen(true)}
            >
              Delete ({selectedIds.length})
            </Button>
          </div>
        </div>
      )}

      {/* Advanced Toolbar Filters with Mobile Justification */}
      <div className="students-toolbar-wrap">
        <div className="students-search-row">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email, LMS ID, phone, batch..."
          />
        </div>

        <div className="students-filters-grid">
          <Select
            leftSection={<IconFilter size={15} />}
            data={uniqueFields}
            value={fieldFilter}
            onChange={(v) => setFieldFilter(v || 'all')}
            searchable
            placeholder="Filter Field"
          />

          <Select
            data={uniqueBatches}
            value={batchFilter}
            onChange={(v) => setBatchFilter(v || 'all')}
            searchable
            placeholder="Filter Batch"
          />

          <Select
            data={statusOptions}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v || 'all')}
            placeholder="Filter Status"
          />

          <Select
            leftSection={<IconSortAscending size={15} />}
            data={sortOptions}
            value={sortBy}
            onChange={(v) => setSortBy(v || 'name_asc')}
            placeholder="Sort By"
          />
        </div>

        <div className="students-toolbar-footer">
          <Group gap="xs" align="center">
            {hasActiveFilters && (
              <Button
                variant="subtle"
                color="gray"
                size="compact-xs"
                onClick={resetAllFilters}
                leftSection={<IconX size={12} />}
              >
                Reset filters
              </Button>
            )}

            {/* View Mode Toggle: Table vs Cards */}
            <SegmentedControl
              size="xs"
              radius="md"
              value={viewMode}
              onChange={handleViewModeChange}
              data={[
                {
                  label: (
                    <Group gap={4} wrap="nowrap" align="center" style={{ fontSize: 11 }}>
                      <IconList size={13} />
                      Table
                    </Group>
                  ),
                  value: 'table',
                },
                {
                  label: (
                    <Group gap={4} wrap="nowrap" align="center" style={{ fontSize: 11 }}>
                      <IconLayoutGrid size={13} />
                      Cards
                    </Group>
                  ),
                  value: 'cards',
                },
              ]}
            />
          </Group>

          <Text size="xs" c="dimmed" fw={600}>
            Showing {paginatedStudents.length} of {filtered.length} learners
          </Text>
        </div>
      </div>

      {/* Main Content Area: Responsive Mobile Cards vs Desktop Table */}
      <Paper className="table-card" withBorder radius="lg" style={{ overflow: 'hidden' }}>
        {filtered.length ? (
          viewMode === 'cards' ? (
            /* Responsive Mobile & Tablet Cards View */
            <div className="students-cards-container">
              {/* Select All on Current Page Bar */}
              <Group
                justify="space-between"
                p="xs"
                style={{
                  background: '#f8fafc',
                  borderRadius: 10,
                  border: '1px solid #eef2f6',
                  fontSize: 12,
                }}
              >
                <Checkbox
                  size="xs"
                  label={`Select all on this page (${paginatedStudents.length})`}
                  checked={isAllCurrentPageSelected}
                  indeterminate={isSomeCurrentPageSelected}
                  onChange={toggleSelectAllCurrentPage}
                />
                <Text size="xs" c="dimmed">
                  Page {currentPage} of {totalPages}
                </Text>
              </Group>

              {/* Cards List */}
              {paginatedStudents.map((student) => {
                const stats = attendanceStatsMap.get(student.id) || {
                  recordsCount: 0,
                  attendedCount: 0,
                  rate: 0,
                  totalSec: 0,
                };
                const matchingBatch = batches.find(
                  (b) =>
                    b.name === student.batch ||
                    b.id === student.batch ||
                    (b.code && b.code === student.batch)
                );
                const isSelected = selectedIds.includes(student.id);

                return (
                  <div
                    key={student.id}
                    className={`student-mobile-card ${isSelected ? 'is-selected' : ''}`}
                  >
                    {/* Top Row: Checkbox, Avatar, Name & Status */}
                    <div className="student-mobile-card-top">
                      <Group gap="sm" wrap="nowrap" align="center" style={{ minWidth: 0, flex: 1 }}>
                        <Checkbox
                          size="xs"
                          checked={isSelected}
                          onChange={() => toggleSelectStudent(student.id)}
                          aria-label={`Select ${student.name}`}
                        />
                        <Avatar
                          color={initialsColor(student.name)}
                          radius="xl"
                          size="md"
                          style={{ cursor: 'pointer', flexShrink: 0 }}
                          onClick={() => setPreviewStudent(student)}
                        >
                          {initials(student.name)}
                        </Avatar>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <Group gap={6} align="center" wrap="nowrap">
                            <Text
                              fw={750}
                              size="sm"
                              className="students-quick-card"
                              onClick={() => setPreviewStudent(student)}
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {student.name}
                            </Text>
                            {student.lmsUsername && (
                              <Badge size="xs" variant="outline" color="indigo">
                                {student.lmsUsername}
                              </Badge>
                            )}
                          </Group>
                          <Text c="dimmed" size="xs" truncate>
                            {student.email || 'No email'}
                          </Text>
                        </div>
                      </Group>

                      {/* Status & 3-Dot Action Menu */}
                      <Group gap={6} wrap="nowrap" align="center">
                        <Badge color={statusColor(student.status)} variant="light" size="sm" radius="sm">
                          {student.status}
                        </Badge>
                        <Menu position="bottom-end" shadow="md" width={190} withinPortal>
                          <Menu.Target>
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="sm"
                              radius="md"
                              aria-label={`Options for ${student.name}`}
                            >
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEye size={15} color="#4f46e5" />}
                              onClick={() => setPreviewStudent(student)}
                            >
                              View Profile
                            </Menu.Item>
                            {matchingBatch && onNavigate && (
                              <Menu.Item
                                leftSection={<IconTable size={15} color="#4f46e5" />}
                                onClick={() => onNavigate('/batches')}
                              >
                                Open Cohort Table
                              </Menu.Item>
                            )}
                            <Menu.Item
                              leftSection={<IconEdit size={15} color="#4b5563" />}
                              onClick={() => onEdit?.(student)}
                            >
                              Edit Student
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                              color="red"
                              leftSection={<IconTrash size={15} />}
                              onClick={() => onDelete?.(student)}
                            >
                              Delete Student
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </div>

                    {/* Middle Row: Field, Cohort & Contact Pills */}
                    <div className="student-mobile-card-middle">
                      {student.field && (
                        <Badge size="xs" variant="light" color="indigo" radius="sm">
                          {student.field}
                        </Badge>
                      )}

                      {matchingBatch ? (
                        <Badge
                          size="xs"
                          variant="filled"
                          color="indigo"
                          radius="sm"
                          style={{ cursor: onNavigate ? 'pointer' : 'default' }}
                          onClick={() => onNavigate?.('/batches')}
                        >
                          {matchingBatch.code ? `[${matchingBatch.code}] ` : ''}
                          {matchingBatch.name}
                        </Badge>
                      ) : student.batch ? (
                        <Badge size="xs" variant="light" color="gray" radius="sm">
                          {student.batch}
                        </Badge>
                      ) : (
                        <Badge size="xs" variant="dot" color="orange">
                          Unassigned
                        </Badge>
                      )}

                      {student.phone && (
                        <Text size="11px" c="dimmed">
                          📞 {student.phone}
                        </Text>
                      )}
                    </div>

                    {/* Bottom Row: Attendance Progress & Session Hours */}
                    <div className="student-mobile-card-bottom">
                      <Group gap="xs" align="center" style={{ flex: 1 }}>
                        <Text size="xs" fw={700}>
                          {stats.recordsCount ? `${stats.rate}%` : '—'}
                        </Text>
                        <Progress
                          value={stats.rate}
                          size="xs"
                          color={stats.rate >= Number(attendanceThreshold) ? 'teal' : 'orange'}
                          radius="xl"
                          style={{ flex: 1, maxWidth: 100 }}
                        />
                        <Text size="10px" c="dimmed">
                          {stats.attendedCount}/{stats.recordsCount} sessions
                        </Text>
                      </Group>

                      <Text size="xs" fw={700} c="dimmed">
                        {formatDuration(stats.totalSec)}
                      </Text>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Traditional Desktop / Power Table View */
            <ScrollArea>
              <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover miw={1080}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 44 }}>
                      <Tooltip
                        label={
                          isAllCurrentPageSelected
                            ? 'Deselect all on this page'
                            : 'Select all on this page'
                        }
                        withArrow
                      >
                        <Checkbox
                          size="xs"
                          checked={isAllCurrentPageSelected}
                          indeterminate={isSomeCurrentPageSelected}
                          onChange={toggleSelectAllCurrentPage}
                          aria-label="Select all students on current page"
                        />
                      </Tooltip>
                    </Table.Th>
                    <Table.Th>Student</Table.Th>
                    <Table.Th>Training Field</Table.Th>
                    <Table.Th>Batch / Cohort</Table.Th>
                    <Table.Th>Enrolled</Table.Th>
                    <Table.Th>Attendance</Table.Th>
                    <Table.Th>Learning Time</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th ta="right">Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedStudents.map((student) => {
                    const stats = attendanceStatsMap.get(student.id) || {
                      recordsCount: 0,
                      attendedCount: 0,
                      rate: 0,
                      totalSec: 0,
                    };
                    const matchingBatch = batches.find(
                      (b) =>
                        b.name === student.batch ||
                        b.id === student.batch ||
                        (b.code && b.code === student.batch)
                    );
                    const isSelected = selectedIds.includes(student.id);

                    return (
                      <Table.Tr
                        key={student.id}
                        className={isSelected ? 'students-row-selected' : undefined}
                      >
                        <Table.Td>
                          <Checkbox
                            size="xs"
                            checked={isSelected}
                            onChange={() => toggleSelectStudent(student.id)}
                            aria-label={`Select ${student.name}`}
                          />
                        </Table.Td>

                        <Table.Td>
                          <Group gap="sm" wrap="nowrap">
                            <Avatar
                              color={initialsColor(student.name)}
                              radius="xl"
                              size="md"
                              style={{ cursor: 'pointer' }}
                              onClick={() => setPreviewStudent(student)}
                            >
                              {initials(student.name)}
                            </Avatar>
                            <div>
                              <Group gap={6} align="center">
                                <Text
                                  fw={700}
                                  size="sm"
                                  className="students-quick-card"
                                  onClick={() => setPreviewStudent(student)}
                                >
                                  {student.name}
                                </Text>
                                {student.lmsUsername && (
                                  <Badge size="xs" variant="outline" color="indigo">
                                    {student.lmsUsername}
                                  </Badge>
                                )}
                              </Group>
                              <Text c="dimmed" size="xs">
                                {student.email || 'No email provided'}
                              </Text>
                              {student.phone && (
                                <Text c="dimmed" size="10px">
                                  📞 {student.phone}
                                </Text>
                              )}
                            </div>
                          </Group>
                        </Table.Td>

                        <Table.Td>
                          <div className="field-cell">
                            <span className="field-dot" />
                            <Text size="sm">{student.field || '—'}</Text>
                          </div>
                        </Table.Td>

                        <Table.Td>
                          {matchingBatch ? (
                            <Tooltip
                              label={`Trainer: ${matchingBatch.trainer || 'Unassigned'} · ${
                                matchingBatch.timing || 'Schedule TBA'
                              } · Click to open spreadsheet table`}
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
                          <div className="attendance-mini" style={{ marginTop: 0, gap: 4 }}>
                            <div>
                              <Text size="sm" fw={700}>
                                {stats.recordsCount ? `${stats.rate}%` : '—'}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {stats.recordsCount
                                  ? `${stats.attendedCount}/${stats.recordsCount} sessions`
                                  : 'No records'}
                              </Text>
                            </div>
                            {stats.recordsCount > 0 && (
                              <Progress
                                value={stats.rate}
                                size="xs"
                                w={60}
                                color={stats.rate >= Number(attendanceThreshold) ? 'teal' : 'orange'}
                                radius="xl"
                              />
                            )}
                          </div>
                        </Table.Td>

                        <Table.Td>
                          <Text fw={700} size="sm">
                            {formatDuration(stats.totalSec)}
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

                        <Table.Td ta="right">
                          <Menu position="bottom-end" shadow="md" width={190} withinPortal>
                            <Menu.Target>
                              <Tooltip label="Options" withArrow>
                                <ActionIcon
                                  variant="subtle"
                                  color="gray"
                                  size="sm"
                                  radius="md"
                                  aria-label={`Options for ${student.name}`}
                                >
                                  <IconDotsVertical size={16} />
                                </ActionIcon>
                              </Tooltip>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                leftSection={<IconEye size={15} color="#4f46e5" />}
                                onClick={() => setPreviewStudent(student)}
                              >
                                View Profile
                              </Menu.Item>

                              {matchingBatch && onNavigate && (
                                <Menu.Item
                                  leftSection={<IconTable size={15} color="#4f46e5" />}
                                  onClick={() => onNavigate('/batches')}
                                >
                                  Open Cohort Table
                                </Menu.Item>
                              )}

                              <Menu.Item
                                leftSection={<IconEdit size={15} color="#4b5563" />}
                                onClick={() => onEdit?.(student)}
                              >
                                Edit Student
                              </Menu.Item>

                              <Menu.Divider />

                              <Menu.Item
                                color="red"
                                leftSection={<IconTrash size={15} />}
                                onClick={() => onDelete?.(student)}
                              >
                                Delete Student
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )
        ) : (
          <EmptyState
            title="No students found"
            description={
              hasActiveFilters
                ? 'No learners match your selected search and filter criteria.'
                : 'Get started by enrolling learners or synchronizing your batch spreadsheet.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="default" onClick={resetAllFilters} leftSection={<IconX size={15} />}>
                  Clear all filters
                </Button>
              ) : (
                <Button leftSection={<IconPlus size={16} />} onClick={onAdd}>
                  Add student
                </Button>
              )
            }
          />
        )}

        {/* Enhanced Pagination Bar with Mobile Justification */}
        {filtered.length > 0 && (
          <div className="students-pagination-bar">
            <div className="students-pagination-top-info">
              <Text size="xs" c="dimmed" fw={600}>
                Showing{' '}
                <Text component="span" fw={800} c="dark.7">
                  {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </Text>{' '}
                –{' '}
                <Text component="span" fw={800} c="dark.7">
                  {Math.min(currentPage * pageSize, filtered.length)}
                </Text>{' '}
                of{' '}
                <Text component="span" fw={800} c="dark.7">
                  {filtered.length}
                </Text>{' '}
                learners
              </Text>

              <Group gap={6} align="center">
                <Text size="xs" c="dimmed">
                  Rows:
                </Text>
                <Select
                  size="xs"
                  data={['10', '25', '50', '100']}
                  value={String(pageSize)}
                  onChange={(val) => {
                    setPageSize(Number(val) || 10);
                    setPage(1);
                  }}
                  w={72}
                />
              </Group>
            </div>

            <div className="students-pagination-controls">
              <Pagination
                total={totalPages}
                value={currentPage}
                onChange={setPage}
                size="sm"
                radius="md"
                withEdges
                siblings={0}
                boundaries={1}
              />
            </div>
          </div>
        )}
      </Paper>

      {/* Bulk Deletion Confirmation Modal */}
      <Modal
        opened={bulkDeleteModalOpen}
        onClose={() => !bulkDeleting && setBulkDeleteModalOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="red" variant="light" size="md">
              <IconAlertTriangle size={18} />
            </ThemeIcon>
            <Text fw={700} size="md">
              Delete {selectedIds.length} Selected Learners
            </Text>
          </Group>
        }
        centered
        radius="md"
      >
        <Stack gap="md">
          <Alert color="red" variant="light" icon={<IconAlertTriangle size={18} />}>
            Are you sure you want to permanently delete these <strong>{selectedIds.length}</strong>{' '}
            selected learners? This action cannot be undone and will also delete their session attendance
            records and remove them from all batch tables.
          </Alert>

          <div>
            <Text size="xs" c="dimmed" fw={600} mb={6}>
              Selected Learners Preview:
            </Text>
            <ScrollArea.Autosize mah={160}>
              <Stack gap={4}>
                {selectedStudentsObjects.slice(0, 10).map((s) => (
                  <Group key={s.id} justify="space-between" p={6} style={{ background: '#f8fafc', borderRadius: 6 }}>
                    <Text size="xs" fw={600}>
                      {s.name}
                    </Text>
                    <Badge size="xs" variant="outline" color={s.batch ? 'indigo' : 'gray'}>
                      {s.batch || 'Unassigned'}
                    </Badge>
                  </Group>
                ))}
                {selectedStudentsObjects.length > 10 && (
                  <Text size="xs" c="dimmed" ta="center">
                    ...and {selectedStudentsObjects.length - 10} more learners
                  </Text>
                )}
              </Stack>
            </ScrollArea.Autosize>
          </div>

          <Group justify="flex-end" gap="sm" mt="md">
            <Button
              variant="default"
              onClick={() => setBulkDeleteModalOpen(false)}
              disabled={bulkDeleting}
            >
              Cancel
            </Button>
            <Button
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={handleConfirmBulkDelete}
              loading={bulkDeleting}
            >
              Permanently Delete ({selectedIds.length})
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Quick Student Detail Modal */}
      <Modal
        opened={Boolean(previewStudent)}
        onClose={() => {
          setPreviewStudent(null);
          setShowPassword(false);
        }}
        title={
          <Group gap="xs">
            <ThemeIcon color="indigo" variant="light" size="md">
              <IconUsers size={18} />
            </ThemeIcon>
            <Text fw={700}>Learner Profile</Text>
          </Group>
        }
        size="lg"
        centered
        radius="lg"
      >
        {previewStudent && (
          <Stack gap="md">
            {/* Header info */}
            <Group align="flex-start" justify="space-between">
              <Group gap="md">
                <Avatar color={initialsColor(previewStudent.name)} radius="xl" size="xl">
                  {initials(previewStudent.name)}
                </Avatar>
                <div>
                  <Text fw={800} size="lg">
                    {previewStudent.name}
                  </Text>
                  <Text c="dimmed" size="xs">
                    {previewStudent.email || 'No email provided'}
                  </Text>
                  {previewStudent.phone && (
                    <Text c="dimmed" size="xs">
                      📞 {previewStudent.phone}
                    </Text>
                  )}
                </div>
              </Group>
              <Badge color={statusColor(previewStudent.status)} variant="filled">
                {previewStudent.status}
              </Badge>
            </Group>

            {/* Academic & Cohort Details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                background: '#f8fafc',
                padding: 14,
                borderRadius: 12,
              }}
            >
              <div>
                <Text size="xs" c="dimmed">
                  Training Field:
                </Text>
                <Text fw={700} size="sm">
                  {previewStudent.field || 'General / Unspecified'}
                </Text>
              </div>

              <div>
                <Text size="xs" c="dimmed">
                  Enrollment Date:
                </Text>
                <Text fw={700} size="sm">
                  {formatDate(previewStudent.enrollmentDate)}
                </Text>
              </div>

              <div>
                <Text size="xs" c="dimmed">
                  Batch / Cohort:
                </Text>
                <Text fw={700} size="sm" c={previewStudent.batch ? 'indigo.8' : 'orange.8'}>
                  {previewStudent.batch || '⚠️ Unassigned'}
                </Text>
              </div>

              <div>
                <Text size="xs" c="dimmed">
                  Attendance Rate:
                </Text>
                <Text fw={700} size="sm">
                  {attendanceStatsMap.get(previewStudent.id)?.rate || 0}%
                </Text>
              </div>
            </div>

            {/* LMS Credentials Box with Copy and Reveal */}
            <div className="students-cred-box">
              <Group justify="space-between" mb={8}>
                <Text size="xs" fw={700} c="indigo.8" tt="uppercase">
                  🔑 LMS Portal Login Credentials
                </Text>
                <Button
                  size="compact-xs"
                  variant="subtle"
                  leftSection={<IconCopy size={12} />}
                  onClick={() => {
                    const creds = `Username: ${previewStudent.lmsUsername || previewStudent.email}\nPassword: ${previewStudent.lmsPassword || 'Not set'}`;
                    navigator.clipboard?.writeText(creds);
                    showSuccess('LMS Credentials copied to clipboard.');
                  }}
                >
                  Copy Credentials
                </Button>
              </Group>

              <Group grow align="center">
                <div>
                  <Text size="11px" c="dimmed">
                    LMS User ID / Username:
                  </Text>
                  <Text fw={700} size="sm">
                    {previewStudent.lmsUsername || '—'}
                  </Text>
                </div>

                <div>
                  <Group gap={6} align="center">
                    <Text size="11px" c="dimmed">
                      Password:
                    </Text>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      onClick={() => setShowPassword((p) => !p)}
                    >
                      {showPassword ? <IconEyeOff size={13} /> : <IconEye size={13} />}
                    </ActionIcon>
                  </Group>
                  <Text fw={700} size="sm" ff="monospace">
                    {showPassword
                      ? previewStudent.lmsPassword || 'Not configured'
                      : previewStudent.lmsPassword
                      ? '••••••••••'
                      : 'Not configured'}
                  </Text>
                </div>
              </Group>
            </div>

            {/* Modal actions */}
            <Group justify="flex-end" gap="sm" mt="sm">
              {previewStudent.batch && onNavigate && (
                <Button
                  variant="light"
                  color="indigo"
                  leftSection={<IconTable size={15} />}
                  onClick={() => {
                    setPreviewStudent(null);
                    onNavigate('/batches');
                  }}
                >
                  Open Cohort Table
                </Button>
              )}
              <Button
                variant="default"
                onClick={() => {
                  const toEdit = previewStudent;
                  setPreviewStudent(null);
                  onEdit?.(toEdit);
                }}
              >
                Edit Student
              </Button>
              <Button
                color="red"
                variant="subtle"
                leftSection={<IconTrash size={15} />}
                onClick={() => {
                  const toDel = previewStudent;
                  setPreviewStudent(null);
                  onDelete?.(toDel);
                }}
              >
                Delete Student
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
