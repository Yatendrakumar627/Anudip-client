import React, { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Divider,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from '@mantine/core';
import { IconActivity, IconCheck, IconSettings, IconShieldCheck, IconVideo } from '@tabler/icons-react';
import PageHeader from '../../components/common/PageHeader';
import { api } from '../../api';
import { showError, showSuccess, showWarning } from '../../utils/notifications';

export default function SettingsPage({
  students = [],
  sessions = [],
  orgName,
  setOrgName,
  threshold,
  setThreshold,
}) {
  const [googleStatus, setGoogleStatus] = useState({ configured: false, demo: api.demoMode });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api
      .googleStatus()
      .then((status) => {
        if (isMounted) setGoogleStatus(status);
      })
      .catch(() => {
        if (isMounted) setGoogleStatus({ configured: false });
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const [adminName, setAdminName] = useState(
    () => localStorage.getItem('anudip-admin-name') || 'LMS Administrator'
  );

  const save = () => {
    if (!orgName.trim()) {
      showWarning('Enter an organisation name before saving workspace preferences.', 'Organisation name required');
      return;
    }
    const cleanedOrgName = orgName.trim();
    setOrgName(cleanedOrgName);
    localStorage.setItem('anudip-org-name', cleanedOrgName);
    localStorage.setItem('anudip-attendance-threshold', threshold);
    localStorage.setItem('anudip-admin-name', adminName.trim() || 'LMS Administrator');
    showSuccess('Workspace preferences are saved in this browser.', 'Preferences saved');
  };

  const checkGoogle = async () => {
    setChecking(true);
    try {
      const result = await api.googleStatus();
      setGoogleStatus(result);
      if (result.configured) {
        showSuccess('Google Meet credentials are configured.', 'Google integration status');
      } else {
        showWarning('Google Meet OAuth is not configured yet.', 'Google integration status');
      }
    } catch (e) {
      showError(e);
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Workspace details, attendance rules and integration status."
        eyebrow="WORKSPACE SETTINGS"
      />

      <div className="settings-grid">
        <Paper withBorder radius="lg" p="xl">
          <div className="settings-section-title">
            <ThemeIcon variant="light" color="indigo" size={42} radius="lg">
              <IconSettings size={21} />
            </ThemeIcon>
            <div>
              <Text fw={700}>Organisation preferences</Text>
              <Text size="sm" c="dimmed">
                Personalise this workspace for your NGO.
              </Text>
            </div>
          </div>
          <Stack mt="xl" gap="md">
            <TextInput
              label="Organisation name"
              value={orgName}
              onChange={(e) => setOrgName(e.currentTarget.value)}
              description="Used in this workspace's local settings and branding."
            />
            <TextInput
              label="Administrator / Facilitator display name"
              value={adminName}
              onChange={(e) => setAdminName(e.currentTarget.value)}
              description="Shown in the sidebar and top navigation profile."
            />
            <Select
              label="Attendance on-track threshold"
              value={threshold}
              onChange={(v) => setThreshold(v || '75')}
              data={[
                { value: '50', label: '50% attendance' },
                { value: '60', label: '60% attendance' },
                { value: '75', label: '75% attendance (recommended)' },
                { value: '80', label: '80% attendance' },
                { value: '90', label: '90% attendance' },
              ]}
              description="Learners meeting this percentage are highlighted as on-track in the student directory."
            />
            <Button onClick={save} leftSection={<IconCheck size={16} />} w="fit-content">
              Save preferences
            </Button>
          </Stack>
        </Paper>

        <Paper withBorder radius="lg" p="xl">
          <div className="settings-section-title">
            <ThemeIcon variant="light" color="teal" size={42} radius="lg">
              <IconVideo size={21} />
            </ThemeIcon>
            <div>
              <Text fw={700}>Google Meet integration</Text>
              <Text size="sm" c="dimmed">
                Bring join/leave times into attendance automatically.
              </Text>
            </div>
          </div>

          <div className="integration-status-row">
            <div>
              <Text fw={650} size="sm">
                Connection status
              </Text>
              <Text size="xs" c="dimmed">
                {googleStatus.demo
                  ? 'Demo mode · local browser storage'
                  : 'Node API and OAuth configuration'}
              </Text>
            </div>
            <Badge color={googleStatus.configured ? 'teal' : 'orange'} variant="light">
              {googleStatus.configured ? 'Configured' : 'Not connected'}
            </Badge>
          </div>

          <Text size="sm" c="dimmed" mt="md">
            Automatic sync uses the Google Meet REST API. The server needs OAuth client
            credentials and an authorised refresh token. The server can resolve the conference record
            from the Meet link and session date, or use a saved conference record.
          </Text>

          <Button
            mt="lg"
            variant="default"
            onClick={checkGoogle}
            loading={checking}
            leftSection={<IconActivity size={16} />}
          >
            Check connection
          </Button>

          <Divider my="lg" />

          <Text size="sm" fw={650}>
            Current workspace
          </Text>
          <div className="settings-facts">
            <div>
              <span>Students</span>
              <strong>{students.length}</strong>
            </div>
            <div>
              <span>Training sessions</span>
              <strong>{sessions.length}</strong>
            </div>
            <div>
              <span>Storage</span>
              <strong>{api.demoMode ? 'Browser localStorage' : 'Connected API'}</strong>
            </div>
          </div>
        </Paper>

        <Paper withBorder radius="lg" p="xl" className="privacy-panel">
          <div className="settings-section-title">
            <ThemeIcon variant="light" color="orange" size={42} radius="lg">
              <IconShieldCheck size={21} />
            </ThemeIcon>
            <div>
              <Text fw={700}>Data & privacy</Text>
              <Text size="sm" c="dimmed">
                Good defaults for sensitive learner records.
              </Text>
            </div>
          </div>
          <Stack gap="sm" mt="lg">
            <Group align="flex-start" gap="sm">
              <IconCheck size={17} color="#0e9f8a" />
              <Text size="sm">
                Student details and notes should only be visible to authorised staff.
              </Text>
            </Group>
            <Group align="flex-start" gap="sm">
              <IconCheck size={17} color="#0e9f8a" />
              <Text size="sm">
                Keep OAuth refresh tokens in server environment variables or a secure secret
                manager—never in the frontend.
              </Text>
            </Group>
            <Group align="flex-start" gap="sm">
              <IconCheck size={17} color="#0e9f8a" />
              <Text size="sm">
                For production, enable admin login, role-based access, backups and an audit trail
                before storing real learner data.
              </Text>
            </Group>
          </Stack>
        </Paper>
      </div>
    </>
  );
}
