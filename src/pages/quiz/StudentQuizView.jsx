import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Paper,
  Group,
  Stack,
  Text,
  Title,
  TextInput,
  Button,
  Badge,
  Progress,
  Radio,
  ThemeIcon,
  Modal,
  Center,
  Divider,
  Alert,
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconClock,
  IconUser,
  IconArrowRight,
  IconArrowLeft,
  IconSend,
  IconAward,
  IconAlertCircle,
  IconHelpCircle,
  IconRefresh,
} from '@tabler/icons-react';
import { showWarning, showError, showSuccess } from '../../utils/notifications';

export default function StudentQuizView({
  room,
  onSubmitQuiz,
  onResetRoom,
  submitting = false,
}) {
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);

  // Active quiz state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  // Result state
  const [resultData, setResultData] = useState(null);

  const questions = room?.questions || [];
  const totalQuestions = questions.length;
  const timeLimitSeconds = (room?.timeLimitMinutes || 0) * 60;

  // Timer interval
  useEffect(() => {
    if (!quizStarted || resultData) return;

    const timer = setInterval(() => {
      setTimeElapsed((prev) => {
        const next = prev + 1;
        // Auto-submit if time limit exceeded
        if (timeLimitSeconds > 0 && next >= timeLimitSeconds) {
          clearInterval(timer);
          triggerSubmit(next);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, resultData, timeLimitSeconds]);

  const handleStartQuiz = (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      showWarning('Please enter your full name before starting.');
      return;
    }
    if (!room?.isActive) {
      showWarning('This quiz room is currently closed for submissions.');
      return;
    }
    setQuizStarted(true);
    setCurrentIdx(0);
    setAnswers({});
    setTimeElapsed(0);
    setResultData(null);
  };

  const handleSelectOption = (qId, optionIdx) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: Number(optionIdx),
    }));
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = totalQuestions - answeredCount;

  const triggerSubmit = async (finalTimeSeconds) => {
    setConfirmSubmitOpen(false);
    try {
      const res = await onSubmitQuiz(room.roomCode, {
        studentName: studentName.trim(),
        studentEmail: studentEmail.trim(),
        answers,
        timeTakenSeconds: finalTimeSeconds !== undefined ? finalTimeSeconds : timeElapsed,
      });
      setResultData(res);
      showSuccess(`Quiz submitted! Your score: ${res.score}/${res.totalQuestions}`);
    } catch (err) {
      showError(err, 'Failed to submit quiz');
    }
  };

  const formatTimer = () => {
    if (timeLimitSeconds > 0) {
      const remaining = Math.max(0, timeLimitSeconds - timeElapsed);
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    }
    const m = Math.floor(timeElapsed / 60);
    const s = timeElapsed % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleRetake = () => {
    setQuizStarted(false);
    setResultData(null);
    setAnswers({});
    setCurrentIdx(0);
    setTimeElapsed(0);
  };

  // 1. WELCOME / JOIN SCREEN
  if (!quizStarted && !resultData) {
    return (
      <Center py="xl">
        <Paper
          withBorder
          radius="xl"
          p="xl"
          shadow="sm"
          style={{ maxWidth: 580, width: '100%', backgroundColor: '#ffffff' }}
        >
          <Stack gap="lg">
            {/* Header info */}
            <div>
              <Group justify="space-between" mb="xs">
                <Badge size="lg" color="indigo" variant="filled" style={{ fontFamily: 'monospace' }}>
                  {room.roomCode}
                </Badge>
                <Badge size="sm" color={room.isActive ? 'teal' : 'red'} variant="light">
                  {room.isActive ? 'Active Room' : 'Closed'}
                </Badge>
              </Group>

              <Title order={2} fw={800} c="dark.8" mb={4}>
                {room.title}
              </Title>
              <Text size="sm" c="dimmed">
                {room.description || 'Welcome to this assessment! Test your curriculum knowledge.'}
              </Text>
            </div>

            {/* Badges Overview */}
            <Group gap="xs" wrap="wrap">
              <Badge color="gray" variant="light" size="md" leftSection={<IconHelpCircle size={14} />}>
                {totalQuestions} Questions
              </Badge>
              {room.timeLimitMinutes > 0 ? (
                <Badge color="blue" variant="light" size="md" leftSection={<IconClock size={14} />}>
                  {room.timeLimitMinutes} Minutes Time Limit
                </Badge>
              ) : (
                <Badge color="gray" variant="light" size="md">
                  No Time Limit
                </Badge>
              )}
              {room.batch && (
                <Badge color="indigo" variant="outline" size="md">
                  Batch: {room.batch}
                </Badge>
              )}
              {room.expiresAt && (() => {
                const diff = new Date(room.expiresAt).getTime() - Date.now();
                if (diff <= 0) return null;
                const totalHours = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                return (
                  <Badge color="grape" variant="light" size="md" leftSection={<IconClock size={14} />}>
                    Open for next: {totalHours}h {mins}m
                  </Badge>
                );
              })()}
            </Group>

            {room.expiresAt && new Date(room.expiresAt).getTime() <= Date.now() && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" title="Room Expired">
                This quiz room has expired (its 48-hour lifespan has ended) and is no longer accepting responses.
              </Alert>
            )}

            {!room.isActive && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" title="Room Closed">
                This quiz room is currently marked as closed by the instructor and is not accepting responses.
              </Alert>
            )}

            <Divider />

            {/* Student Entry Form */}
            <form onSubmit={handleStartQuiz}>
              <Stack gap="md">
                <TextInput
                  label="Your Full Name"
                  placeholder="e.g. Ananya Sen"
                  size="md"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.currentTarget.value)}
                  leftSection={<IconUser size={16} />}
                  disabled={!room.isActive}
                  autoFocus
                />

                <TextInput
                  label="Email or Student Roll ID (Optional)"
                  placeholder="e.g. ananya@anudip.org"
                  size="md"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.currentTarget.value)}
                  disabled={!room.isActive}
                />

                <Button
                  type="submit"
                  color="indigo"
                  size="md"
                  radius="md"
                  rightSection={<IconArrowRight size={18} />}
                  disabled={!room.isActive || !studentName.trim()}
                  fullWidth
                  mt="xs"
                >
                  Start Quiz Now
                </Button>
              </Stack>
            </form>

            <Group justify="center">
              <Button variant="subtle" size="xs" color="gray" onClick={onResetRoom}>
                Switch Room or Join Another Code
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Center>
    );
  }

  // 2. SUBMITTED / RESULTS SCREEN
  if (resultData) {
    const isPassing = Boolean(resultData.isPassing);
    const breakdown = resultData.breakdown || [];

    return (
      <Center py="lg">
        <Paper
          withBorder
          radius="xl"
          p="xl"
          shadow="sm"
          style={{ maxWidth: 680, width: '100%', backgroundColor: '#ffffff' }}
        >
          <Stack align="center" gap="md">
            {/* Top Icon */}
            <ThemeIcon
              size={76}
              radius="xl"
              variant="light"
              color={isPassing ? 'teal' : 'orange'}
            >
              {isPassing ? <IconCheck size={42} /> : <IconAward size={42} />}
            </ThemeIcon>

            <div style={{ textAlign: 'center' }}>
              <Badge color="indigo" variant="light" size="lg" mb="xs">
                Room: {room.roomCode}
              </Badge>
              <Title order={2} fw={800} c="dark.8">
                {isPassing ? 'Congratulations, Assessment Passed!' : 'Quiz Completed!'}
              </Title>
              <Text size="md" c="dimmed">
                Learner: <strong style={{ color: '#1e293b' }}>{studentName}</strong>
              </Text>
            </div>

            {/* Score Banner */}
            <Paper
              withBorder
              p="md"
              radius="lg"
              style={{
                width: '100%',
                backgroundColor: isPassing ? '#f0fdf4' : '#fffbeb',
                borderColor: isPassing ? '#86efac' : '#fde68a',
                textAlign: 'center',
              }}
            >
              <Title order={1} fw={900} c={isPassing ? 'teal.8' : 'orange.8'}>
                {resultData.score} / {resultData.totalQuestions}
              </Title>
              <Text fw={700} size="sm" c={isPassing ? 'teal.9' : 'orange.9'}>
                Score Percentage: {resultData.percentage}%
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Completed in {Math.floor(timeElapsed / 60)}m {timeElapsed % 60}s · Result recorded in Admin database
              </Text>
            </Paper>

            {/* Question Breakdown if available */}
            {breakdown.length > 0 && (
              <Stack gap="sm" style={{ width: '100%' }} mt="sm">
                <Text fw={700} size="sm" c="dimmed" tt="uppercase" lts={1}>
                  Question Review & Explanations ({breakdown.length})
                </Text>

                {breakdown.map((item, idx) => {
                  return (
                    <Paper
                      key={item.id || idx}
                      withBorder
                      p="md"
                      radius="md"
                      style={{
                        borderColor: item.isCorrect ? '#86efac' : '#fca5a5',
                        backgroundColor: item.isCorrect ? '#f0fdf4' : '#fef2f2',
                      }}
                    >
                      <Group justify="space-between" align="flex-start" mb={4}>
                        <Text fw={650} size="sm" style={{ flex: 1 }}>
                          {idx + 1}. {item.question}
                        </Text>
                        <Badge
                          size="sm"
                          color={item.isCorrect ? 'green' : 'red'}
                          variant="filled"
                        >
                          {item.isCorrect ? 'Correct' : 'Incorrect'}
                        </Badge>
                      </Group>

                      <Text size="xs" c="dimmed" mb={2}>
                        <strong>Correct Answer:</strong>{' '}
                        {item.options ? item.options[item.correctAnswer] : 'Option'}
                      </Text>

                      {!item.isCorrect && (
                        <Text size="xs" c="red.7" mb={2}>
                          <strong>Your Answer:</strong>{' '}
                          {item.selectedAnswer !== null && item.options
                            ? item.options[item.selectedAnswer]
                            : 'Skipped'}
                        </Text>
                      )}

                      {item.explanation && (
                        <Text size="xs" c="dimmed" fst="italic" mt={4}>
                          Tip: {item.explanation}
                        </Text>
                      )}
                    </Paper>
                  );
                })}
              </Stack>
            )}

            {/* Action buttons */}
            <Group mt="md" gap="sm">
              <Button
                variant="outline"
                color="indigo"
                radius="md"
                leftSection={<IconRefresh size={15} />}
                onClick={handleRetake}
              >
                Retake Assessment
              </Button>
              <Button
                variant="default"
                radius="md"
                onClick={onResetRoom}
              >
                Back to Rooms
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Center>
    );
  }

  // 3. ACTIVE QUIZ TAKING SCREEN
  const currentQ = questions[currentIdx];
  const progressPercent = ((currentIdx + 1) / totalQuestions) * 100;
  const currentSelectedOpt = answers[currentQ?.id];

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', paddingBottom: 40 }}>
      {/* Top Bar with Timer & Progress */}
      <Paper withBorder radius="lg" p="md" mb="md" bg="#ffffff" shadow="xs">
        <Group justify="space-between" align="center" mb="xs" wrap="wrap">
          <div>
            <Group gap="xs">
              <Badge color="indigo" variant="filled" style={{ fontFamily: 'monospace' }}>
                {room.roomCode}
              </Badge>
              <Text fw={700} size="sm" c="dark.8">
                {room.title}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              Student: <strong style={{ color: '#1e293b' }}>{studentName}</strong>
            </Text>
          </div>

          <Group gap="sm">
            {/* Live Timer Pill */}
            <Group
              gap={6}
              px="xs"
              py={4}
              style={{
                borderRadius: 20,
                backgroundColor:
                  timeLimitSeconds > 0 && timeLimitSeconds - timeElapsed < 120
                    ? '#fee2e2'
                    : '#f1f5f9',
                border: '1px solid #e2e8f0',
              }}
            >
              <IconClock
                size={16}
                color={
                  timeLimitSeconds > 0 && timeLimitSeconds - timeElapsed < 120
                    ? '#ef4444'
                    : '#64748b'
                }
              />
              <Text
                size="sm"
                fw={700}
                style={{
                  fontFamily: 'monospace',
                  color:
                    timeLimitSeconds > 0 && timeLimitSeconds - timeElapsed < 120
                      ? '#dc2626'
                      : '#334155',
                }}
              >
                {formatTimer()}
              </Text>
            </Group>

            <Button
              color="indigo"
              size="xs"
              radius="md"
              onClick={() => setConfirmSubmitOpen(true)}
              loading={submitting}
            >
              Submit Quiz ({answeredCount}/{totalQuestions})
            </Button>
          </Group>
        </Group>

        <Progress
          value={progressPercent}
          color="indigo"
          radius="xl"
          size="sm"
          striped
          animated
          mb="sm"
        />

        {/* Question Quick Jump Pills */}
        <Group gap={6} justify="center" wrap="wrap">
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = idx === currentIdx;

            return (
              <Button
                key={q.id || idx}
                size="compact-xs"
                variant={isCurrent ? 'filled' : isAnswered ? 'light' : 'default'}
                color={isCurrent ? 'indigo' : isAnswered ? 'teal' : 'gray'}
                radius="sm"
                onClick={() => setCurrentIdx(idx)}
                style={{
                  minWidth: 28,
                  fontWeight: 700,
                  fontSize: 11,
                  boxShadow: isCurrent ? '0 0 0 2px #a5b4fc' : 'none',
                }}
              >
                {idx + 1}
              </Button>
            );
          })}
        </Group>
      </Paper>

      {/* Main Question Card */}
      <Paper withBorder radius="xl" p="xl" shadow="xs" bg="#ffffff">
        <Group justify="space-between" mb="xs">
          <Badge color="indigo" variant="light" size="md">
            Question {currentIdx + 1} of {totalQuestions}
          </Badge>
          <Text size="xs" c="dimmed">
            {currentSelectedOpt !== undefined ? 'Answered' : 'Not answered yet'}
          </Text>
        </Group>

        <Title order={3} fw={700} mb="xl" c="dark.8" style={{ lineHeight: 1.35 }}>
          {currentQ.question}
        </Title>

        {/* Options Cards */}
        <Radio.Group
          value={currentSelectedOpt !== undefined ? String(currentSelectedOpt) : ''}
          onChange={(val) => handleSelectOption(currentQ.id, val)}
        >
          <Stack gap="sm">
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = currentSelectedOpt === optIdx;

              return (
                <Paper
                  key={optIdx}
                  withBorder
                  p="md"
                  radius="lg"
                  onClick={() => handleSelectOption(currentQ.id, optIdx)}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    borderColor: isSelected ? '#6366f1' : '#e2e8f0',
                    backgroundColor: isSelected ? '#f5f3ff' : '#ffffff',
                    boxShadow: isSelected ? '0 2px 10px rgba(99, 102, 241, 0.15)' : 'none',
                  }}
                >
                  <Group justify="space-between" align="center">
                    <Group gap="md">
                      <ThemeIcon
                        size={30}
                        radius="md"
                        color={isSelected ? 'indigo' : 'gray'}
                        variant={isSelected ? 'filled' : 'light'}
                      >
                        <Text fw={700} size="xs">
                          {String.fromCharCode(65 + optIdx)}
                        </Text>
                      </ThemeIcon>
                      <Text fw={isSelected ? 600 : 500} size="sm" c="dark.8">
                        {opt}
                      </Text>
                    </Group>

                    <Radio
                      value={String(optIdx)}
                      color="indigo"
                      size="sm"
                      aria-label={opt}
                    />
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        </Radio.Group>

        {/* Navigation Bottom Footer */}
        <Group justify="space-between" mt="xl" pt="md" style={{ borderTop: '1px solid #f1f5f9' }}>
          <Button
            variant="default"
            radius="md"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
          >
            Previous
          </Button>

          <Group gap="xs">
            {currentIdx < totalQuestions - 1 ? (
              <Button
                color="indigo"
                radius="md"
                rightSection={<IconArrowRight size={16} />}
                onClick={() => setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
              >
                Next Question
              </Button>
            ) : (
              <Button
                color="teal"
                radius="md"
                leftSection={<IconSend size={16} />}
                onClick={() => setConfirmSubmitOpen(true)}
                loading={submitting}
              >
                Submit Assessment
              </Button>
            )}
          </Group>
        </Group>
      </Paper>

      {/* Confirmation Submit Modal */}
      <Modal
        opened={confirmSubmitOpen}
        onClose={() => setConfirmSubmitOpen(false)}
        title={
          <Text fw={700} size="md">
            Ready to Submit Quiz?
          </Text>
        }
        radius="lg"
      >
        <Stack gap="md">
          <Text size="sm">
            You have answered <strong>{answeredCount}</strong> of <strong>{totalQuestions}</strong> questions.
          </Text>

          {unansweredCount > 0 && (
            <Alert color="orange" icon={<IconAlertCircle size={16} />} title="Unanswered Questions">
              You still have {unansweredCount} unanswered questions. Are you sure you want to finish now?
            </Alert>
          )}

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={() => setConfirmSubmitOpen(false)}>
              Keep Answering
            </Button>
            <Button
              color="indigo"
              onClick={() => triggerSubmit()}
              loading={submitting}
              leftSection={<IconCheck size={16} />}
            >
              Yes, Submit Now
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
