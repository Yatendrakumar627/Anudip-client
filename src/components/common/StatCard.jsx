import React from 'react';
import { Paper } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';

export default function StatCard({ icon: Icon, label, value, detail, trend, tone = 'indigo' }) {
  const isNegative = trend && trend.startsWith('-');

  return (
    <Paper className="stat-card" radius="lg" p="lg" withBorder>
      <div className="stat-top">
        <div className={`stat-icon ${tone}`}>
          <Icon size={20} stroke={1.8} />
        </div>
        {trend && (
          <div className={`stat-trend ${isNegative ? 'negative' : ''}`}>
            {isNegative ? <IconArrowDownRight size={14} /> : <IconArrowUpRight size={14} />}
            {trend}
          </div>
        )}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {detail && <div className="stat-detail">{detail}</div>}
    </Paper>
  );
}
