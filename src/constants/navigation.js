import {
  IconBriefcase,
  IconCalendarEvent,
  IconLayoutDashboard,
  IconSchool,
  IconSettings,
  IconUsers,
  IconUsersGroup,
  IconVideo,
} from '@tabler/icons-react';

export const navItems = [
  { id: 'overview', path: '/dashboard', label: 'Overview', icon: IconLayoutDashboard, group: 'WORKSPACE' },
  { id: 'credentials', path: '/lms-credential', label: 'LMS Portal', icon: IconSchool, group: 'WORKSPACE' },
  { id: 'batches', path: '/batches', label: 'Batches', icon: IconUsersGroup, group: 'WORKSPACE', requiresAdmin: true },
  { id: 'students', path: '/students', label: 'Students', icon: IconUsers, group: 'WORKSPACE', requiresAdmin: true },
  { id: 'sessions', path: '/sessions', label: 'Training sessions', icon: IconVideo, group: 'WORKSPACE', isBeta: true },
  { id: 'attendance', path: '/attendance', label: 'Attendance', icon: IconCalendarEvent, group: 'WORKSPACE', isBeta: true },
  { id: 'placements', path: '/placements', label: 'Placements', icon: IconBriefcase, group: 'OUTCOMES', isBeta: true },
  { id: 'settings', path: '/settings', label: 'Settings', icon: IconSettings, group: 'MANAGE', isBeta: true },
];

export const pageMeta = {
  '/dashboard': {
    id: 'overview',
    title: 'Overview',
    subtitle: 'A clear picture of your learners, sessions and outcomes.',
    eyebrow: 'ANUDIP FOUNDATION',
  },
  '/lms-credential': {
    id: 'credentials',
    title: 'LMS Student Portal',
    subtitle: 'Access official Anudip LMS credentials, copy login details, and launch learning courses.',
    eyebrow: 'ANUDIP LMS & CREDENTIALS',
  },
  '/batches': {
    id: 'batches',
    title: 'Student Batches',
    subtitle: 'Manage training cohorts, facilitators, schedules, and view enrolled learner details.',
    eyebrow: 'COHORT MANAGEMENT',
  },
  '/students': {
    id: 'students',
    title: 'Students',
    subtitle: 'Manage learners, their training fields, LMS credentials and enrollment details.',
    eyebrow: 'LEARNER DIRECTORY',
  },
  '/sessions': {
    id: 'sessions',
    title: 'Training sessions',
    subtitle: 'Organise daily classes and keep every Google Meet link in one place.',
    eyebrow: 'LEARNING PROGRAMME',
  },
  '/attendance': {
    id: 'attendance',
    title: 'Attendance',
    subtitle: 'Review join and leave times, session attendance and total learning time.',
    eyebrow: 'STUDENT ENGAGEMENT',
  },
  '/placements': {
    id: 'placements',
    title: 'Placements',
    subtitle: 'Follow each learner from interview pipeline to successful placement.',
    eyebrow: 'CAREER OUTCOMES',
  },
  '/settings': {
    id: 'settings',
    title: 'Settings',
    subtitle: 'Workspace preferences, trainer details and integration readiness.',
    eyebrow: 'WORKSPACE SETTINGS',
  },
};

// Helper to resolve metadata from any path (supporting trailing slashes & aliases)
export function getPageMeta(pathname = '/dashboard') {
  const cleanPath = pathname.replace(/\/$/, '') || '/dashboard';
  if (pageMeta[cleanPath]) return pageMeta[cleanPath];
  if (cleanPath === '/lms-credentials' || cleanPath === '/lms-portal') return pageMeta['/lms-credential'];
  if (cleanPath === '/cohorts' || cleanPath === '/student-batches') return pageMeta['/batches'];
  if (cleanPath === '/training-sessions') return pageMeta['/sessions'];
  if (cleanPath === '/' || cleanPath === '') return pageMeta['/dashboard'];
  return pageMeta['/dashboard'];
}
