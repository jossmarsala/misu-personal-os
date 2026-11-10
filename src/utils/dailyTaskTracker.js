/* ═══════════════════════════════════════════════════════════════
   Daily Task Tracker
   Tracks completed tasks per day, resets at midnight.
   Persists daily completed tasks and historical daily counts in localStorage.
   ═══════════════════════════════════════════════════════════════ */

export const STORAGE_KEY = 'misu_daily_completed_tasks';

/**
 * Returns local date in YYYY-MM-DD format
 */
export function getLocalDateString(d = new Date()) {
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date string or Date object is today in local time
 */
export function isDateToday(dateVal) {
  if (!dateVal) return false;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return false;
    return getLocalDateString(d) === getLocalDateString();
  } catch {
    return false;
  }
}

/**
 * Loads daily completed data from localStorage.
 * If the stored date is not today (e.g. midnight has passed),
 * it saves the previous day's count in history and resets today's count to 0.
 */
export function getDailyCompletedData() {
  const today = getLocalDateString();
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        const history = (data.history && typeof data.history === 'object') ? { ...data.history } : {};

        // If data matches today, return sanitized data
        if (data.date === today) {
          const ids = Array.isArray(data.completedTaskIds) ? data.completedTaskIds : [];
          return {
            date: today,
            count: typeof data.count === 'number' ? data.count : ids.length,
            completedTaskIds: ids,
            history
          };
        }

        // If date is different, midnight has passed!
        // Record previous day's count into history
        if (data.date && data.date !== today) {
          const prevCount = typeof data.count === 'number' ? data.count : (data.completedTaskIds?.length || 0);
          history[data.date] = prevCount;
        }

        // Reset for today
        const freshData = {
          date: today,
          count: 0,
          completedTaskIds: [],
          history
        };
        saveDailyCompletedData(freshData);
        return freshData;
      }
    }
  } catch (err) {
    console.error('Failed to load daily completed tasks data:', err);
  }

  // Default initial data for today
  const initial = {
    date: today,
    count: 0,
    completedTaskIds: [],
    history: {}
  };
  saveDailyCompletedData(initial);
  return initial;
}

/**
 * Saves daily completed data to localStorage and dispatches an event
 */
export function saveDailyCompletedData(data) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('misu:daily-completed-updated', { detail: data }));
    }
  } catch (err) {
    console.error('Failed to save daily completed tasks data:', err);
  }
}

/**
 * Returns current count of completed tasks today
 */
export function getDailyCompletedCount() {
  const data = getDailyCompletedData();
  return data.count;
}

/**
 * Records a task completion or uncompletion for today.
 * Returns the updated count.
 */
export function recordTaskCompletion(taskId, isCompleted) {
  if (!taskId) return getDailyCompletedCount();
  const data = getDailyCompletedData();
  const idStr = String(taskId);
  const currentIds = new Set(data.completedTaskIds);

  if (isCompleted) {
    currentIds.add(idStr);
  } else {
    currentIds.delete(idStr);
  }

  const updatedData = {
    ...data,
    completedTaskIds: Array.from(currentIds),
    count: currentIds.size
  };

  saveDailyCompletedData(updatedData);
  return updatedData.count;
}

/**
 * Syncs tasks list with the daily tracker.
 * Only tasks with `completed: true` AND a valid `completedAt` matching today
 * are incorporated into today's completed tasks.
 */
export function syncTasksWithDailyTracker(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) return getDailyCompletedData();
  const data = getDailyCompletedData();
  const currentIds = new Set(data.completedTaskIds);
  let changed = false;

  for (const task of tasks) {
    if (task && task.completed && task.completedAt && isDateToday(task.completedAt)) {
      const idStr = String(task.id);
      if (!currentIds.has(idStr)) {
        currentIds.add(idStr);
        changed = true;
      }
    }
  }

  if (changed) {
    const updatedData = {
      ...data,
      completedTaskIds: Array.from(currentIds),
      count: currentIds.size
    };
    saveDailyCompletedData(updatedData);
    return updatedData;
  }

  return data;
}

/**
 * Manually reset count for today (resets count to 0 while keeping history)
 */
export function resetDailyCompletedCount() {
  const today = getLocalDateString();
  const current = getDailyCompletedData();
  const resetData = {
    date: today,
    count: 0,
    completedTaskIds: [],
    history: { ...current.history }
  };
  saveDailyCompletedData(resetData);
  return resetData;
}

/**
 * Sets up a midnight timer and visibility/focus listener to automatically reset the count at midnight.
 * Returns a cleanup function.
 */
export function setupMidnightReset(onReset) {
  if (typeof window === 'undefined') return () => {};

  let timerId = null;

  function scheduleNextMidnight() {
    const now = new Date();
    // Midnight: next day 00:00:00.050
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 50);
    const msUntilMidnight = Math.max(1000, midnight.getTime() - now.getTime());

    timerId = setTimeout(() => {
      const freshData = getDailyCompletedData();
      if (typeof onReset === 'function') {
        onReset(freshData);
      }
      scheduleNextMidnight();
    }, msUntilMidnight);
  }

  scheduleNextMidnight();

  function handleVisibilityOrFocus() {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      const freshData = getDailyCompletedData();
      if (typeof onReset === 'function') {
        onReset(freshData);
      }
    }
  }

  window.addEventListener('focus', handleVisibilityOrFocus);
  document.addEventListener('visibilitychange', handleVisibilityOrFocus);

  return () => {
    if (timerId) clearTimeout(timerId);
    window.removeEventListener('focus', handleVisibilityOrFocus);
    document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
  };
}

