import React from 'react';
import { Badge, Card, Group, Paper, SimpleGrid, Text, ThemeIcon } from '@mantine/core';
import { IconCopy, IconInfoCircle } from '@tabler/icons-react';

export default function LmsGuideSteps({ defaultCohortName = '' }) {
  return (
    <Paper withBorder radius="lg" p="md" mb="lg" className="lms-guide-paper">
      <Group justify="space-between" align="center" mb="xs">
        <Group gap="xs">
          <ThemeIcon size={28} radius="md" variant="light" color="indigo">
            <IconInfoCircle size={16} />
          </ThemeIcon>
          <Text fw={700} size="sm" c="dark.5">
            How to login to your Anudip LMS Account
          </Text>
        </Group>
        <Badge color="indigo" variant="light" size="sm">
          Quick 3 Steps
        </Badge>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm" mt="xs">
        <Card withBorder radius="md" p="sm" className="step-card">
          <Group gap="xs" mb={4}>
            <span className="step-number">1</span>
            <Text fw={700} size="xs" c="dark.4">
              Find Your Account
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {defaultCohortName ? (
              <>Select your cohort tab (e.g. <strong>{defaultCohortName}</strong>) or search your name or LMS ID below.</>
            ) : (
              <>Select your cohort tab or search your name or LMS ID below.</>
            )}
          </Text>
        </Card>

        <Card withBorder radius="md" p="sm" className="step-card">
          <Group gap="xs" mb={4}>
            <span className="step-number">2</span>
            <Text fw={700} size="xs" c="dark.4">
              Copy Your Credentials
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            Click the copy icon <IconCopy size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> next to your <strong>User Name</strong> and <strong>Password</strong>.
          </Text>
        </Card>

        <Card withBorder radius="md" p="sm" className="step-card">
          <Group gap="xs" mb={4}>
            <span className="step-number">3</span>
            <Text fw={700} size="xs" c="dark.4">
              Click Direct Login
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            Click <strong>"Login to LMS ↗"</strong> to redirect directly to <code>learn.anudip.org/login/index.php</code>.
          </Text>
        </Card>
      </SimpleGrid>
    </Paper>
  );
}
