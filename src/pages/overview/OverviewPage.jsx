import React from 'react';
import WelcomeBanner from './components/WelcomeBanner';
import ProgrammeSnapshot from './components/ProgrammeSnapshot';
import AttendanceActivityPanel from './components/AttendanceActivityPanel';
import UpcomingSessionsPanel from './components/UpcomingSessionsPanel';
import RecentAttendancePanel from './components/RecentAttendancePanel';
import PlacementPipelinePanel from './components/PlacementPipelinePanel';

export default function OverviewPage({
  students = [],
  sessions = [],
  attendance = [],
  placements = [],
  onAddStudent,
  onAddSession,
  onNavigate,
  orgName = 'Anudip Foundation',
}) {
  const activeStudents = students.filter((s) => s.status === 'Active').length;
  const todayStr = new Date().toISOString().slice(0, 10);

  const upcoming = [...sessions]
    .filter((s) => s.status === 'Upcoming' || (s.date >= todayStr && s.status !== 'Cancelled'))
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
    .slice(0, 3);

  const presentRecords = attendance.filter((a) => ['Present', 'Late'].includes(a.status)).length;
  const attendanceRate = attendance.length ? Math.round((presentRecords / attendance.length) * 100) : 0;
  const placed = placements.filter((p) => p.status === 'Placed').length;
  const completionRate = students.length ? Math.round((placed / students.length) * 100) : 0;

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - index));
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    const total = attendance.filter(
      (a) => a.date === dateKey && ['Present', 'Late'].includes(a.status)
    ).length;
    return {
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      total,
      day: dateKey,
    };
  });

  const maxCount = Math.max(1, ...weekDays.map((d) => d.total));
  const recent = [...attendance]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 5);

  const hours = new Date().getHours();
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      {/* 1. Welcome Header Banner with Action Buttons */}
      <WelcomeBanner
        greeting={greeting}
        orgName={orgName}
      />

      {/* 2. Key Metrics Snapshot Cards */}
      <ProgrammeSnapshot
        students={students}
        activeStudents={activeStudents}
        sessions={sessions}
        upcomingCount={upcoming.length}
        attendance={attendance}
        attendanceRate={attendanceRate}
        placed={placed}
        completionRate={completionRate}
      />

      {/* 3. Grid Panels for Charts, Schedule, Recent Logs & Pipeline */}
      <div className="overview-grid">
        <AttendanceActivityPanel
          attendance={attendance}
          weekDays={weekDays}
          maxCount={maxCount}
          todayStr={todayStr}
          onNavigate={onNavigate}
        />

        <UpcomingSessionsPanel
          upcoming={upcoming}
          onNavigate={onNavigate}
          onAddSession={onAddSession}
        />

        <RecentAttendancePanel
          recent={recent}
          students={students}
          sessions={sessions}
          onNavigate={onNavigate}
        />

        <PlacementPipelinePanel
          completionRate={completionRate}
          placed={placed}
          placements={placements}
          activeStudents={activeStudents}
          onNavigate={onNavigate}
        />
      </div>
    </>
  );
}
