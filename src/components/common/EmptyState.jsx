import React from 'react';
import { Center, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconFileAnalytics } from '@tabler/icons-react';

export default function EmptyState({ title, description, action, icon: Icon = IconFileAnalytics }) {
  return (
    <Center py={48}>
      <Stack align="center" gap={8} maw={380}>
        <ThemeIcon size={52} radius="xl" variant="light" color="indigo">
          <Icon size={26} stroke={1.7} />
        </ThemeIcon>
        <Text fw={700} size="md" c="dark.4">
          {title}
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          {description}
        </Text>
        {action && <div style={{ marginTop: 8 }}>{action}</div>}
      </Stack>
    </Center>
  );
}
