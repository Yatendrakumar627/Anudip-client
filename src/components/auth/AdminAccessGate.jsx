import React, { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconKey,
  IconLock,
  IconSchool,
  IconShieldLock,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AuthContext';

export default function AdminAccessGate({
  featureTitle = 'Cohort Management',
  featureDescription = 'Managing training cohorts, creating spreadsheets, and student rosters requires administrative authorization.',
  children,
}) {
  const { isAdmin, login, authLoading } = useAdminAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAdmin) {
    return children;
  }

  const handleUnlock = async (e) => {
    e?.preventDefault();
    if (!password) {
      setError('Please enter the administrator password.');
      return;
    }

    setError('');
    const res = await login(password);
    if (!res.success) {
      setError(res.error || 'Authentication failed. Please verify password.');
    }
  };

  return (
    <div style={{ maxWidth: 540, margin: '60px auto 40px', padding: '0 16px' }}>
      <Paper withBorder radius="xl" p="xl" shadow="md" style={{ textAlign: 'center', background: '#ffffff' }}>
        <Stack align="center" gap="md">
          <ThemeIcon size={64} radius="xl" color="indigo" variant="light" style={{ border: '2px solid #c7d2fe' }}>
            <IconShieldLock size={34} color="#4f46e5" />
          </ThemeIcon>

          <div>
            <Badge color="indigo" variant="light" size="sm" mb={6}>
              ADMINISTRATIVE ACCESS ONLY
            </Badge>
            <Title order={3} fw={800} c="dark.7">
              {featureTitle} Locked
            </Title>
            <Text size="sm" c="dimmed" mt={6} style={{ lineHeight: 1.5 }}>
              {featureDescription}
            </Text>
          </div>

          <form onSubmit={handleUnlock} style={{ width: '100%', marginTop: 8 }}>
            <Stack gap="sm">
              {error && (
                <Alert
                  icon={<IconAlertCircle size={15} />}
                  color="red"
                  variant="light"
                  radius="md"
                  style={{ textAlign: 'left' }}
                >
                  {error}
                </Alert>
              )}

              <PasswordInput
                placeholder="Enter administrator password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                leftSection={<IconKey size={16} color="#6366f1" />}
                radius="md"
                size="md"
                autoFocus
                required
              />

              <Button
                type="submit"
                color="indigo"
                radius="md"
                size="md"
                fullWidth
                loading={authLoading}
                leftSection={<IconLock size={16} />}
              >
                Unlock Administrator Access
              </Button>
            </Stack>
          </form>

          <Text size="11px" c="dimmed">
            ⏱️ <strong>Session Security:</strong> Access is cached for <strong>15 minutes</strong> with encrypted verification.
          </Text>

          <Group justify="center" gap="sm" mt="xs">
            <Button
              component={Link}
              to="/lms-credential"
              variant="light"
              color="indigo"
              size="xs"
              leftSection={<IconSchool size={14} />}
            >
              Return to LMS Student Portal
            </Button>
          </Group>
        </Stack>
      </Paper>
    </div>
  );
}
