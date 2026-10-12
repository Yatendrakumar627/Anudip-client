import React from 'react';
import { Button, Group, Modal, Text } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';

export default function DeleteModal({ target, onClose, onConfirm, loading }) {
  return (
    <Modal
      opened={!!target}
      onClose={onClose}
      centered
      size="sm"
      title="Delete this record?"
      overlayProps={{ backgroundOpacity: 0.45, blur: 2 }}
    >
      <Text size="sm" c="dimmed">
        This action cannot be undone. Related records may also be removed where applicable.
      </Text>
      <Group justify="flex-end" mt="xl">
        <Button variant="default" onClick={onClose} disabled={loading}>
          Keep record
        </Button>
        <Button color="red" leftSection={<IconTrash size={16} />} loading={loading} onClick={onConfirm}>
          Delete
        </Button>
      </Group>
    </Modal>
  );
}
