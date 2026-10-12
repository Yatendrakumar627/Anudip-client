import React, { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  Radio,
  Select,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconEraser,
  IconInfoCircle,
  IconTable,
  IconTrash,
  IconUsers,
  IconUsersGroup,
  IconX,
} from '@tabler/icons-react';

export default function BatchDeleteModal({
  opened,
  onClose,
  batch: initialBatch,
  batches = [],
  students = [],
  onConfirmDelete,
  onConfirmClearTable,
  loading = false,
}) {
  const [deleteMode, setDeleteMode] = useState('with_table'); // 'with_table' | 'batch_only'
  const [isClearingTable, setIsClearingTable] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatch?.id || null);

  useEffect(() => {
    if (initialBatch?.id) {
      setSelectedBatchId(initialBatch.id);
    }
  }, [initialBatch?.id]);

  const batch = (batches.length ? batches.find((b) => b.id === selectedBatchId) : null) || initialBatch;

  if (!batch) return null;

  // Determine enrolled students count for dynamically selected batch
  const enrolledStudents = students.filter(
    (s) => s.batch === batch.name || (batch.id && s.batch === batch.id)
  );
  const studentCount = enrolledStudents.length || batch.rows?.length || 0;
  const columnsCount = batch.columns?.length || 4;

  const handleExecuteDelete = async () => {
    if (!onConfirmDelete || !batch) return;
    await onConfirmDelete(batch, {
      deleteStudents: deleteMode === 'with_table',
    });
    onClose();
  };

  const handleExecuteClearTable = async () => {
    if (!onConfirmClearTable || !batch) return;
    setIsClearingTable(true);
    try {
      await onConfirmClearTable(batch);
      onClose();
    } finally {
      setIsClearingTable(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="md"
      radius="lg"
      padding="xl"
      overlayProps={{ backgroundOpacity: 0.5, blur: 3 }}
      title={
        <Group gap="xs" align="center">
          <ThemeIcon size={34} radius="md" color="red" variant="light">
            <IconTrash size={18} />
          </ThemeIcon>
          <div>
            <Text fw={800} size="md" c="dark.6">
              Delete Batch & Table Options
            </Text>
            <Text size="xs" c="dimmed">
              Choose how you want to handle this cohort and its spreadsheet data.
            </Text>
          </div>
        </Group>
      }
    >
      <Stack gap="md" mt="xs">
        {/* Dynamic Batch Selector: check/choose which batch table to delete */}
        {batches.length > 0 && (
          <div>
            <Text fw={700} size="xs" c="dark.5" mb={4} tt="uppercase" ls={0.5}>
              Target Batch Table To Delete
            </Text>
            <Select
              size="sm"
              radius="md"
              leftSection={<IconTable size={16} />}
              value={batch.id}
              onChange={(newId) => setSelectedBatchId(newId)}
              data={batches.map((b) => {
                const count =
                  students.filter((s) => s.batch === b.name || s.batch === b.id).length ||
                  b.rows?.length ||
                  0;
                return {
                  value: b.id,
                  label: `${b.code ? `[${b.code}] ` : ''}${b.name} (${count} learners)`,
                };
              })}
            />
          </div>
        )}

        {/* Batch Summary Card */}
        <Paper withBorder radius="md" p="sm" bg="#f8fafc" style={{ borderLeft: '4px solid #ef4444' }}>
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs">
            <div>
              <Text fw={700} size="sm" c="dark.5">
                {batch.name}
              </Text>
              <Text size="xs" c="dimmed" mt={2}>
                Code: <strong>{batch.code || 'N/A'}</strong> · Field: {batch.field}
              </Text>
              {batch.trainer && (
                <Text size="xs" c="dimmed">
                  Trainer: {batch.trainer} {batch.timing ? `(${batch.timing})` : ''}
                </Text>
              )}
            </div>
            <Group gap={6}>
              <Badge color="red" variant="light" size="sm" leftSection={<IconUsers size={12} />}>
                {studentCount} Learners
              </Badge>
              <Badge color="gray" variant="outline" size="sm" leftSection={<IconTable size={12} />}>
                {columnsCount} Columns
              </Badge>
            </Group>
          </Group>
        </Paper>

        {/* Delete Mode Selection */}
        <div>
          <Text fw={700} size="xs" c="dark.4" mb="xs" tt="uppercase" ls={0.5}>
            Select Deletion Scope
          </Text>

          <Radio.Group value={deleteMode} onChange={setDeleteMode}>
            <Stack gap="xs">
              {/* Option 1: Delete Batch with Table & Students (Cascade) */}
              <Paper
                withBorder
                radius="md"
                p="sm"
                onClick={() => setDeleteMode('with_table')}
                style={{
                  cursor: 'pointer',
                  borderColor: deleteMode === 'with_table' ? '#ef4444' : '#e2e8f0',
                  background: deleteMode === 'with_table' ? '#fef2f2' : '#ffffff',
                  transition: 'all 0.15s ease',
                }}
              >
                <Group align="flex-start" wrap="nowrap" gap="sm">
                  <Radio value="with_table" color="red" mt={2} />
                  <div style={{ flex: 1 }}>
                    <Group justify="space-between" align="center" wrap="wrap">
                      <Text fw={700} size="sm" c="red.8">
                        Delete Batch WITH Table & Enrolled Students
                      </Text>
                      <Badge color="red" size="xs" variant="filled">
                        Cascading Delete
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed" mt={3}>
                      Permanently wipes this batch, its dynamic table, and removes all{' '}
                      <strong>{studentCount} enrolled learners</strong> from the student directory,
                      attendance logs, and placement records.
                    </Text>
                  </div>
                </Group>
              </Paper>

              {/* Option 2: Delete Batch Only (Preserve Students) */}
              <Paper
                withBorder
                radius="md"
                p="sm"
                onClick={() => setDeleteMode('batch_only')}
                style={{
                  cursor: 'pointer',
                  borderColor: deleteMode === 'batch_only' ? '#3b82f6' : '#e2e8f0',
                  background: deleteMode === 'batch_only' ? '#eff6ff' : '#ffffff',
                  transition: 'all 0.15s ease',
                }}
              >
                <Group align="flex-start" wrap="nowrap" gap="sm">
                  <Radio value="batch_only" color="indigo" mt={2} />
                  <div style={{ flex: 1 }}>
                    <Group justify="space-between" align="center" wrap="wrap">
                      <Text fw={700} size="sm" c="indigo.8">
                        Delete Batch Only (Preserve Students in Directory)
                      </Text>
                      <Badge color="indigo" size="xs" variant="light">
                        Keep Learners Safe
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed" mt={3}>
                      Removes this batch and timetable, but keeps all{' '}
                      <strong>{studentCount} student profiles</strong> safe in the directory. Their batch
                      will be marked as unassigned so no training history is lost.
                    </Text>
                  </div>
                </Group>
              </Paper>
            </Stack>
          </Radio.Group>
        </div>

        {/* Warning Alert */}
        <Alert
          icon={<IconAlertTriangle size={16} />}
          color={deleteMode === 'with_table' ? 'red' : 'indigo'}
          radius="md"
          p="xs"
          variant="light"
        >
          <Text size="xs">
            {deleteMode === 'with_table'
              ? `⚠️ This will permanently remove ${studentCount} student records and cannot be undone.`
              : `ℹ️ The batch schedule will be removed. ${studentCount} students will remain in your global directory.`}
          </Text>
        </Alert>

        <Divider />

        {/* Alternative Action: Clear Table Data Only */}
        <Paper withBorder radius="md" p="xs" bg="#f8fafc">
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Group gap="xs">
              <ThemeIcon size="sm" color="gray" variant="light">
                <IconEraser size={13} />
              </ThemeIcon>
              <div>
                <Text size="xs" fw={600} c="dark.5">
                  Want to keep this batch but reset the spreadsheet table?
                </Text>
                <Text size="xs" c="dimmed">
                  Wipes the {studentCount} table rows while keeping batch timings and columns.
                </Text>
              </div>
            </Group>
            <Button
              size="compact-xs"
              variant="light"
              color="orange"
              leftSection={<IconEraser size={12} />}
              loading={isClearingTable}
              onClick={handleExecuteClearTable}
            >
              Clear "{batch.code || batch.name}" Table
            </Button>
          </Group>
        </Paper>

        {/* Modal Action Buttons */}
        <Group justify="flex-end" gap="xs" mt="sm">
          <Button variant="default" radius="md" onClick={onClose} disabled={loading || isClearingTable}>
            Cancel
          </Button>
          <Button
            color={deleteMode === 'with_table' ? 'red' : 'indigo'}
            radius="md"
            leftSection={<IconTrash size={16} />}
            loading={loading}
            onClick={handleExecuteDelete}
          >
            {deleteMode === 'with_table'
              ? `Delete "${batch.code || batch.name}" & Table`
              : `Delete "${batch.code || batch.name}" Only`}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
