import React, { useState } from 'react';
import {
  Alert,
  Button,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconAlertCircle, IconCheck, IconKey, IconLock, IconShieldLock } from '@tabler/icons-react';
import { useAdminAuth } from '../../context/AuthContext';

export default function AdminAuthModal() {
  const { authModalOpen, closeLoginModal, login, authLoading } = useAdminAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!password) {
      setError('Please enter the administrator password.');
      return;
    }

    setError('');
    const res = await login(password);
    if (!res.success) {
      setError(res.error || 'Authentication failed. Please verify password.');
    } else {
      setPassword('');
      setError('');
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    closeLoginModal();
  };

  return (
    <Modal
      opened={authModalOpen}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <ThemeIcon size={28} radius="md" color="indigo" variant="light">
            <IconShieldLock size={18} />
          </ThemeIcon>
          <Text fw={750} size="sm" c="dark.6">
            Administrator Authentication
          </Text>
        </Group>
      }
      radius="lg"
      shadow="xl"
      centered
      padding="lg"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 4,
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Text size="xs" c="dimmed">
            Access to <strong>Batches</strong>, <strong>Student Directory</strong>, and <strong>LMS Administration</strong> requires facilitator credentials.
          </Text>

          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Access Denied"
              color="red"
              radius="md"
              variant="light"
            >
              {error}
            </Alert>
          )}

          <PasswordInput
            label="Administrator Password"
            description="Encrypted password verification"
            placeholder="Enter admin password..."
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            autoFocus
            leftSection={<IconKey size={16} color="#6366f1" />}
            radius="md"
            size="sm"
            required
          />

          <Text size="11px" c="dimmed">
            ⏱️ <strong>Session Security:</strong> Access is cached for <strong>15 minutes</strong>, after which re-authentication is automatically required.
          </Text>

          <Group justify="flex-end" gap="xs" mt="sm">
            <Button variant="default" radius="md" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              color="indigo"
              radius="md"
              size="sm"
              loading={authLoading}
              leftSection={<IconLock size={15} />}
            >
              Unlock Access
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
