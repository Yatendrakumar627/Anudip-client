import React from 'react';
import { Avatar, Badge, Button, Paper, Text } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import EmptyState from '../../../components/common/EmptyState';
import { formatDuration, initials, initialsColor, statusColor, totalSeconds } from '../../../utils/formatters';

export default function RecentAttendancePanel({
  recent = [],
  students = [],
  sessions = [],
  onNavigate,
}) {
  return (
    <Paper className="panel-card recent-panel" withBorder radius="lg" p="lg">
      <div className="panel-heading">
        <div>
          <Text fw={700}>Recent attendance</Text>
          <Text c="dimmed" size="sm">
            A quick look at learner engagement.
          </Text>
        </div>
        <Button
          variant="subtle"
          size="xs"
          rightSection={<IconArrowRight size={15} />}
          onClick={() => onNavigate('attendance')}
        >
          Open attendance
        </Button>
      </div>
      {recent.length ? (
        <div className="recent-list">
          {recent.map((record) => {
            const student = students.find((s) => s.id === record.studentId);
            const session = sessions.find((s) => s.id === record.sessionId);
            return (
              <div className="recent-item" key={record.id}>
                <Avatar
                  color={initialsColor(student?.name || '')}
                  radius="xl"
                  size={38}
                  style={{ flexShrink: 0 }}
                >
                  {initials(student?.name || '?')}
                </Avatar>
                <div className="recent-person">
                  <Text fw={650} size="sm">
                    {student?.name || 'Unknown student'}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {session?.title || 'Training session'}
                  </Text>
                </div>
                <div className="recent-right" style={{ flexShrink: 0 }}>
                  <Badge variant="light" color={statusColor(record.status)}>
                    {record.status}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {formatDuration(totalSeconds(record.segments))}
                  </Text>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No activity yet"
          description="Attendance activity will appear here as records are added."
        />
      )}
    </Paper>
  );
}
