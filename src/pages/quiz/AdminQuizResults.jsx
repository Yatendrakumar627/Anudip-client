import React, { useState, useMemo } from 'react';
import {
  Card,
  Group,
  Stack,
  Text,
  Title,
  Select,
  TextInput,
  Button,
  Badge,
  Table,
  ActionIcon,
  Paper,
  Progress,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconSearch,
  IconDownload,
  IconTrash,
  IconEye,
  IconUsers,
  IconTrophy,
  IconCheck,
  IconX,
  IconCopy,
  IconClock,
  IconAward,
  IconShare,
} from '@tabler/icons-react';
import * as XLSX from 'xlsx';
import StudentAnswersModal from './StudentAnswersModal';
import { showSuccess, showWarning } from '../../utils/notifications';

export default function AdminQuizResults({
  rooms = [],
  selectedRoomId,
  onSelectRoomId,
  onDeleteSubmission,
  onClearSubmissions,
  onCopyJoinLink,
}) {
  const [search, setSearch] = useState('');
  const [inspectSubmission, setInspectSubmission] = useState(null);

  // Active selected room
  const activeRoom = useMemo(() => {
    if (!rooms.length) return null;
    return rooms.find((r) => r.id === selectedRoomId) || rooms[0];
  }, [rooms, selectedRoomId]);

  const submissions = activeRoom?.submissions || [];
  const questionsCount = activeRoom?.questions?.length || 0;

  // Filtered submissions by student name or email
  const filteredSubmissions = useMemo(() => {
    if (!search.trim()) return submissions;
    const q = search.toLowerCase().trim();
    return submissions.filter(
      (s) =>
        (s.studentName || '').toLowerCase().includes(q) ||
        (s.studentEmail || '').toLowerCase().includes(q)
    );
  }, [submissions, search]);

  // Aggregate metrics
  const stats = useMemo(() => {
    const total = submissions.length;
    if (!total) {
      return { total: 0, avgScore: 0, avgPct: 0, highestScore: 0, passCount: 0, passRate: 0 };
    }
    const totalScore = submissions.reduce((acc, s) => acc + (s.score || 0), 0);
    const avgScore = Number((totalScore / total).toFixed(1));
    const avgPct = Math.round(submissions.reduce((acc, s) => acc + (s.percentage || 0), 0) / total);
    const highestScore = Math.max(...submissions.map((s) => s.score || 0));
    const passThreshold = Math.ceil(questionsCount / 2);
    const passCount = submissions.filter((s) => (s.score || 0) >= passThreshold).length;
    const passRate = Math.round((passCount / total) * 100);

    return { total, avgScore, avgPct, highestScore, passCount, passRate };
  }, [submissions, questionsCount]);

  const handleExportExcel = () => {
    if (!submissions.length) {
      showWarning('No submissions to export.');
      return;
    }

    const rows = submissions.map((s, idx) => ({
      Rank: idx + 1,
      'Student Name': s.studentName,
      'Email / ID': s.studentEmail || 'N/A',
      Score: `${s.score} / ${s.totalQuestions || questionsCount}`,
      'Percentage (%)': s.percentage,
      Status: s.score >= Math.ceil(questionsCount / 2) ? 'Passed' : 'Needs Practice',
      'Time Taken (seconds)': s.timeTakenSeconds || 0,
      'Submitted At': s.submittedAt ? new Date(s.submittedAt).toLocaleString('en-IN') : 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
    const filename = `${(activeRoom.title || 'Quiz').replace(/[^a-z0-9]/gi, '_')}_Results.xlsx`;
    XLSX.writeFile(workbook, filename);
    showSuccess(`Exported ${submissions.length} results to ${filename}`);
  };

  const formatTime = (secs) => {
    if (!secs) return 'N/A';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const roomSelectData = rooms.map((r) => ({
    value: r.id,
    label: `${r.title} (${r.roomCode}) — ${r.submissions?.length || 0} submissions`,
  }));

  if (!rooms.length) {
    return (
      <Card withBorder radius="lg" p="xl" ta="center">
        <Stack align="center" gap="sm">
          <ThemeIcon size={52} radius="xl" color="gray" variant="light">
            <IconAward size={28} />
          </ThemeIcon>
          <Title order={3}>No Quiz Rooms Yet</Title>
          <Text c="dimmed" size="sm">
            Create your first quiz room to start receiving student submissions.
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack gap="lg">
      {/* Top Filter and Room Switcher */}
      <Card withBorder radius="lg" p="md" bg="var(--mantine-color-gray-0)">
        <Group justify="space-between" wrap="wrap" gap="md">
          <Group gap="sm" style={{ flex: 1, minWidth: 260 }}>
            <Select
              label="Select Quiz Room Results"
              data={roomSelectData}
              value={activeRoom?.id}
              onChange={(val) => onSelectRoomId(val)}
              style={{ flex: 1 }}
              size="sm"
            />
          </Group>

          {activeRoom && (
            <Group gap="xs" align="flex-end">
              <Button
                variant="light"
                color="indigo"
                size="sm"
                radius="md"
                leftSection={<IconShare size={15} />}
                onClick={() => onCopyJoinLink(activeRoom.roomCode)}
              >
                Copy Link ({activeRoom.roomCode})
              </Button>
              <Button
                variant="filled"
                color="teal"
                size="sm"
                radius="md"
                leftSection={<IconDownload size={15} />}
                onClick={handleExportExcel}
                disabled={!submissions.length}
              >
                Export Excel
              </Button>
              {submissions.length > 0 && (
                <Button
                  variant="subtle"
                  color="red"
                  size="sm"
                  radius="md"
                  leftSection={<IconTrash size={15} />}
                  onClick={() => onClearSubmissions(activeRoom.id)}
                >
                  Clear Results
                </Button>
              )}
            </Group>
          )}
        </Group>
      </Card>

      {/* Aggregate Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
        }}
      >
        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Total Submissions
            </Text>
            <ThemeIcon color="indigo" variant="light" size={32} radius="md">
              <IconUsers size={18} />
            </ThemeIcon>
          </Group>
          <Title order={2} fw={800} c="dark.8">
            {stats.total}
          </Title>
          <Text size="xs" c="dimmed">
            Learners enrolled in assessment
          </Text>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Average Score
            </Text>
            <ThemeIcon color="teal" variant="light" size={32} radius="md">
              <IconTrophy size={18} />
            </ThemeIcon>
          </Group>
          <Title order={2} fw={800} c="dark.8">
            {stats.avgScore} <span style={{ fontSize: 16, color: '#64748b' }}>/ {questionsCount}</span>
          </Title>
          <Text size="xs" c="teal" fw={600}>
            {stats.avgPct}% Class Average
          </Text>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Pass Rate
            </Text>
            <ThemeIcon color="blue" variant="light" size={32} radius="md">
              <IconCheck size={18} />
            </ThemeIcon>
          </Group>
          <Title order={2} fw={800} c="dark.8">
            {stats.passRate}%
          </Title>
          <Progress value={stats.passRate} color="blue" size="sm" radius="xl" mt={6} />
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase">
              Top Score
            </Text>
            <ThemeIcon color="orange" variant="light" size={32} radius="md">
              <IconAward size={18} />
            </ThemeIcon>
          </Group>
          <Title order={2} fw={800} c="dark.8">
            {stats.highestScore} <span style={{ fontSize: 16, color: '#64748b' }}>/ {questionsCount}</span>
          </Title>
          <Text size="xs" c="dimmed">
            Highest individual record
          </Text>
        </Paper>
      </div>

      {/* Submissions Table Panel */}
      <Card withBorder radius="lg" p="md">
        <Group justify="space-between" mb="md" wrap="wrap">
          <Group gap="xs">
            <Title order={4} fw={700} c="dark.8">
              Student Submissions ({filteredSubmissions.length})
            </Title>
            <Badge color="indigo" variant="light">
              Room: {activeRoom?.roomCode}
            </Badge>
            {activeRoom?.expiresAt && (() => {
              const diff = new Date(activeRoom.expiresAt).getTime() - Date.now();
              if (diff <= 0) return <Badge color="red" size="sm">Expired</Badge>;
              const totalHours = Math.floor(diff / (1000 * 60 * 60));
              const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              return (
                <Tooltip label="All data for this room will automatically be deleted 48 hours after creation.">
                  <Badge color="grape" variant="light" size="sm">
                    ⏳ Auto-deletes in {totalHours}h {mins}m
                  </Badge>
                </Tooltip>
              );
            })()}
          </Group>

          <TextInput
            placeholder="Search by student name or email..."
            size="sm"
            leftSection={<IconSearch size={14} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ width: 280 }}
          />
        </Group>

        {filteredSubmissions.length === 0 ? (
          <Paper withBorder p="xl" radius="md" ta="center" bg="var(--mantine-color-gray-0)">
            <Stack align="center" gap="sm">
              <ThemeIcon size={46} radius="xl" color="gray" variant="light">
                <IconUsers size={24} />
              </ThemeIcon>
              <Text fw={600} size="md">
                No Submissions Found
              </Text>
              <Text size="xs" c="dimmed" style={{ maxWidth: 400 }}>
                {search
                  ? 'No students matched your search filter.'
                  : 'No students have submitted this quiz yet. Share the join link or room code with students!'}
              </Text>
              {activeRoom && (
                <Button
                  size="xs"
                  variant="outline"
                  color="indigo"
                  leftSection={<IconCopy size={14} />}
                  onClick={() => onCopyJoinLink(activeRoom.roomCode)}
                >
                  Copy Join Link ({activeRoom.roomCode})
                </Button>
              )}
            </Stack>
          </Paper>
        ) : (
          <Table.ScrollContainer minWidth={650}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 60 }}>#</Table.Th>
                  <Table.Th>Student Name</Table.Th>
                  <Table.Th>Email / ID</Table.Th>
                  <Table.Th>Score</Table.Th>
                  <Table.Th>Percentage</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Time Taken</Table.Th>
                  <Table.Th>Submitted At</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredSubmissions.map((sub, idx) => {
                  const isPassing = (sub.score || 0) >= Math.ceil(questionsCount / 2);
                  const subId = sub.id || sub._id;

                  return (
                    <Table.Tr key={subId || idx}>
                      <Table.Td>
                        <Badge
                          size="sm"
                          color={idx === 0 ? 'yellow' : idx === 1 ? 'gray' : 'dark'}
                          variant="light"
                        >
                          #{idx + 1}
                        </Badge>
                      </Table.Td>

                      <Table.Td>
                        <Group gap="xs">
                          <ThemeIcon size={28} radius="xl" color="indigo" variant="light">
                            <Text size="xs" fw={700}>
                              {(sub.studentName || 'S').slice(0, 1).toUpperCase()}
                            </Text>
                          </ThemeIcon>
                          <Text fw={650} size="sm" c="dark.8">
                            {sub.studentName}
                          </Text>
                        </Group>
                      </Table.Td>

                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {sub.studentEmail || '—'}
                        </Text>
                      </Table.Td>

                      <Table.Td>
                        <Text fw={700} size="sm">
                          {sub.score}{' '}
                          <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                            / {sub.totalQuestions || questionsCount}
                          </span>
                        </Text>
                      </Table.Td>

                      <Table.Td>
                        <Badge
                          size="md"
                          color={sub.percentage >= 70 ? 'teal' : sub.percentage >= 50 ? 'yellow' : 'red'}
                          variant="filled"
                        >
                          {sub.percentage}%
                        </Badge>
                      </Table.Td>

                      <Table.Td>
                        <Badge
                          size="sm"
                          color={isPassing ? 'teal' : 'orange'}
                          variant="light"
                          leftSection={isPassing ? <IconCheck size={10} /> : <IconX size={10} />}
                        >
                          {isPassing ? 'Passed' : 'Needs Review'}
                        </Badge>
                      </Table.Td>

                      <Table.Td>
                        <Group gap={4}>
                          <IconClock size={12} color="#94a3b8" />
                          <Text size="xs" c="dimmed">
                            {formatTime(sub.timeTakenSeconds)}
                          </Text>
                        </Group>
                      </Table.Td>

                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {formatDate(sub.submittedAt)}
                        </Text>
                      </Table.Td>

                      <Table.Td style={{ textAlign: 'right' }}>
                        <Group gap="xs" justify="flex-end">
                          <Tooltip label="View detailed student answers">
                            <ActionIcon
                              variant="light"
                              color="indigo"
                              size="sm"
                              radius="md"
                              onClick={() => setInspectSubmission(sub)}
                            >
                              <IconEye size={15} />
                            </ActionIcon>
                          </Tooltip>

                          <Tooltip label="Delete result">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              size="sm"
                              radius="md"
                              onClick={() => onDeleteSubmission(activeRoom.id, subId)}
                            >
                              <IconTrash size={15} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      {/* Single Student Submission Inspection Modal */}
      <StudentAnswersModal
        opened={Boolean(inspectSubmission)}
        onClose={() => setInspectSubmission(null)}
        submission={inspectSubmission}
        room={activeRoom}
      />
    </Stack>
  );
}
