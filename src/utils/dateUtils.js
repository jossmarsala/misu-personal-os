/* ═══════════════════════════════════════
   Date utility functions
   ═══════════════════════════════════════ */

/**
 * Get Monday of the current week
 */
export function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get array of 7 rolling days starting from today
 */
export function getWeekDays(date = new Date()) {
  const startDay = new Date(date);
  startDay.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDay);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/**
 * Format date as human-friendly string
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const locale = document.documentElement.lang || 'en-US';
  return d.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date as short day name
 */
export function formatDayShort(date) {
  const d = new Date(date);
  const locale = document.documentElement.lang || 'en-US';
  return d.toLocaleDateString(locale, { weekday: 'short' });
}

/**
 * Format date as full day name
 */
export function formatDayLong(date) {
  const d = new Date(date);
  const locale = document.documentElement.lang || 'en-US';
  return d.toLocaleDateString(locale, { weekday: 'long' });
}

/**
 * Format as YYYY-MM-DD for input[type=date]
 */
export function toInputDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Get deadline status
 */
export function getDeadlineStatus(deadline) {
  if (!deadline) return 'none';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dl = new Date(deadline);
  dl.setHours(0, 0, 0, 0);
  const diff = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));

  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff <= 3) return 'soon';
  return 'normal';
}

/**
 * Get days until deadline
 */
export function getDaysUntil(deadline) {
  if (!deadline) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dl = new Date(deadline);
  dl.setHours(0, 0, 0, 0);
  return Math.ceil((dl - now) / (1000 * 60 * 60 * 24));
}

/**
 * Format relative deadline text
 */
export function formatDeadline(deadline) {
  const days = getDaysUntil(deadline);
  if (days === null) return '';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `${days}d left`;
  return formatDate(deadline);
}
