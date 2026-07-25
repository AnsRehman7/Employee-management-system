export const formatDate = value => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return 'No date';
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(date);
};

export const formatDateLong = value => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return 'No date';
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = value => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(date);
};

export const formatTime = value => {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatHours = value => {
  const hours = Number(value || 0);
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
};

export const initialsFor = value =>
  String(value || 'StaffFlow')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');

export const labelForValue = value =>
  String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());

export const todayKey = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

export const dueLabel = value => {
  if (!value) return 'No due date';
  const due = new Date(`${String(value).slice(0, 10)}T23:59:59`);
  if (Number.isNaN(due.getTime())) return 'No due date';
  const days = Math.ceil((due.getTime() - Date.now()) / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days}d`;
};
