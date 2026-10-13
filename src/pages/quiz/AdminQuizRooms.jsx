import React from 'react';
import {
  Card,
  Group,
  Stack,
  Text,
  Title,
  Button,
  Badge,
  ActionIcon,
  Switch,
  Tooltip,
  Paper,
  ThemeIcon,
  Menu,
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconShare,
  IconCopy,
  IconEye,
  IconAward,
  IconClock,
  IconHelpCircle,
  IconDotsVertical,
  IconUsers,
  IconCheck,
} from '@tabler/icons-react';

export default function AdminQuizRooms({
  rooms = [],
  onCreateRoom,
  onEditRoom,
  onDeleteRoom,
  onToggleActive,
  onViewResults,
  onPreviewAsStudent,
  onCopyJoinLink,
  onCopyCode,
}) {
  return (
    <Stack gap="lg">
      {/* Header bar */}
      <Group justify="space-between" align="center" wrap="wrap">
        <div>
          <Title order={3} fw={800} c="dark.8">
            Manage Quiz Rooms ({rooms.length})
          </Title>
          <Text size="xs" c="dimmed">
            Create assessment rooms, add curriculum questions, and generate student links.
          </Text>
        </div>

        <Button
          color="indigo"
          radius="md"
          leftSection={<IconPlus size={16} />}
          onClick={onCreateRoom}
        >
          Create New Quiz Room
        </Button>
      </Group>

      {/* Rooms Grid */}
      {rooms.length === 0 ? (
        <Card withBorder radius="lg" p="xl" ta="center">
          <Stack align="center" gap="sm">
            <ThemeIcon size={56} radius="xl" color="indigo" variant="light">
              <IconHelpCircle size={30} />
            </ThemeIcon>
            <Title order={3}>No Quiz Rooms Configured</Title>
            <Text c="dimmed" size="sm" style={{ maxWidth: 420 }}>
              Create your first quiz room to evaluate student understanding with automated scoring and instant feedback.
            </Text>
            <Button
              color="indigo"
              radius="md"
              mt="xs"
              leftSection={<IconPlus size={16} />}
              onClick={onCreateRoom}
            >
              Create First Quiz Room
            </Button>
          </Stack>
        </Card>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 18,
          }}
        >
          {rooms.map((room) => {
            const submissionsCount = room.submissions?.length || 0;
            const questionsCount = room.questions?.length || 0;

            return (
              <Card
                key={room.id}
                withBorder
                radius="lg"
                p="lg"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  backgroundColor: '#ffffff',
                }}
                className="quiz-room-card"
              >
                <div>
                  {/* Top Bar: Room Code Pill & Status Switch */}
                  <Group justify="space-between" align="center" mb="sm">
                    <Group gap={6}>
                      <Badge
                        size="lg"
                        color="indigo"
                        variant="filled"
                        radius="md"
                        style={{ cursor: 'pointer', fontFamily: 'monospace', letterSpacing: 0.5 }}
                        onClick={() => onCopyCode(room.roomCode)}
                        title="Click to copy room code"
                      >
                        {room.roomCode}
                      </Badge>
                      <Tooltip label="Copy join link">
                        <ActionIcon
                          size="sm"
                          variant="light"
                          color="indigo"
                          radius="md"
                          onClick={() => onCopyJoinLink(room.roomCode)}
                        >
                          <IconCopy size={13} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>

                    <Group gap="xs">
                      <Badge
                        size="sm"
                        color={room.isActive ? 'teal' : 'gray'}
                        variant="light"
                      >
                        {room.isActive ? 'Active' : 'Closed'}
                      </Badge>

                      <Menu shadow="md" width={180} position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray" size="sm">
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={() => onEditRoom(room)}
                          >
                            Edit Room & Qs
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconEye size={14} />}
                            onClick={() => onPreviewAsStudent(room.roomCode)}
                          >
                            Preview as Student
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconShare size={14} />}
                            onClick={() => onCopyJoinLink(room.roomCode)}
                          >
                            Copy Share Link
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => onDeleteRoom(room.id)}
                          >
                            Delete Room
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Group>

                  {/* Title & Description */}
                  <Title order={4} fw={700} c="dark.8" mb={4} lineClamp={2}>
                    {room.title}
                  </Title>
                  <Text size="xs" c="dimmed" lineClamp={2} mb="md">
                    {room.description || 'No description provided.'}
                  </Text>

                  {/* Badges / Metrics */}
                  <Group gap={6} mb="md" wrap="wrap">
                    <Badge size="xs" color="gray" variant="light" leftSection={<IconHelpCircle size={10} />}>
                      {questionsCount} Questions
                    </Badge>

                    <Badge size="xs" color="teal" variant="light" leftSection={<IconUsers size={10} />}>
                      {submissionsCount} Submissions
                    </Badge>

                    {room.timeLimitMinutes > 0 ? (
                      <Badge size="xs" color="blue" variant="light" leftSection={<IconClock size={10} />}>
                        {room.timeLimitMinutes} Mins
                      </Badge>
                    ) : (
                      <Badge size="xs" color="gray" variant="light">
                        No Time Limit
                      </Badge>
                    )}

                    {room.batch && (
                      <Badge size="xs" color="indigo" variant="outline">
                        {room.batch}
                      </Badge>
                    )}

                    {room.expiresAt && (() => {
                      const diff = new Date(room.expiresAt).getTime() - Date.now();
                      if (diff <= 0) {
                        return (
                          <Badge size="xs" color="red" variant="filled">
                            Expired
                          </Badge>
                        );
                      }
                      const totalHours = Math.floor(diff / (1000 * 60 * 60));
                      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                      const label = totalHours > 0 ? `${totalHours}h ${mins}m left` : `${mins}m left`;
                      const isUrgent = totalHours < 6;
                      return (
                        <Tooltip label="Room & submissions auto-delete 48 hours after creation.">
                          <Badge
                            size="xs"
                            color={isUrgent ? 'orange' : 'grape'}
                            variant="light"
                            leftSection={<IconClock size={10} />}
                          >
                            ⏳ {label}
                          </Badge>
                        </Tooltip>
                      );
                    })()}
                  </Group>
                </div>

                {/* Bottom Action Footer */}
                <Stack gap="xs" mt="md" style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                  <Group justify="space-between" align="center">
                    <Switch
                      label={<Text size="xs">Accepting Responses</Text>}
                      checked={Boolean(room.isActive)}
                      onChange={(e) => onToggleActive(room, e.currentTarget.checked)}
                      size="xs"
                      color="teal"
                    />

                    <Group gap="xs">
                      <Button
                        variant="light"
                        color="indigo"
                        size="xs"
                        radius="md"
                        leftSection={<IconAward size={14} />}
                        onClick={() => onViewResults(room.id)}
                      >
                        Results ({submissionsCount})
                      </Button>

                      <Button
                        variant="default"
                        size="xs"
                        radius="md"
                        leftSection={<IconEdit size={14} />}
                        onClick={() => onEditRoom(room)}
                      >
                        Edit
                      </Button>
                    </Group>
                  </Group>
                </Stack>
              </Card>
            );
          })}
        </div>
      )}
    </Stack>
  );
}
