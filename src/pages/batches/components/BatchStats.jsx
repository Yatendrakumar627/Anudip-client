import React from 'react';
import { SimpleGrid } from '@mantine/core';
import {
  IconBriefcase,
  IconCalendarEvent,
  IconUsers,
  IconUsersGroup,
} from '@tabler/icons-react';
import StatCard from '../../../components/common/StatCard';

export default function BatchStats({
  totalCohorts = 0,
  activeBatchesCount = 0,
  totalEnrolled = 0,
  totalSessions = 0,
  placedCount = 0,
}) {
  return (
    <SimpleGrid cols={{ base: 2, md: 4 }} spacing={{ base: 8, sm: 'md' }} mb="lg">
      <StatCard
        icon={IconUsersGroup}
        label="Total Cohorts"
        value={totalCohorts}
        detail={`${activeBatchesCount} currently in training`}
        tone="indigo"
      />
      <StatCard
        icon={IconUsers}
        label="Learners Enrolled"
        value={totalEnrolled}
        detail={`Distributed across ${totalCohorts} batches`}
        tone="cyan"
      />
      <StatCard
        icon={IconCalendarEvent}
        label="Classroom Sessions"
        value={totalSessions}
        detail="Scheduled live Google Meet classes"
        tone="teal"
      />
      <StatCard
        icon={IconBriefcase}
        label="Placed Graduates"
        value={placedCount}
        detail="Hired by corporate employers"
        tone="orange"
      />
    </SimpleGrid>
  );
}
