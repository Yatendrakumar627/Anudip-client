import React from 'react';
import {
  Avatar,
  Badge,
  Group,
  Paper,
  ScrollArea,
  Table,
  Text,
} from '@mantine/core';
import EmptyState from '../../../components/common/EmptyState';
import TableActions from '../../../components/common/TableActions';
import {
  formatDate,
  formatDuration,
  formatTime,
  initials,
  initialsColor,
  statusColor,
  totalSeconds,
} from '../../../utils/formatters';

export default function AttendanceTable({
  visibleRows = [],
  onEdit,
  onDelete,
  onSync,
}) {
  if (!visibleRows.length) {
    return (
      <Paper className="table-card" withBorder radius="lg">
        <EmptyState
          title="No attendance records match your filters"
          description="Try selecting a different session or clearing your search filter."
        />
      </Paper>
    );
  }

  return (
    <Paper className="table-card" withBorder radius="lg">
      <ScrollArea>
        <Table verticalSpacing="md" horizontalSpacing="lg" miw={950} highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Student</Table.Th>
              <Table.Th>Session</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>First joined</Table.Th>
              <Table.Th>Last left</Table.Th>
              <Table.Th>Total time</Table.Th>
              <Table.Th>Source</Table.Th>
              <Table.Th ta="right">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visibleRows.map((row) => {
              const sorted = [...(row.segments || [])]
                .filter((s) => s.joinedAt)
                .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
              const first = sorted[0];
              const last = sorted[sorted.length - 1];

              return (
                <Table.Tr key={row.id}>
                  <Table.Td>
                    <Group gap="sm" wrap="nowrap">
                      <Avatar color={initialsColor(row.student.name)} radius="xl">
                        {initials(row.student.name)}
                      </Avatar>
                      <div>
                        <Text fw={650} size="sm">
                          {row.student.name}
                        </Text>
                        <Text c="dimmed" size="xs">
                          {row.student.field}
                        </Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={555}>
                      {row.session?.title || 'Deleted session'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatDate(row.date)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={statusColor(row.status)} variant="light">
                      {row.status || 'Unmarked'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{first ? formatTime(first.joinedAt) : '—'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {last?.leftAt ? (
                        formatTime(last.leftAt)
                      ) : last?.joinedAt ? (
                        <span className="live-time">In session</span>
                      ) : (
                        '—'
                      )}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={700} size="sm">
                      {formatDuration(totalSeconds(row.segments))}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {(row.segments || []).length} interval(s)
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      variant="dot"
                      color={row.source === 'google_meet' ? 'teal' : 'gray'}
                    >
                      {row.source === 'google_meet' ? 'Google Meet API' : 'Manual entry'}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="right">
                    <TableActions
                      onEdit={() => onEdit?.(row)}
                      onDelete={() => onDelete?.(row)}
                      onSync={
                        row.session?.conferenceRecordName
                          ? () => onSync?.(row.session)
                          : undefined
                      }
                      syncLabel="Re-sync Google Meet log"
                    />
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  );
}
