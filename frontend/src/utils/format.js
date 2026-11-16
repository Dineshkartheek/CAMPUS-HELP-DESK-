export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function titleCase(value) {
  if (!value) return '';
  return value
    .toString()
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function initials(name) {
  if (!name) return 'CC';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function roleLabel(role) {
  if (role === 'MAIN_ADMIN') return 'Main Administrator';
  if (role === 'ADMIN') return 'Administrator';
  if (role === 'STUDENT') return 'Student';
  return role || '';
}

export function homeForRole(role) {
  if (role === 'MAIN_ADMIN') return '/main-admin';
  if (role === 'ADMIN') return '/admin';
  return '/student';
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function applyFieldErrors(error, setErrors) {
  if (error?.fieldErrors) {
    setErrors((previous) => ({ ...previous, ...error.fieldErrors }));
  }
}
