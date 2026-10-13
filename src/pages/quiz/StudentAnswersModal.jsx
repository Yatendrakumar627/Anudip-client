import React from 'react';
import {
  Modal,
  Group,
  Stack,
  Text,
  Badge,
  Paper,
  ThemeIcon,
  Divider,
  Button,
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconClock,
  IconUser,
  IconCalendar,
  IconAward,
} from '@tabler/icons-react';

export default function StudentAnswersModal({ opened, onClose, submission, room }) {
  if (!submission || !room) return null;

  const questions = room.questions || [];
  const studentAnswers = submission.answers || {};
  const isPassing = (submission.score || 0) >= Math.ceil(questions.length / 2);

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
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon size={28} radius="md" color="indigo" variant="light">
            <IconAward size={16} />
          </ThemeIcon>
          <Text fw={700} size="md">
            Student Submission Review
          </Text>
        </Group>
      }
      size="lg"
      radius="lg"
      padding="lg"
    >
      {/* Student Summary Card */}
      <Paper withBorder p="md" radius="md" mb="lg" bg="var(--mantine-color-gray-0)">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Group gap="sm">
            <ThemeIcon size={42} radius="xl" color="indigo" variant="filled">
              <IconUser size={22} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="lg" c="dark.8">
                {submission.studentName}
              </Text>
              <Text size="xs" c="dimmed">
                {submission.studentEmail || 'No email provided'}
              </Text>
            </div>
          </Group>

          <Group gap="xs">
            <Badge
              size="lg"
              variant="filled"
              color={isPassing ? 'teal' : 'orange'}
              radius="sm"
            >
              {submission.score} / {submission.totalQuestions || questions.length} ({submission.percentage}%)
            </Badge>
            <Badge size="lg" variant="light" color={isPassing ? 'teal' : 'orange'} radius="sm">
              {isPassing ? 'PASSED' : 'NEEDS PRACTICE'}
            </Badge>
          </Group>
        </Group>

        <Divider my="sm" />

        <Group gap="xl" wrap="wrap">
          <Group gap={6}>
            <IconCalendar size={15} color="#868e96" />
            <Text size="xs" c="dimmed">
              Submitted: <strong style={{ color: '#212529' }}>{formatDate(submission.submittedAt)}</strong>
            </Text>
          </Group>
          <Group gap={6}>
            <IconClock size={15} color="#868e96" />
            <Text size="xs" c="dimmed">
              Time Taken: <strong style={{ color: '#212529' }}>{formatTime(submission.timeTakenSeconds)}</strong>
            </Text>
          </Group>
        </Group>
      </Paper>

      {/* Questions Breakdown */}
      <Text fw={700} size="sm" mb="xs" c="dimmed" tt="uppercase" lts={1}>
        Detailed Question Responses ({questions.length})
      </Text>

      <Stack gap="sm">
        {questions.map((q, idx) => {
          const studentAns = studentAnswers[q.id];
          const hasAnswered = studentAns !== undefined && studentAns !== null;
          const isCorrect = hasAnswered && Number(studentAns) === Number(q.answer);

          return (
            <Paper
              key={q.id || idx}
              withBorder
              p="md"
              radius="md"
              style={{
                borderColor: isCorrect ? '#bbf7d0' : hasAnswered ? '#fecaca' : '#e2e8f0',
                backgroundColor: isCorrect ? '#f0fdf4' : hasAnswered ? '#fef2f2' : '#ffffff',
              }}
            >
              <Group justify="space-between" align="flex-start" mb={6}>
                <Text fw={600} size="sm" style={{ flex: 1, paddingRight: 8 }}>
                  Q{idx + 1}. {q.question}
                </Text>
                <Badge
                  size="sm"
                  color={isCorrect ? 'green' : hasAnswered ? 'red' : 'gray'}
                  variant="filled"
                  leftSection={
                    isCorrect ? <IconCheck size={12} /> : <IconX size={12} />
                  }
                >
                  {isCorrect ? 'Correct' : hasAnswered ? 'Incorrect' : 'Skipped'}
                </Badge>
              </Group>

              {/* Options display */}
              <Stack gap={4} mt="xs">
                {(q.options || []).map((opt, optIdx) => {
                  const wasChosen = hasAnswered && Number(studentAns) === optIdx;
                  const isTheCorrectOpt = Number(q.answer) === optIdx;

                  let optBorder = '#e2e8f0';
                  let optBg = '#ffffff';
                  let badge = null;

                  if (isTheCorrectOpt && wasChosen) {
                    optBorder = '#22c55e';
                    optBg = '#dcfce7';
                    badge = <Badge size="xs" color="teal">Student Choice & Correct</Badge>;
                  } else if (isTheCorrectOpt) {
                    optBorder = '#16a34a';
                    optBg = '#ecfdf5';
                    badge = <Badge size="xs" color="teal" variant="outline">Correct Answer</Badge>;
                  } else if (wasChosen) {
                    optBorder = '#ef4444';
                    optBg = '#fee2e2';
                    badge = <Badge size="xs" color="red">Student Choice (Wrong)</Badge>;
                  }

                  return (
                    <Group
                      key={optIdx}
                      justify="space-between"
                      p="xs"
                      style={{
                        borderRadius: 6,
                        border: `1px solid ${optBorder}`,
                        backgroundColor: optBg,
                        fontSize: 13,
                      }}
                    >
                      <Group gap="xs">
                        <Text fw={700} size="xs" c="dimmed">
                          {String.fromCharCode(65 + optIdx)}.
                        </Text>
                        <Text size="xs" fw={wasChosen || isTheCorrectOpt ? 600 : 400}>
                          {opt}
                        </Text>
                      </Group>
                      {badge}
                    </Group>
                  );
                })}
              </Stack>

              {q.explanation && (
                <Text size="xs" c="dimmed" mt="xs" fst="italic" style={{ paddingLeft: 4 }}>
                  <strong>Explanation:</strong> {q.explanation}
                </Text>
              )}
            </Paper>
          );
        })}
      </Stack>

      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose} radius="md">
          Close Review
        </Button>
      </Group>
    </Modal>
  );
}
