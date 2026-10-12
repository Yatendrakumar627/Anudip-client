import React from 'react';
import { Button, Paper, Text } from '@mantine/core';
import { IconArrowRight, IconArrowUpRight } from '@tabler/icons-react';
import { formatDuration, totalSeconds } from '../../../utils/formatters';

export default function AttendanceActivityPanel({
  attendance = [],
  weekDays = [],
  maxCount = 1,
  todayStr,
  onNavigate,
}) {
  return (
    <Paper className="panel-card attendance-chart-panel" withBorder radius="lg" p="lg">
      <div className="panel-heading">
        <div>
          <Text fw={700}>Attendance activity</Text>
          <Text c="dimmed" size="sm">
            Present or late records · last 7 days
          </Text>
        </div>
        <Button
          variant="subtle"
          size="xs"
          rightSection={<IconArrowRight size={15} />}
          onClick={() => onNavigate('attendance')}
        >
          View report
        </Button>
      </div>
      <div className="chart-legend">
        <span className="legend-dot" />
        Attendance records
      </div>
      <div className="bar-chart">
        {weekDays.map((item) => (
          <div className="bar-column" key={item.day}>
            <div className="bar-count">{item.total || ''}</div>
            <div className="bar-track">
              <div
                className={`bar-fill ${item.day === todayStr ? 'today' : ''}`}
                style={{
                  height: `${Math.max(item.total ? 14 : 3, (item.total / maxCount) * 100)}%`,
                }}
              />
            </div>
            <div className={`bar-label ${item.day === todayStr ? 'today-label' : ''}`}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
      <div className="chart-bottom">
        <div>
          <Text size="xs" c="dimmed">
            Recorded sessions
          </Text>
          <Text fw={700} size="xl">
            {attendance.length}
          </Text>
        </div>
        <div>
          <Text size="xs" c="dimmed">
            Total time logged
          </Text>
          <Text fw={700} size="xl">
            {formatDuration(
              attendance.reduce((sum, a) => sum + totalSeconds(a.segments), 0)
            )}
          </Text>
        </div>
        <div className="chart-insight">
          <IconArrowUpRight size={16} />
          <span>Build consistency, one session at a time.</span>
        </div>
      </div>
    </Paper>
  );
}
