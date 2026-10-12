import React from 'react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Drawer,
  Group,
  Paper,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconClock,
  IconCopy,
  IconEdit,
  IconPlus,
  IconUserCheck,
} from '@tabler/icons-react';
import SearchBox from '../../../components/common/SearchBox';
import EmptyState from '../../../components/common/EmptyState';
import {
  formatDuration,
  initials,
  initialsColor,
  statusColor,
  totalSeconds,
} from '../../../utils/formatters';

export default function BatchRosterDrawer({
  opened,
  onClose,
  selectedBatch,
  rosterSearch,
  onRosterSearchChange,
  enrolledStudents = [],
  attendance = [],
  placements = [],
  onAddStudentToBatch,
  onEditStudent,
  onCopyLms,
}) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <div>
          <Group gap="xs" mb={4}>
            <Badge color="indigo" size="sm">
              {selectedBatch?.code}
            </Badge>
            <Badge color="teal" variant="light" size="sm">
              {selectedBatch?.status}
            </Badge>
          </Group>
          <Text fw={800} size="lg">
            {selectedBatch?.name}
          </Text>
          <Text size="xs" c="dimmed">
            Trainer: {selectedBatch?.trainer || 'Unassigned'} · {selectedBatch?.timing || 'Schedule TBA'}
          </Text>
        </div>
      }
      position="right"
      size={680}
      padding="lg"
    >
      {selectedBatch && (
        <div className="drawer-roster-content">
          {/* Drawer Toolbar */}
          <div className="roster-toolbar">
            <SearchBox
              value={rosterSearch}
              onChange={onRosterSearchChange}
              placeholder="Search students in this batch..."
            />
            {onAddStudentToBatch && (
              <Button
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={() => onAddStudentToBatch(selectedBatch)}
              >
                Add Student
              </Button>
            )}
          </div>

          <Text size="xs" fw={700} c="dimmed" mb="sm">
            {enrolledStudents.length} learner(s) registered in this batch
          </Text>

          {/* Students List in Batch */}
          {enrolledStudents.length ? (
            <div className="roster-list">
              {enrolledStudents.map((student) => {
                const studentRecords = attendance.filter((a) => a.studentId === student.id);
                const attended = studentRecords.filter((a) =>
                  ['Present', 'Late'].includes(a.status)
                ).length;
                const rate = studentRecords.length
                  ? Math.round((attended / studentRecords.length) * 100)
                  : 0;
                const studentSeconds = studentRecords.reduce(
                  (sum, item) => sum + totalSeconds(item.segments),
                  0
                );
                const placement = placements.find((p) => p.studentId === student.id);

                return (
                  <Paper
                    key={student.id}
                    className="roster-item-card"
                    withBorder
                    radius="md"
                    p="md"
                    mb="sm"
                  >
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Group gap="sm" wrap="nowrap">
                        <Avatar
                          color={initialsColor(student.name)}
                          radius="xl"
                          size={40}
                        >
                          {initials(student.name)}
                        </Avatar>
                        <div>
                          <Text fw={750} size="sm">
                            {student.name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {student.email}
                          </Text>
                          {student.phone && (
                            <Text size="xs" c="dimmed">
                              📞 {student.phone}
                            </Text>
                          )}
                        </div>
                      </Group>

                      <Group gap={6}>
                        {placement && (
                          <Badge color="teal" size="xs">
                            {placement.status}: {placement.company}
                          </Badge>
                        )}
                        <Badge color={statusColor(student.status)} variant="light" size="xs">
                          {student.status}
                        </Badge>
                        {onEditStudent && (
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={() => onEditStudent(student)}
                            aria-label="Edit Student"
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Group>

                    {/* LMS Details & Attendance Stats */}
                    <div className="roster-details-row">
                      <div className="roster-lms-pill">
                        <span>LMS ID:</span>
                        <code>{student.lmsUsername || '—'}</code>
                        <Tooltip label="Copy LMS ID" withArrow>
                          <ActionIcon
                            size="xs"
                            variant="transparent"
                            onClick={() => onCopyLms(student.lmsUsername || student.name)}
                            aria-label="Copy LMS ID"
                          >
                            <IconCopy size={12} />
                          </ActionIcon>
                        </Tooltip>
                      </div>

                      {student.lmsPassword && (
                        <div className="roster-lms-pill pass">
                          <span>Password:</span>
                          <code>{student.lmsPassword}</code>
                          <Tooltip label="Copy Password" withArrow>
                            <ActionIcon
                              size="xs"
                              variant="transparent"
                              onClick={() => onCopyLms(student.lmsPassword)}
                              aria-label="Copy Password"
                            >
                              <IconCopy size={12} />
                            </ActionIcon>
                          </Tooltip>
                        </div>
                      )}

                      <div className="roster-stat-pill">
                        <IconUserCheck size={14} color="#0d9d8b" />
                        <span>
                          {studentRecords.length ? `${rate}% attendance` : 'No records'}
                        </span>
                      </div>

                      <div className="roster-stat-pill">
                        <IconClock size={14} color="#6366f1" />
                        <span>{formatDuration(studentSeconds)} logged</span>
                      </div>
                    </div>
                  </Paper>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No students enrolled yet"
              description="Assign learners to this cohort from the student directory or add them here."
              action={
                onAddStudentToBatch && (
                  <Button
                    size="xs"
                    onClick={() => onAddStudentToBatch(selectedBatch)}
                  >
                    Add Student to Batch
                  </Button>
                )
              }
            />
          )}
        </div>
      )}
    </Drawer>
  );
}
