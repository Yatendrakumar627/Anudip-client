import React from 'react';
import { ActionIcon, Button, Divider, Paper, Stack, Text, Tooltip } from '@mantine/core';
import { IconArrowRight, IconExternalLink, IconSparkles } from '@tabler/icons-react';
import EmptyState from '../../../components/common/EmptyState';

export default function UpcomingSessionsPanel({
  upcoming = [],
  onNavigate,
  onAddSession,
}) {
  return (
    <Paper className="panel-card upcoming-panel" withBorder radius="lg" p="lg">
      <div className="panel-heading">
        <div>
          <Text fw={700}>Upcoming sessions</Text>
          <Text c="dimmed" size="sm">
            Keep learning on schedule.
          </Text>
        </div>
        <Button
          variant="subtle"
          size="xs"
          rightSection={<IconArrowRight size={15} />}
          onClick={() => onNavigate('sessions')}
        >
          All sessions
        </Button>
      </div>
      <Stack gap="md" mt="lg">
        {upcoming.length ? (
          upcoming.map((session) => (
            <div className="upcoming-item" key={session.id}>
              <div className="upcoming-date">
                <span>
                  {new Date(`${session.date}T12:00:00`)
                    .toLocaleDateString('en-IN', { month: 'short' })
                    .toUpperCase()}
                </span>
                <strong>{new Date(`${session.date}T12:00:00`).getDate()}</strong>
              </div>
              <div className="upcoming-copy">
                <Text fw={650} size="sm">
                  {session.title}
                </Text>
                <Text size="xs" c="dimmed">
                  {session.startTime}–{session.endTime} · {session.batch || session.field}
                </Text>
                <Text size="xs" c="dimmed">
                  {session.trainer || 'Trainer to be assigned'}
                </Text>
              </div>
              <Tooltip label="Open Meet" withArrow>
                <ActionIcon
                  component="a"
                  href={session.meetLink || '#'}
                  target="_blank"
                  rel="noreferrer"
                  variant="light"
                  color="indigo"
                  style={{ flexShrink: 0 }}
                  onClick={(e) => {
                    if (!session.meetLink) e.preventDefault();
                  }}
                  aria-label="Open Meet Link"
                >
                  <IconExternalLink size={17} />
                </ActionIcon>
              </Tooltip>
            </div>
          ))
        ) : (
          <EmptyState
            title="No upcoming sessions"
            description="Create your next learning session to keep the programme moving."
            action={
              <Button size="xs" onClick={onAddSession}>
                Create session
              </Button>
            }
          />
        )}
      </Stack>
      <Divider my="lg" color="gray.2" />
      <div className="calendar-tip">
        <div className="tip-icon">
          <IconSparkles size={16} />
        </div>
        <div>
          <Text size="sm" fw={650}>
            A little reminder
          </Text>
          <Text size="xs" c="dimmed">
            Share the Meet link with your batch before the session begins.
          </Text>
        </div>
      </div>
    </Paper>
  );
}
