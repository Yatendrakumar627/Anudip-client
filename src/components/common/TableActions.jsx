import React from 'react';
import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';

export default function TableActions({ onEdit, onDelete, extra }) {
  return (
    <Group gap={6} justify="flex-end" wrap="nowrap">
      {extra}
      {onEdit && (
        <Tooltip label="Edit record" withArrow>
          <ActionIcon variant="subtle" color="gray" onClick={onEdit} aria-label="Edit record">
            <IconEdit size={17} />
          </ActionIcon>
        </Tooltip>
      )}
      {onDelete && (
        <Tooltip label="Delete record" withArrow>
          <ActionIcon variant="subtle" color="red" onClick={onDelete} aria-label="Delete record">
            <IconTrash size={17} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}
