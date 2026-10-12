import React from 'react';
import { Button, Paper, Text, ThemeIcon } from '@mantine/core';
import { IconArrowRight, IconTargetArrow } from '@tabler/icons-react';

export default function PlacementPipelinePanel({
  completionRate = 0,
  placed = 0,
  placements = [],
  activeStudents = 0,
  onNavigate,
}) {
  const interviewingOrShortlisted = placements.filter((p) =>
    ['Interviewing', 'Shortlisted'].includes(p.status)
  ).length;

  return (
    <Paper className="panel-card outcome-panel" withBorder radius="lg" p="lg">
      <div className="panel-heading">
        <div>
          <Text fw={700}>From training to opportunity</Text>
          <Text c="dimmed" size="sm">
            Where your learners are on their journey.
          </Text>
        </div>
        <ThemeIcon variant="light" color="orange" radius="lg" size={38}>
          <IconTargetArrow size={20} />
        </ThemeIcon>
      </div>
      <div className="outcome-progress">
        <div className="progress-ring-wrap">
          <svg viewBox="0 0 120 120" className="progress-ring">
            <circle cx="60" cy="60" r="47" fill="none" stroke="#f0f2f7" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="47"
              fill="none"
              stroke="#16a394"
              strokeLinecap="round"
              strokeWidth="10"
              strokeDasharray={`${(Math.max(0, completionRate) / 100) * 295.3} 295.3`}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="ring-center">
            <strong>{completionRate}%</strong>
            <span>placed</span>
          </div>
        </div>
        <div className="outcome-stats">
          <div>
            <span className="outcome-bullet placed" />
            <div>
              <Text fw={650} size="sm">
                Placed
              </Text>
              <Text c="dimmed" size="xs">
                Confirmed offers
              </Text>
            </div>
            <strong>{placed}</strong>
          </div>
          <div>
            <span className="outcome-bullet pipeline" />
            <div>
              <Text fw={650} size="sm">
                In pipeline
              </Text>
              <Text c="dimmed" size="xs">
                Interview / shortlist
              </Text>
            </div>
            <strong>{interviewingOrShortlisted}</strong>
          </div>
          <div>
            <span className="outcome-bullet learning" />
            <div>
              <Text fw={650} size="sm">
                In training
              </Text>
              <Text c="dimmed" size="xs">
                Active students
              </Text>
            </div>
            <strong>{activeStudents}</strong>
          </div>
        </div>
      </div>
      <Button
        fullWidth
        variant="light"
        color="indigo"
        rightSection={<IconArrowRight size={16} />}
        onClick={() => onNavigate('placements')}
      >
        Manage placement pipeline
      </Button>
    </Paper>
  );
}
