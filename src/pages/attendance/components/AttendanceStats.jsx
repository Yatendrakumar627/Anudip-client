import React from 'react';
import { SimpleGrid } from '@mantine/core';
import { IconCheck, IconClock, IconUsers } from '@tabler/icons-react';
import StatCard from '../../../components/common/StatCard';
import { formatDuration } from '../../../utils/formatters';

export default function AttendanceStats({
  visibleCount = 0,
  presentCount = 0,
  attendanceRate = 0,
  currentTotal = 0,
  activeSessionTitle = 'Across all sessions',
}) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="lg">
      <StatCard
        icon={IconUsers}
        label="Records in view"
        value={visibleCount}
        detail={activeSessionTitle}
        tone="indigo"
      />
      <StatCard
        icon={IconCheck}
        label="Present / late"
        value={presentCount}
        detail={
          visibleCount
            ? `${attendanceRate}% of recorded entries`
            : 'No records to calculate'
        }
        tone="teal"
      />
      <StatCard
        icon={IconClock}
        label="Combined learning time"
        value={formatDuration(currentTotal)}
        detail="Sum of all visible join intervals"
        tone="cyan"
      />
    </SimpleGrid>
  );
}
