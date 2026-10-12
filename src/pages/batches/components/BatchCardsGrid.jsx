import React from 'react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Divider,
  Group,
  Paper,
  Progress,
  Select,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconArrowRight,
  IconClock,
  IconEdit,
  IconFilter,
  IconPlus,
  IconSchool,
  IconTrash,
  IconVideo,
} from '@tabler/icons-react';
import SearchBox from '../../../components/common/SearchBox';
import EmptyState from '../../../components/common/EmptyState';
import { batchStatuses } from '../../../data';
import {
  initials,
  initialsColor,
  statusColor,
} from '../../../utils/formatters';

export default function BatchCardsGrid({
  batches = [],
  filteredBatches = [],
  search,
  onSearchChange,
  fieldFilter,
  onFieldFilterChange,
  uniqueFields,
  statusFilter,
  onStatusFilterChange,
  students = [],
  attendance = [],
  placements = [],
  onSelectBatch,
  onEditBatch,
  onDeleteBatch,
  onAddBatch,
}) {
  return (
    <>
      {/* Toolbar Filters for Cards Mode */}
      <div className="toolbar-row">
        <SearchBox
          value={search}
          onChange={onSearchChange}
          placeholder="Search batch name, code, trainer or field..."
        />
        <Select
          className="filter-select"
          leftSection={<IconFilter size={15} />}
          data={uniqueFields}
          value={fieldFilter}
          onChange={(v) => onFieldFilterChange(v || 'all')}
          searchable
        />
        <Select
          className="filter-select status-filter"
          data={[
            { value: 'all', label: 'All statuses' },
            ...batchStatuses.map((s) => ({ value: s, label: s })),
          ]}
          value={statusFilter}
          onChange={(v) => onStatusFilterChange(v || 'all')}
        />
        <div className="toolbar-spacer" />
        <Text size="sm" c="dimmed">
          {filteredBatches.length} of {batches.length} cohorts
        </Text>
      </div>

      {/* Batch Cards Grid */}
      {filteredBatches.length ? (
        <div className="batch-grid">
          {filteredBatches.map((batch) => {
            const batchStudents = students.filter(
              (s) => s.batch === batch.name || s.batch === batch.id
            );
            const batchStudentIds = new Set(batchStudents.map((s) => s.id));
            const batchRecords = attendance.filter((a) => batchStudentIds.has(a.studentId));
            const attendedCount = batchRecords.filter((a) =>
              ['Present', 'Late'].includes(a.status)
            ).length;
            const batchAttendanceRate = batchRecords.length
              ? Math.round((attendedCount / batchRecords.length) * 100)
              : 0;

            const placedInBatch = placements.filter(
              (p) => batchStudentIds.has(p.studentId) && p.status === 'Placed'
            ).length;

            return (
              <Paper
                key={batch.id}
                className="batch-card"
                withBorder
                radius="lg"
                p="lg"
              >
                {/* Header Pills */}
                <div className="batch-card-top">
                  <Badge color="indigo" variant="light" size="md">
                    {batch.code || 'AF-COHORT'}
                  </Badge>
                  <Group gap={6}>
                    <Badge color={statusColor(batch.status)} variant="outline">
                      {batch.status || 'Active'}
                    </Badge>
                    <Badge color="gray" variant="light">
                      {batch.field}
                    </Badge>
                  </Group>
                </div>

                {/* Batch Name & Description */}
                <Text fw={800} size="lg" mt={10} c="dark.5">
                  {batch.name}
                </Text>
                <Text size="xs" c="dimmed" mt={4} lineClamp={2}>
                  {batch.description || 'Dedicated Anudip Foundation career training cohort.'}
                </Text>

                {/* Details list */}
                <div className="batch-meta-rows">
                  <div className="batch-meta-item">
                    <IconSchool size={16} color="#6366f1" />
                    <span>Trainer:</span>
                    <strong>{batch.trainer || 'Unassigned'}</strong>
                  </div>
                  <div className="batch-meta-item">
                    <IconClock size={16} color="#06b6d4" />
                    <span>Schedule:</span>
                    <strong>{batch.timing || 'Schedule TBA'}</strong>
                  </div>
                </div>

                <Divider my="sm" color="gray.2" />

                {/* Enrolled Students Preview */}
                <div className="batch-learners-preview">
                  <div className="preview-top">
                    <Group gap="xs">
                      <div className="avatar-stack">
                        {batchStudents.slice(0, 4).map((s) => (
                          <Avatar
                            key={s.id}
                            color={initialsColor(s.name)}
                            radius="xl"
                            size={28}
                            className="stack-avatar"
                          >
                            {initials(s.name)}
                          </Avatar>
                        ))}
                      </div>
                      <Text fw={700} size="sm" c="dark.4">
                        {batchStudents.length} students enrolled
                      </Text>
                    </Group>
                    {placedInBatch > 0 && (
                      <Badge color="teal" size="xs" variant="light">
                        {placedInBatch} placed
                      </Badge>
                    )}
                  </div>

                  {/* Attendance Bar */}
                  <div className="batch-progress-wrap">
                    <Group justify="space-between" mb={4}>
                      <Text size="xs" c="dimmed">
                        Cohort attendance rate
                      </Text>
                      <Text size="xs" fw={700} c="indigo">
                        {batchRecords.length ? `${batchAttendanceRate}%` : 'No sessions recorded'}
                      </Text>
                    </Group>
                    <Progress
                      value={batchAttendanceRate}
                      size="xs"
                      color={batchAttendanceRate >= 75 ? 'teal' : 'orange'}
                      radius="xl"
                    />
                  </div>
                </div>

                {/* Card Actions */}
                <div className="batch-card-actions">
                  <Button
                    variant="light"
                    color="indigo"
                    size="xs"
                    radius="md"
                    rightSection={<IconArrowRight size={14} />}
                    onClick={() => onSelectBatch(batch)}
                  >
                    View Students ({batchStudents.length})
                  </Button>

                  <Group gap={6}>
                    {batch.meetLink && (
                      <Tooltip label="Join Google Meet Classroom" withArrow>
                        <ActionIcon
                          component="a"
                          href={batch.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          variant="light"
                          color="teal"
                          size="md"
                          radius="md"
                          aria-label="Open Meet Link"
                        >
                          <IconVideo size={17} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    <Tooltip label="Edit Batch Details & Table" withArrow>
                      <ActionIcon
                        variant="light"
                        color="indigo"
                        size="md"
                        onClick={() => onEditBatch?.(batch)}
                        aria-label="Edit Batch Details & Table"
                      >
                        <IconEdit size={17} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete Batch" withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="md"
                        onClick={() => onDeleteBatch?.(batch)}
                        aria-label="Delete Batch"
                      >
                        <IconTrash size={17} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </div>
              </Paper>
            );
          })}
        </div>
      ) : (
        <Paper withBorder radius="lg">
          <EmptyState
            title="No batches found"
            description="Create a student cohort to group your learners by course track, schedule and facilitator."
            action={
              <Button leftSection={<IconPlus size={16} />} onClick={() => onAddBatch?.()}>
                Create Batch
              </Button>
            }
          />
        </Paper>
      )}
    </>
  );
}
