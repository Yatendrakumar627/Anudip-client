import React, { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Switch,
  Select,
  Button,
  Group,
  Stack,
  Text,
  Paper,
  ActionIcon,
  Radio,
  Divider,
  Menu,
  ThemeIcon,
  Badge,
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconSparkles,
  IconRefresh,
  IconHelpCircle,
  IconCheck,
  IconClock,
} from '@tabler/icons-react';
import { QUIZ_TEMPLATES } from './quizPresets';
import { showWarning } from '../../utils/notifications';

function generateRandomCode(prefix = 'ROOM') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${rand}`;
}

export default function QuizRoomModal({
  opened,
  onClose,
  room,
  onSave,
  batches = [],
  loading = false,
}) {
  const isEditing = Boolean(room?.id);

  const [title, setTitle] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [description, setDescription] = useState('');
  const [batch, setBatch] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(10);
  const [isActive, setIsActive] = useState(true);
  const [allowReview, setAllowReview] = useState(true);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (opened) {
      if (room) {
        setTitle(room.title || '');
        setRoomCode(room.roomCode || '');
        setDescription(room.description || '');
        setBatch(room.batch || '');
        setTimeLimitMinutes(Number(room.timeLimitMinutes) || 0);
        setIsActive(room.isActive !== false);
        setAllowReview(room.allowReview !== false);
        setQuestions(
          Array.isArray(room.questions) && room.questions.length
            ? JSON.parse(JSON.stringify(room.questions))
            : [createBlankQuestion()]
        );
      } else {
        // Fresh room
        setTitle('');
        setRoomCode(generateRandomCode('ANUDIP'));
        setDescription('');
        setBatch('');
        setTimeLimitMinutes(10);
        setIsActive(true);
        setAllowReview(true);
        // Default with preset 1 or blank
        setQuestions(JSON.parse(JSON.stringify(QUIZ_TEMPLATES[0].questions)));
      }
    }
  }, [opened, room]);

  function createBlankQuestion() {
    return {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      question: '',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      answer: 0,
      explanation: '',
      points: 1,
    };
  }

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, createBlankQuestion()]);
  };

  const handleRemoveQuestion = (idx) => {
    if (questions.length <= 1) {
      showWarning('A quiz must have at least one question.');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const handleOptionChange = (qIdx, optIdx, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOpts = [...q.options];
        newOpts[optIdx] = value;
        return { ...q, options: newOpts };
      })
    );
  };

  const handleAddOption = (qIdx) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        if (q.options.length >= 6) {
          showWarning('Maximum 6 options allowed per question.');
          return q;
        }
        return {
          ...q,
          options: [...q.options, `Option ${String.fromCharCode(65 + q.options.length)}`],
        };
      })
    );
  };

  const handleRemoveOption = (qIdx, optIdx) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        if (q.options.length <= 2) {
          showWarning('A question must have at least 2 options.');
          return q;
        }
        const newOpts = q.options.filter((_, idx) => idx !== optIdx);
        let newAnswer = q.answer;
        if (newAnswer === optIdx) newAnswer = 0;
        else if (newAnswer > optIdx) newAnswer -= 1;
        return { ...q, options: newOpts, answer: newAnswer };
      })
    );
  };

  const handleLoadTemplate = (template) => {
    setQuestions(JSON.parse(JSON.stringify(template.questions)));
    if (!title) setTitle(template.label);
    if (!description) setDescription(template.description);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showWarning('Please enter a Quiz Title.');
      return;
    }
    if (!roomCode.trim()) {
      showWarning('Please provide a Room Code.');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        showWarning(`Question #${i + 1} has no text. Please write a question.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          showWarning(`Question #${i + 1}, Option ${String.fromCharCode(65 + j)} cannot be empty.`);
          return;
        }
      }
    }

    onSave({
      id: room?.id,
      title: title.trim(),
      roomCode: roomCode.trim().toUpperCase(),
      description: description.trim(),
      batch: batch || '',
      timeLimitMinutes: Number(timeLimitMinutes) || 0,
      isActive,
      allowReview,
      questions,
    });
  };

  const batchOptions = (batches || []).map((b) => ({
    value: b.name || b.code || '',
    label: b.name || b.code || '',
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon size={30} radius="md" color="indigo" variant="light">
            <IconHelpCircle size={18} />
          </ThemeIcon>
          <div>
            <Text fw={700} size="md">
              {isEditing ? 'Edit Quiz Room' : 'Create New Quiz Room'}
            </Text>
            <Text size="xs" c="dimmed">
              Define room settings, manage questions, and configure assessments.
            </Text>
          </div>
        </Group>
      }
      size="xl"
      radius="lg"
      padding="lg"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          {/* Top Room Settings */}
          <Paper withBorder p="md" radius="md" bg="var(--mantine-color-gray-0)">
            <Stack gap="sm">
              <Group grow align="flex-start">
                <TextInput
                  label="Quiz Room Title"
                  placeholder="e.g. Frontend Essentials Mock Test"
                  value={title}
                  onChange={(e) => setTitle(e.currentTarget.value)}
                  required
                />
                <TextInput
                  label="Room Join Code"
                  placeholder="e.g. WEB-101"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.currentTarget.value.toUpperCase())}
                  required
                  rightSection={
                    <ActionIcon
                      variant="subtle"
                      color="indigo"
                      size="sm"
                      onClick={() => setRoomCode(generateRandomCode('ANUDIP'))}
                      title="Generate New Code"
                    >
                      <IconRefresh size={14} />
                    </ActionIcon>
                  }
                />
              </Group>

              <Textarea
                label="Room Description / Instructions"
                placeholder="Brief guidelines for students before they take this quiz..."
                value={description}
                onChange={(e) => setDescription(e.currentTarget.value)}
                rows={2}
              />

              <Group grow align="center">
                <Select
                  label="Assign to Batch (Optional)"
                  placeholder="General or specific cohort"
                  data={batchOptions}
                  value={batch}
                  onChange={(val) => setBatch(val || '')}
                  clearable
                  searchable
                />
                <NumberInput
                  label="Time Limit (Minutes)"
                  description="0 = No limit"
                  value={timeLimitMinutes}
                  onChange={(val) => setTimeLimitMinutes(val)}
                  min={0}
                  max={180}
                  step={5}
                />
              </Group>

              <Divider my="xs" />

              <Group justify="space-between" wrap="wrap">
                <Switch
                  label="Room Active (Accepting Submissions)"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.currentTarget.checked)}
                  color="teal"
                />
                <Switch
                  label="Show Explanations to Students After Submission"
                  checked={allowReview}
                  onChange={(e) => setAllowReview(e.currentTarget.checked)}
                  color="indigo"
                />
              </Group>

              <Group
                p="xs"
                style={{
                  borderRadius: 8,
                  backgroundColor: '#faf5ff',
                  border: '1px solid #e9d5ff',
                }}
                justify="space-between"
              >
                <Group gap="xs">
                  <ThemeIcon size={24} radius="xl" color="grape" variant="light">
                    <IconClock size={14} />
                  </ThemeIcon>
                  <Text size="xs" c="dark.7">
                    <strong>48-Hour Auto-Deletion:</strong> This room and all its student submissions will automatically be deleted <strong>48 hours</strong> after creation.
                  </Text>
                </Group>
                <Badge size="xs" color="grape" variant="filled">
                  48 Hours TTL
                </Badge>
              </Group>
            </Stack>
          </Paper>

          {/* Questions Header with Presets & Add Question */}
          <Group justify="space-between" align="center" mt="xs">
            <div>
              <Group gap="xs">
                <Text fw={700} size="md" c="dark.8">
                  Questions ({questions.length})
                </Text>
                <Badge color="indigo" variant="light" size="sm">
                  Total Points: {questions.reduce((acc, q) => acc + (q.points || 1), 0)}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                Each question requires at least 2 options and 1 correct answer selected.
              </Text>
            </div>

            <Group gap="xs">
              <Menu shadow="md" width={260} position="bottom-end">
                <Menu.Target>
                  <Button
                    variant="light"
                    color="indigo"
                    size="xs"
                    radius="md"
                    leftSection={<IconSparkles size={14} />}
                  >
                    Load Preset
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>Select Curriculum Template</Menu.Label>
                  {QUIZ_TEMPLATES.map((tmpl, idx) => (
                    <Menu.Item
                      key={idx}
                      onClick={() => handleLoadTemplate(tmpl)}
                      rightSection={<Badge size="xs">{tmpl.questions.length} Qs</Badge>}
                    >
                      <Text size="xs" fw={600}>
                        {tmpl.label}
                      </Text>
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>

              <Button
                variant="outline"
                color="indigo"
                size="xs"
                radius="md"
                leftSection={<IconPlus size={14} />}
                onClick={handleAddQuestion}
              >
                Add Question
              </Button>
            </Group>
          </Group>

          {/* Questions List */}
          <Stack gap="md">
            {questions.map((q, qIdx) => (
              <Paper
                key={q.id || qIdx}
                withBorder
                p="md"
                radius="md"
                style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
              >
                <Group justify="space-between" align="center" mb="xs">
                  <Badge color="indigo" variant="filled" size="sm">
                    Question {qIdx + 1}
                  </Badge>

                  <Group gap="xs">
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      size="sm"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      title="Delete Question"
                    >
                      <IconTrash size={15} />
                    </ActionIcon>
                  </Group>
                </Group>

                <TextInput
                  placeholder={`Write question prompt #${qIdx + 1}...`}
                  value={q.question}
                  onChange={(e) => handleQuestionChange(qIdx, 'question', e.currentTarget.value)}
                  mb="sm"
                  size="sm"
                  required
                />

                <Text size="xs" fw={700} c="dimmed" mb={4}>
                  Options (select the radio for the correct answer):
                </Text>

                <Radio.Group
                  value={String(q.answer)}
                  onChange={(val) => handleQuestionChange(qIdx, 'answer', Number(val))}
                >
                  <Stack gap={6}>
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = Number(q.answer) === optIdx;
                      return (
                        <Group
                          key={optIdx}
                          gap="xs"
                          align="center"
                          style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            backgroundColor: isCorrect ? '#ecfdf5' : '#f8fafc',
                            border: `1px solid ${isCorrect ? '#a7f3d0' : '#e2e8f0'}`,
                          }}
                        >
                          <Radio
                            value={String(optIdx)}
                            color="teal"
                            size="sm"
                            aria-label={`Mark Option ${String.fromCharCode(65 + optIdx)} as correct`}
                          />
                          <Badge
                            size="xs"
                            color={isCorrect ? 'teal' : 'gray'}
                            variant={isCorrect ? 'filled' : 'light'}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </Badge>
                          <TextInput
                            value={opt}
                            onChange={(e) =>
                              handleOptionChange(qIdx, optIdx, e.currentTarget.value)
                            }
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            size="xs"
                            style={{ flex: 1 }}
                            required
                          />
                          {q.options.length > 2 && (
                            <ActionIcon
                              size="xs"
                              color="gray"
                              variant="subtle"
                              onClick={() => handleRemoveOption(qIdx, optIdx)}
                              title="Remove this option"
                            >
                              <IconTrash size={12} />
                            </ActionIcon>
                          )}
                        </Group>
                      );
                    })}
                  </Stack>
                </Radio.Group>

                <Group justify="space-between" align="center" mt="xs">
                  {q.options.length < 6 && (
                    <Button
                      variant="subtle"
                      size="compact-xs"
                      color="indigo"
                      leftSection={<IconPlus size={12} />}
                      onClick={() => handleAddOption(qIdx)}
                    >
                      Add Option
                    </Button>
                  )}
                </Group>

                <TextInput
                  placeholder="Optional: Explanation / learning tip shown upon review..."
                  value={q.explanation || ''}
                  onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.currentTarget.value)}
                  mt="xs"
                  size="xs"
                  leftSection={<IconHelpCircle size={14} color="#94a3b8" />}
                />
              </Paper>
            ))}
          </Stack>

          <Button
            variant="light"
            color="indigo"
            radius="md"
            leftSection={<IconPlus size={16} />}
            onClick={handleAddQuestion}
            fullWidth
            py="xs"
          >
            Add Another Question
          </Button>

          <Divider my="sm" />

          {/* Footer Actions */}
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose} radius="md" disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              color="indigo"
              radius="md"
              loading={loading}
              leftSection={<IconCheck size={16} />}
            >
              {isEditing ? 'Save Changes' : 'Create Quiz Room'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
