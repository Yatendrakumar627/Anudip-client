import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SegmentedControl,
  Group,
  Stack,
  Button,
  TextInput,
  Card,
  Text,
  Title,
  Paper,
  Badge,
  ThemeIcon,
  Center,
  Loader,
  Alert,
} from '@mantine/core';
import {
  IconSchool,
  IconSettings,
  IconAward,
  IconArrowRight,
  IconLock,
  IconLockOpen,
  IconPlus,
  IconSparkles,
  IconAlertCircle,
} from '@tabler/icons-react';
import PageHeader from '../../components/common/PageHeader';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { showSuccess, showError, showWarning } from '../../utils/notifications';

import StudentQuizView from './StudentQuizView';
import AdminQuizRooms from './AdminQuizRooms';
import AdminQuizResults from './AdminQuizResults';
import QuizRoomModal from './QuizRoomModal';

export default function QuizPage({ batches = [] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const roomCodeParam = searchParams.get('room');
  const tabParam = searchParams.get('tab');

  const { isAdmin, openLoginModal } = useAuth();

  // Navigation tab: 'student' | 'rooms' | 'results'
  const [activeTab, setActiveTab] = useState(() => {
    if (tabParam && ['rooms', 'results', 'student'].includes(tabParam)) return tabParam;
    if (roomCodeParam) return 'student';
    return 'student';
  });

  // Data states
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [studentJoinCode, setStudentJoinCode] = useState(roomCodeParam || '');
  const [activeStudentRoom, setActiveStudentRoom] = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);

  // Load all rooms from API (stable callback, zero redundant re-fetches)
  const fetchRooms = useCallback(async () => {
    try {
      const data = await api.listQuizRooms();
      setRooms(Array.isArray(data) ? data : []);
      if (data && data.length) {
        setSelectedRoomId((prev) => prev || data[0].id);
      }
    } catch (err) {
      console.error('Failed to load quiz rooms:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Handle URL query ?room=CODE
  const loadRoomByCode = useCallback(async (code) => {
    if (!code || !code.trim()) return;
    setStudentLoading(true);
    setStudentError('');
    try {
      const roomData = await api.getQuizRoomByCode(code.trim().toUpperCase());
      setActiveStudentRoom(roomData);
      setActiveTab('student');
    } catch (err) {
      setStudentError(err?.message || `Quiz room "${code}" not found.`);
      setActiveStudentRoom(null);
    } finally {
      setStudentLoading(false);
    }
  }, []);

  useEffect(() => {
    if (roomCodeParam) {
      setStudentJoinCode(roomCodeParam);
      loadRoomByCode(roomCodeParam);
    }
  }, [roomCodeParam, loadRoomByCode]);

  // Tab switch handler
  const handleTabChange = (val) => {
    setActiveTab(val);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', val);
    if (val !== 'student') {
      newParams.delete('room');
    }
    setSearchParams(newParams);
  };

  // Student enters code on Join screen
  const handleStudentJoinSubmit = (e) => {
    e.preventDefault();
    if (!studentJoinCode.trim()) {
      showWarning('Please enter a room code to join.');
      return;
    }
    const code = studentJoinCode.trim().toUpperCase();
    const newParams = new URLSearchParams(searchParams);
    newParams.set('room', code);
    setSearchParams(newParams);
    loadRoomByCode(code);
  };

  // Admin Room CRUD
  const handleCreateRoomClick = () => {
    setEditingRoom(null);
    setModalOpen(true);
  };

  const handleEditRoomClick = (room) => {
    setEditingRoom(room);
    setModalOpen(true);
  };

  const handleSaveRoom = async (formData) => {
    setModalSaving(true);
    try {
      if (formData.id) {
        await api.updateQuizRoom(formData.id, formData);
        showSuccess('Quiz room updated successfully.');
      } else {
        await api.createQuizRoom(formData);
        showSuccess('New quiz room created.');
      }
      setModalOpen(false);
      await fetchRooms();
    } catch (err) {
      showError(err, 'Failed to save quiz room');
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this quiz room and all its results?')) return;
    try {
      await api.deleteQuizRoom(roomId);
      showSuccess('Quiz room deleted.');
      await fetchRooms();
    } catch (err) {
      showError(err, 'Failed to delete room');
    }
  };

  const handleToggleActive = async (room, nextStatus) => {
    try {
      await api.updateQuizRoom(room.id, { isActive: nextStatus });
      setRooms((prev) =>
        prev.map((r) => (r.id === room.id ? { ...r, isActive: nextStatus } : r))
      );
      showSuccess(`Room is now ${nextStatus ? 'Active' : 'Closed'}.`);
    } catch (err) {
      showError(err, 'Could not toggle room status');
    }
  };

  // Submission Management
  const handleSubmitQuiz = async (code, payload) => {
    const res = await api.submitQuizRoom(code, payload);
    // Refresh rooms data silently so admin counts stay live
    fetchRooms();
    return res;
  };

  const handleDeleteSubmission = async (roomId, submissionId) => {
    if (!window.confirm('Delete this student result record?')) return;
    try {
      await api.deleteQuizSubmission(roomId, submissionId);
      showSuccess('Student result removed.');
      await fetchRooms();
    } catch (err) {
      showError(err, 'Failed to delete result');
    }
  };

  const handleClearSubmissions = async (roomId) => {
    if (!window.confirm('Are you sure you want to clear ALL student results for this room?')) return;
    try {
      await api.clearQuizSubmissions(roomId);
      showSuccess('All results cleared for this room.');
      await fetchRooms();
    } catch (err) {
      showError(err, 'Failed to clear results');
    }
  };

  // Helper: Copy Join Link
  const handleCopyJoinLink = (code) => {
    const joinUrl = `${window.location.origin}/quiz?room=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(joinUrl);
    showSuccess(`Join link copied: ${joinUrl}`, 'Link Copied');
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    showSuccess(`Room code copied: ${code}`, 'Code Copied');
  };

  const handlePreviewAsStudent = (code) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('room', code);
    newParams.set('tab', 'student');
    setSearchParams(newParams);
    setStudentJoinCode(code);
    loadRoomByCode(code);
  };

  const handleResetStudentRoom = () => {
    setActiveStudentRoom(null);
    setStudentJoinCode('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('room');
    setSearchParams(newParams);
  };

  return (
    <>
      <PageHeader
        title="Interactive Quiz Room"
        subtitle="Administer curriculum assessments, share live quiz rooms, and review student performance."
        eyebrow="ASSESSMENT & LEARNING"
        actions={
          isAdmin && (
            <Button
              color="indigo"
              radius="md"
              leftSection={<IconPlus size={16} />}
              onClick={handleCreateRoomClick}
            >
              New Quiz Room
            </Button>
          )
        }
      />

      <Stack gap="lg" mb="xl">
        {/* Navigation Tabs Pill */}
        <Paper withBorder radius="xl" p={6} bg="#ffffff" shadow="xs">
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <SegmentedControl
              value={activeTab}
              onChange={handleTabChange}
              radius="lg"
              size="sm"
              color="indigo"
              data={[
                {
                  value: 'student',
                  label: (
                    <Center style={{ gap: 8 }}>
                      <IconSchool size={16} />
                      <span>Take Quiz (Student Mode)</span>
                    </Center>
                  ),
                },
                {
                  value: 'rooms',
                  label: (
                    <Center style={{ gap: 8 }}>
                      <IconSettings size={16} />
                      <span>Quiz Rooms {isAdmin ? `(${rooms.length})` : '🔒'}</span>
                    </Center>
                  ),
                },
                {
                  value: 'results',
                  label: (
                    <Center style={{ gap: 8 }}>
                      <IconAward size={16} />
                      <span>Results & Scores {isAdmin ? `(${rooms.reduce((acc, r) => acc + (r.submissions?.length || 0), 0)})` : '🔒'}</span>
                    </Center>
                  ),
                },
              ]}
            />

            {/* Admin status chip */}
            <Group gap="xs" pr="xs">
              {isAdmin ? (
                <Badge
                  color="teal"
                  variant="light"
                  size="md"
                  leftSection={<IconLockOpen size={12} />}
                >
                  Admin Mode Unlocked
                </Badge>
              ) : (
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="indigo"
                  leftSection={<IconLock size={12} />}
                  onClick={() => openLoginModal()}
                >
                  Unlock Admin Portal
                </Button>
              )}
            </Group>
          </Group>
        </Paper>

        {/* TAB 1: STUDENT QUIZ VIEW */}
        {activeTab === 'student' && (
          <div>
            {studentLoading ? (
              <Center py={60}>
                <Stack align="center" gap="xs">
                  <Loader color="indigo" size="md" />
                  <Text size="sm" c="dimmed">
                    Loading Quiz Room...
                  </Text>
                </Stack>
              </Center>
            ) : activeStudentRoom ? (
              <StudentQuizView
                room={activeStudentRoom}
                onSubmitQuiz={handleSubmitQuiz}
                onResetRoom={handleResetStudentRoom}
              />
            ) : (
              /* Student Join Box when no room is currently selected */
              <Center py="md">
                <Paper
                  withBorder
                  radius="xl"
                  p="xl"
                  shadow="sm"
                  style={{ maxWidth: 540, width: '100%', backgroundColor: '#ffffff' }}
                >
                  <Stack gap="lg" align="center" ta="center">
                    <ThemeIcon size={64} radius="xl" color="indigo" variant="light">
                      <IconSchool size={36} />
                    </ThemeIcon>

                    <div>
                      <Title order={2} fw={800} c="dark.8">
                        Join Quiz Room
                      </Title>
                      <Text size="sm" c="dimmed" mt={4}>
                        Enter the unique Room Code provided by your instructor or choose from available rooms below.
                      </Text>
                    </div>

                    {studentError && (
                      <Alert
                        icon={<IconAlertCircle size={16} />}
                        color="red"
                        title="Room Not Found"
                        style={{ width: '100%', textAlign: 'left' }}
                      >
                        {studentError}
                      </Alert>
                    )}

                    <form onSubmit={handleStudentJoinSubmit} style={{ width: '100%' }}>
                      <Stack gap="sm">
                        <TextInput
                          placeholder="e.g. WEB-101"
                          size="lg"
                          radius="md"
                          value={studentJoinCode}
                          onChange={(e) => setStudentJoinCode(e.currentTarget.value.toUpperCase())}
                          style={{ fontFamily: 'monospace' }}
                          required
                        />
                        <Button
                          type="submit"
                          size="md"
                          color="indigo"
                          radius="md"
                          rightSection={<IconArrowRight size={18} />}
                          fullWidth
                        >
                          Join & Enter Quiz
                        </Button>
                      </Stack>
                    </form>

                    {/* Quick Select Available Active Rooms */}
                    {rooms.length > 0 && (
                      <div style={{ width: '100%', marginTop: 8 }}>
                        <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={1} mb="xs">
                          Or Choose from Available Rooms:
                        </Text>
                        <Stack gap="xs">
                          {rooms.map((r) => (
                            <Paper
                              key={r.id}
                              withBorder
                              p="sm"
                              radius="md"
                              onClick={() => {
                                setStudentJoinCode(r.roomCode);
                                loadRoomByCode(r.roomCode);
                              }}
                              style={{
                                cursor: 'pointer',
                                transition: 'background-color 0.15s',
                                textAlign: 'left',
                              }}
                              className="quiz-quick-room-card"
                            >
                              <Group justify="space-between">
                                <div>
                                  <Text fw={700} size="sm" c="dark.8">
                                    {r.title}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    {r.questions?.length || 0} Questions · {r.timeLimitMinutes > 0 ? `${r.timeLimitMinutes}m` : 'Untimed'}
                                  </Text>
                                </div>
                                <Badge size="md" color="indigo" variant="light" style={{ fontFamily: 'monospace' }}>
                                  {r.roomCode}
                                </Badge>
                              </Group>
                            </Paper>
                          ))}
                        </Stack>
                      </div>
                    )}
                  </Stack>
                </Paper>
              </Center>
            )}
          </div>
        )}

        {/* TAB 2: ADMIN QUIZ ROOMS MANAGEMENT */}
        {activeTab === 'rooms' && (
          <div>
            {!isAdmin ? (
              <Center py={60}>
                <Paper withBorder radius="xl" p="xl" ta="center" style={{ maxWidth: 460 }}>
                  <ThemeIcon size={56} radius="xl" color="indigo" variant="light" mb="md">
                    <IconLock size={28} />
                  </ThemeIcon>
                  <Title order={3} fw={800} mb="xs">
                    Admin Portal Locked
                  </Title>
                  <Text size="sm" c="dimmed" mb="lg">
                    Managing quiz rooms and editing questions requires administrator authentication.
                  </Text>
                  <Button
                    color="indigo"
                    radius="md"
                    onClick={() => openLoginModal()}
                  >
                    Enter Admin Password
                  </Button>
                </Paper>
              </Center>
            ) : loading ? (
              <Center py={60}>
                <Stack align="center" gap="xs">
                  <Loader color="indigo" size="md" />
                  <Text size="sm" c="dimmed">
                    Loading Quiz Rooms...
                  </Text>
                </Stack>
              </Center>
            ) : (
              <AdminQuizRooms
                rooms={rooms}
                onCreateRoom={handleCreateRoomClick}
                onEditRoom={handleEditRoomClick}
                onDeleteRoom={handleDeleteRoom}
                onToggleActive={handleToggleActive}
                onViewResults={(roomId) => {
                  setSelectedRoomId(roomId);
                  handleTabChange('results');
                }}
                onPreviewAsStudent={handlePreviewAsStudent}
                onCopyJoinLink={handleCopyJoinLink}
                onCopyCode={handleCopyCode}
              />
            )}
          </div>
        )}

        {/* TAB 3: ADMIN RESULTS DASHBOARD */}
        {activeTab === 'results' && (
          <div>
            {!isAdmin ? (
              <Center py={60}>
                <Paper withBorder radius="xl" p="xl" ta="center" style={{ maxWidth: 460 }}>
                  <ThemeIcon size={56} radius="xl" color="indigo" variant="light" mb="md">
                    <IconLock size={28} />
                  </ThemeIcon>
                  <Title order={3} fw={800} mb="xs">
                    Results Access Restricted
                  </Title>
                  <Text size="sm" c="dimmed" mb="lg">
                    Viewing learner assessment scores and submission details requires administrator credentials.
                  </Text>
                  <Button
                    color="indigo"
                    radius="md"
                    onClick={() => openLoginModal()}
                  >
                    Enter Admin Password
                  </Button>
                </Paper>
              </Center>
            ) : loading ? (
              <Center py={60}>
                <Stack align="center" gap="xs">
                  <Loader color="indigo" size="md" />
                  <Text size="sm" c="dimmed">
                    Loading Assessment Results...
                  </Text>
                </Stack>
              </Center>
            ) : (
              <AdminQuizResults
                rooms={rooms}
                selectedRoomId={selectedRoomId}
                onSelectRoomId={setSelectedRoomId}
                onDeleteSubmission={handleDeleteSubmission}
                onClearSubmissions={handleClearSubmissions}
                onCopyJoinLink={handleCopyJoinLink}
              />
            )}
          </div>
        )}
      </Stack>

      {/* Admin Room Creator / Editor Modal */}
      <QuizRoomModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        room={editingRoom}
        onSave={handleSaveRoom}
        batches={batches}
        loading={modalSaving}
      />
    </>
  );
}
