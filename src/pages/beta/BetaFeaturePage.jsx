import React from 'react';
import {
  Badge,
  Button,
  Card,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconClockPlay,
  IconFlask,
  IconRocket,
  IconSchool,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export default function BetaFeaturePage({
  title = 'Beta Feature',
  subtitle = 'This module is currently part of the upcoming beta release and is temporarily disabled in this production version.',
  icon: Icon = IconFlask,
  scheduledVersion = 'v2.0 Beta',
}) {
  return (
    <div style={{ maxWidth: 640, margin: '60px auto 40px', padding: '0 16px' }}>
      <Paper
        withBorder
        radius="xl"
        p="xl"
        shadow="md"
        style={{
          textAlign: 'center',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          borderColor: '#e2e8f0',
        }}
      >
        <Stack align="center" gap="md">
          <ThemeIcon
            size={68}
            radius="xl"
            color="orange"
            variant="light"
            style={{ border: '2px dashed #fdba74' }}
          >
            <Icon size={36} color="#ea580c" />
          </ThemeIcon>

          <div>
            <Group justify="center" gap="xs" mb={8}>
              <Badge color="orange" variant="filled" size="sm" radius="sm">
                BETA VERSION
              </Badge>
              <Badge color="gray" variant="outline" size="sm" radius="sm">
                DISABLED
              </Badge>
              <Badge color="indigo" variant="light" size="sm" radius="sm">
                {scheduledVersion}
              </Badge>
            </Group>

            <Title order={2} fw={800} c="dark.7">
              {title}
            </Title>
            <Text size="sm" c="dimmed" mt={8} style={{ lineHeight: 1.6, maxWidth: 480, margin: '8px auto 0' }}>
              {subtitle}
            </Text>
          </div>

          <Card withBorder radius="lg" p="md" mt="xs" style={{ background: '#fffbeb', borderColor: '#fef3c7', width: '100%' }}>
            <Group gap="xs" justify="center">
              <IconClockPlay size={18} color="#d97706" />
              <Text size="xs" fw={700} c="#b45309">
                Feature Status: In Active Engineering & QA Testing
              </Text>
            </Group>
            <Text size="11px" c="#92400e" mt={4}>
              Production workspaces currently prioritize LMS Student Credentials, Cohort Rosters, and Real-time Overview.
            </Text>
          </Card>

          <Group justify="center" gap="sm" mt="md">
            <Button
              component={Link}
              to="/lms-credential"
              color="indigo"
              radius="md"
              size="sm"
              leftSection={<IconSchool size={16} />}
            >
              Open LMS Student Portal
            </Button>
            <Button
              component={Link}
              to="/dashboard"
              variant="default"
              radius="md"
              size="sm"
              leftSection={<IconArrowLeft size={16} />}
            >
              Back to Overview
            </Button>
          </Group>
        </Stack>
      </Paper>
    </div>
  );
}
