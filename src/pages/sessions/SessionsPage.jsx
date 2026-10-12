import React, { useMemo } from 'react';
import { ActionIcon, Anchor, Badge, Button, Group, Paper, Text, Tooltip } from '@mantine/core';
import {
  IconActivity,
  IconClock,
  IconEdit,
  IconExternalLink,
  IconPlus,
  IconTrash,
  IconUsers,
  IconVideo,
} from '@tabler/icons-react';
import PageHeader from '../../components/common/PageHeader';
import SearchBox from '../../components/common/SearchBox';
import EmptyState from '../../components/common/EmptyState';
import { statusColor } from '../../utils/formatters';

export default function SessionsPage({
  students = [],
  sessions = [],
  search = '',
  setSearch,
  onAdd,
  onEdit,
  onDelete,
  onSync,
}) {
  const filtered = useMemo(() => {
    return [...sessions]
      .filter((s) =>
        [s.title, s.field, s.batch, s.trainer].some((v) =>
          String(v || '').toLowerCase().includes(search.toLowerCase())
        )
      )
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  }, [sessions, search]);

  return (
    <>
      <PageHeader
        title="Training sessions"
        subtitle="Schedule classes, store daily Meet links and keep each cohort moving forward."
        eyebrow="LEARNING PROGRAMME"
        action={
          <Button leftSection={<IconPlus size={17} />} onClick={onAdd}>
            Create session
          </Button>
        }
      />

      <div className="toolbar-row">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search sessions, trainer or field..."
        />
        <div className="toolbar-spacer" />
        <Text size="sm" c="dimmed">
          {sessions.length} total sessions
        </Text>
      </div>

      {filtered.length ? (
        <div className="session-list">
          {filtered.map((session) => {
            const count = students.filter(
              (s) => !session.batch || s.batch === session.batch
            ).length;
            const sessionDate = new Date(`${session.date}T12:00:00`);

            return (
              <Paper key={session.id} className="session-card" withBorder radius="lg" p="lg">
                <div className="session-date-chip">
                  <div className="session-month">
                    {sessionDate.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
                  </div>
                  <div className="session-day">{sessionDate.getDate()}</div>
                  <div className="session-weekday">
                    {sessionDate.toLocaleDateString('en-IN', { weekday: 'short' })}
                  </div>
                </div>

                <div className="session-main">
                  <Group gap="xs" mb={5}>
                    <Badge color={statusColor(session.status)} variant="light">
                      {session.status}
                    </Badge>
                    <Badge color="gray" variant="outline">
                      {session.field}
                    </Badge>
                  </Group>
                  <Text fw={700} size="md">
                    {session.title}
                  </Text>
                  <Text c="dimmed" size="sm" mt={3}>
                    {session.description || 'No session description added yet.'}
                  </Text>
                  <div className="session-meta">
                    <span>
                      <IconClock size={15} />
                      {session.startTime || '—'} – {session.endTime || '—'}
                    </span>
                    <span>
                      <IconUsers size={15} />
                      {count} learners in cohort
                    </span>
                    <span>
                      <IconUsers size={15} />
                      {session.trainer || 'Trainer not assigned'}
                    </span>
                  </div>
                </div>

                <div className="session-actions">
                  <div className="meet-link-label">GOOGLE MEET</div>
                  <Anchor
                    href={session.meetLink || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className={`meet-link ${session.meetLink ? '' : 'disabled-link'}`}
                    onClick={(e) => {
                      if (!session.meetLink) e.preventDefault();
                    }}
                  >
                    <IconVideo size={16} /> Join session <IconExternalLink size={14} />
                  </Anchor>

                  <Group gap={5} mt="md" justify="flex-end">
                    <Tooltip label="Sync attendance from Meet API" withArrow>
                      <ActionIcon
                        variant="light"
                        color="indigo"
                        onClick={() => onSync(session)}
                        aria-label="Sync session attendance"
                      >
                        <IconActivity size={17} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Edit session" withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={() => onEdit(session)}
                        aria-label="Edit session"
                      >
                        <IconEdit size={17} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete session" withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => onDelete(session)}
                        aria-label="Delete session"
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
            title="No sessions yet"
            description="Create a session to store the training topic, schedule and Google Meet link."
            action={
              <Button leftSection={<IconPlus size={16} />} onClick={onAdd}>
                Create session
              </Button>
            }
          />
        </Paper>
      )}
    </>
  );
}
