import React from 'react';
import { Text } from '@mantine/core';
import { IconActivity, IconExternalLink } from '@tabler/icons-react';

export default function AttendanceNote() {
  return (
    <div className="attendance-note">
      <div className="note-icon">
        <IconActivity size={18} />
      </div>
      <div>
        <Text size="sm" fw={650}>
          Attendance is measurable—not guessed.
        </Text>
        <Text size="xs" c="dimmed">
          Import a Google Meet attendance CSV or connect the Meet API to populate join/leave
          intervals. You can still edit every imported record.
        </Text>
      </div>
      <a
        href="https://support.google.com/meet/answer/10090454"
        target="_blank"
        rel="noreferrer"
      >
        Meet reports <IconExternalLink size={13} />
      </a>
    </div>
  );
}
