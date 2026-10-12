import React from 'react';
import { Paper, SimpleGrid, Text, ThemeIcon } from '@mantine/core';
import { IconCopy, IconKey, IconSearch } from '@tabler/icons-react';

export default function LmsFeatureGrid() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="xl">
      <Paper withBorder radius="lg" p="lg" className="lms-feature-card">
        <ThemeIcon size={42} radius="lg" variant="light" color="indigo" mb="sm">
          <IconKey size={22} />
        </ThemeIcon>
        <Text fw={700} size="md">
          Direct LMS Sign In
        </Text>
        <Text size="xs" c="dimmed" mt={4} lh={1.6}>
          One click redirects directly to <code>learn.anudip.org/login/index.php</code> with zero confusion.
        </Text>
      </Paper>

      <Paper withBorder radius="lg" p="lg" className="lms-feature-card">
        <ThemeIcon size={42} radius="lg" variant="light" color="teal" mb="sm">
          <IconCopy size={22} />
        </ThemeIcon>
        <Text fw={700} size="md">
          One-Click Copy
        </Text>
        <Text size="xs" c="dimmed" mt={4} lh={1.6}>
          Copy any User Name or Password instantly to clipboard without manual selection errors.
        </Text>
      </Paper>

      <Paper withBorder radius="lg" p="lg" className="lms-feature-card">
        <ThemeIcon size={42} radius="lg" variant="light" color="cyan" mb="sm">
          <IconSearch size={22} />
        </ThemeIcon>
        <Text fw={700} size="md">
          Dynamic Batch Sync
        </Text>
        <Text size="xs" c="dimmed" mt={4} lh={1.6}>
          Any batch or dynamic column created by trainers in the spreadsheet table reflects here instantly.
        </Text>
      </Paper>
    </SimpleGrid>
  );
}
