/**
 * Utility functions for date, time, duration, and UI styling
 */

export function localDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function cleanDateForInput(value, type) {
  if (!value) return '';
  if (type === 'datetime-local') return localDateInput(value);
  return String(value).slice(0, 10);
}

export function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', options);
}

export function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function totalSeconds(segments = []) {
  if (!Array.isArray(segments)) return 0;
  return segments.reduce((total, segment) => {
    if (!segment || !segment.joinedAt) return total;
    const start = new Date(segment.joinedAt).getTime();
    const end = segment.leftAt ? new Date(segment.leftAt).getTime() : Date.now();
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return total;
    return total + Math.floor((end - start) / 1000);
  }, 0);
}

export function formatDuration(seconds = 0) {
  const mins = Math.max(0, Math.floor(seconds / 60));
  const hrs = Math.floor(mins / 60);
  const remaining = mins % 60;
  if (hrs && remaining) return `${hrs}h ${remaining}m`;
  if (hrs) return `${hrs}h`;
  return `${remaining}m`;
}

export function initials(name = '') {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'ST'
  );
}

export function statusColor(status) {
  const map = {
    Active: 'teal',
    Completed: 'blue',
    'On hold': 'orange',
    Upcoming: 'indigo',
    Live: 'red',
    Cancelled: 'gray',
    Present: 'teal',
    Late: 'orange',
    Absent: 'red',
    Excused: 'gray',
    Placed: 'teal',
    Interviewing: 'indigo',
    Shortlisted: 'cyan',
    'Not started': 'gray',
    'Not looking': 'gray',
  };
  return map[status] || 'gray';
}

export function initialsColor(value = '') {
  const colors = ['indigo', 'cyan', 'teal', 'grape', 'orange', 'blue'];
  return colors[(value.charCodeAt(0) || 0) % colors.length];
}
