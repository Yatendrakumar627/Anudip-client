import React from 'react';
import { SimpleGrid, Text } from '@mantine/core';
import {
  IconBriefcase,
  IconCalendarEvent,
  IconUsers,
  IconVideo,
} from '@tabler/icons-react';
import StatCard from '../../../components/common/StatCard';

export default function ProgrammeSnapshot({
  students = [],
  activeStudents = 0,
  sessions = [],
  upcomingCount = 0,
  attendance = [],
  attendanceRate = 0,
  placed = 0,
  completionRate = 0,
}) {
  return (
    <>
      <div className="section-title-row">
        <div>
          <Text fw={700} size="lg">
            Programme snapshot
          </Text>
          <Text size="sm" c="dimmed">
            The numbers behind your impact.
          </Text>
        </div>
        <Text size="xs" c="dimmed">
          UPDATED JUST NOW
        </Text>
      </div>

      <SimpleGrid cols={{ base: 2, md: 4 }} spacing={{ base: 10, sm: 'md' }} mb={{ base: 'md', sm: 'lg' }}>
        <StatCard
          icon={IconUsers}
          label="Total learners"
          value={students.length}
          detail={`${activeStudents} currently active`}
          trend={students.length ? '+ enrolments' : undefined}
          tone="indigo"
        />
        <StatCard
          icon={IconVideo}
          label="Training sessions"
          value={sessions.length}
          detail={`${upcomingCount} coming up next`}
          tone="cyan"
        />
        <StatCard
          icon={IconCalendarEvent}
          label="Attendance recorded"
          value={`${attendanceRate}%`}
          detail={`${attendance.length} learner-session records`}
          tone="teal"
        />
        <StatCard
          icon={IconBriefcase}
          label="Students placed"
          value={placed}
          detail={`${completionRate}% of all learners`}
          tone="orange"
        />
      </SimpleGrid>
    </>
  );
}
