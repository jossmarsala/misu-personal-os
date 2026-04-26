/* ═══════════════════════════════════════════════════════════════
   useNotifications.js — Misu OS Notification Hook
   ─────────────────────────────────────────────────────────────
   Provides:
   - Permission request UI state
   - Scheduled deadline watchers (24h before, day-of)
   - Weekly Monday morning reminder
   - Morning task-due-today summary
   - Afternoon energy check-in
   - Inactivity desktop nudge (15+ min away with open tab)
   - Overdue task notification (once/day)
   - Pomodoro event integration via custom events
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import {
  loadNotifPrefs,
  saveNotifPrefs,
  requestPermission,
  getPermissionStatus,
  sendNotification,
  scheduleNotification,
  cancelScheduled,
  cancelAllScheduled,
  NotifTemplates,
} from '../services/NotificationService';

// ── Flag helpers (localStorage) ───────────────────────────────
function flagKey(k) { return `misu_notif_flag_${k}`; }

function wasSeenToday(key) {
  const v = localStorage.getItem(flagKey(key));
  if (!v) return false;
  return v === new Date().toDateString();
}

function markSeenToday(key) {
  localStorage.setItem(flagKey(key), new Date().toDateString());
}

function getWeek(d = new Date()) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() - dt.getDay() + 1); // Monday
  return dt.toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────────
export function useNotifications() {
  const { tasks } = useTasks();
  const { language } = useLanguage();
  const lang = language || 'en';

  const [permission, setPermission] = useState(getPermissionStatus);
  const [prefs, setPrefsState] = useState(loadNotifPrefs);

  const lastActivityRef = useRef(Date.now());
  const scheduledDeadlinesRef = useRef(new Set()); // track which task IDs have scheduled notifs

  // ── Persist prefs ──────────────────────────────────────────
  const updatePrefs = useCallback((patch) => {
    setPrefsState(prev => {
      const next = { ...prev, ...patch };
      saveNotifPrefs(next);
      return next;
    });
  }, []);

  // ── Permission request ─────────────────────────────────────
  const askPermission = useCallback(async () => {
    const result = await requestPermission();
    setPermission(result);
    return result;
  }, []);

  // ── Track page visibility for inactivity ──────────────────
  useEffect(() => {
    const onVisible = () => { lastActivityRef.current = Date.now(); };
    const onMove = () => { lastActivityRef.current = Date.now(); };

    document.addEventListener('visibilitychange', onVisible);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('keydown', onMove);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('keydown', onMove);
    };
  }, []);

  // ── Inactivity nudge — fires when tab is unfocused 15+ min ─
  useEffect(() => {
    if (!prefs.enabled || !prefs.inactivity) return;

    const interval = setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      const idleMin = idleMs / 60000;

      // Only fire if tab is hidden and user has been away 15+ min
      if (
        document.visibilityState === 'hidden' &&
        idleMin >= 15 &&
        !wasSeenToday('inactivity')
      ) {
        markSeenToday('inactivity');
        sendNotification({
          ...NotifTemplates.inactivityNudge(lang),
          tag: 'misu-inactivity',
          dedupKey: `inactivity-${new Date().toDateString()}`,
        });
      }
    }, 5 * 60 * 1000); // check every 5 min

    return () => clearInterval(interval);
  }, [prefs.enabled, prefs.inactivity, lang]);

  // ── Deadline notifications ─────────────────────────────────
  useEffect(() => {
    if (!prefs.enabled || !prefs.deadlines) return;
    if (getPermissionStatus() !== 'granted') return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    tasks.forEach(task => {
      if (task.completed || !task.deadline) return;

      const deadline = new Date(task.deadline);
      deadline.setHours(0, 0, 0, 0);

      const msUntilDeadline = deadline.getTime() - today.getTime();
      const daysUntil = Math.round(msUntilDeadline / (24 * 60 * 60 * 1000));

      const alreadyScheduledTomorrow = scheduledDeadlinesRef.current.has(`${task.id}-tomorrow`);
      const alreadyScheduledToday = scheduledDeadlinesRef.current.has(`${task.id}-today`);

      // 24h warning — fire at 9:00 AM the day before the deadline
      if (daysUntil === 1 && !alreadyScheduledTomorrow && !wasSeenToday(`deadline-tomorrow-${task.id}`)) {
        markSeenToday(`deadline-tomorrow-${task.id}`);
        scheduledDeadlinesRef.current.add(`${task.id}-tomorrow`);
        sendNotification({
          ...NotifTemplates.deadlineTomorrow(task.title, lang),
          tag: `deadline-tomorrow-${task.id}`,
          dedupKey: `deadline-tomorrow-${task.id}-${new Date().toDateString()}`,
        });
      }

      // Day-of warning — fire at 9:00 AM on the deadline day
      if (daysUntil === 0 && !alreadyScheduledToday && !wasSeenToday(`deadline-today-${task.id}`)) {
        markSeenToday(`deadline-today-${task.id}`);
        scheduledDeadlinesRef.current.add(`${task.id}-today`);
        sendNotification({
          ...NotifTemplates.deadlineToday(task.title, lang),
          tag: `deadline-today-${task.id}`,
          dedupKey: `deadline-today-${task.id}-${new Date().toDateString()}`,
        });
      }

      // Overdue — once per day per task
      if (daysUntil < 0 && !wasSeenToday(`overdue-${task.id}`)) {
        markSeenToday(`overdue-${task.id}`);
        sendNotification({
          ...NotifTemplates.overdue(task.title, lang),
          tag: `overdue-${task.id}`,
          dedupKey: `overdue-${task.id}-${new Date().toDateString()}`,
        });
      }
    });

    // Cleanup removed tasks from scheduled set
    const activeIds = new Set(tasks.filter(t => !t.completed && t.deadline).map(t => t.id));
    for (const key of scheduledDeadlinesRef.current) {
      const taskId = key.split('-')[0];
      if (!activeIds.has(taskId)) {
        cancelScheduled(`deadline-${key}`);
        scheduledDeadlinesRef.current.delete(key);
      }
    }
  }, [tasks, prefs.enabled, prefs.deadlines, lang]);

  // ── Morning summary (tasks due today) ─────────────────────
  useEffect(() => {
    if (!prefs.enabled || !prefs.taskUpcoming) return;

    const hour = new Date().getHours();
    const isEarlyMorning = hour >= 7 && hour < 11;

    if (!isEarlyMorning || wasSeenToday('morning-summary')) return;
    if (getPermissionStatus() !== 'granted') return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dueToday = tasks.filter(t => {
      if (t.completed || !t.deadline) return false;
      const dl = new Date(t.deadline);
      dl.setHours(0, 0, 0, 0);
      return dl >= today && dl < tomorrow;
    });

    if (dueToday.length > 0) {
      markSeenToday('morning-summary');
      // Small delay so it doesn't fire immediately on app open
      setTimeout(() => {
        sendNotification({
          ...NotifTemplates.tasksDueToday(dueToday.length, lang),
          tag: 'misu-morning-summary',
          dedupKey: `morning-summary-${new Date().toDateString()}`,
        });
      }, 8000);
    }
  }, [tasks, prefs.enabled, prefs.taskUpcoming, lang]);

  // ── Afternoon energy check-in (3 PM) ─────────────────────
  useEffect(() => {
    if (!prefs.enabled || !prefs.energyCheck) return;

    const now = new Date();
    const hour = now.getHours();

    // Only schedule if it's before 3PM today and we haven't sent yet
    if (hour < 15 && !wasSeenToday('energy-checkin')) {
      const fireAt = new Date();
      fireAt.setHours(15, 0, 0, 0);
      const delay = fireAt.getTime() - Date.now();

      if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
        scheduleNotification('misu-energy-checkin', {
          ...NotifTemplates.energyCheckIn(lang),
          tag: 'misu-energy-checkin',
          dedupKey: `energy-checkin-${new Date().toDateString()}`,
        }, delay);
      }
    } else if (hour === 15 && !wasSeenToday('energy-checkin')) {
      markSeenToday('energy-checkin');
      sendNotification({
        ...NotifTemplates.energyCheckIn(lang),
        tag: 'misu-energy-checkin',
        dedupKey: `energy-checkin-${new Date().toDateString()}`,
      });
    }

    return () => cancelScheduled('misu-energy-checkin');
  }, [prefs.enabled, prefs.energyCheck, lang]);

  // ── Weekly Monday morning reminder ────────────────────────
  useEffect(() => {
    if (!prefs.enabled || !prefs.weeklyReminder) return;

    const now = new Date();
    const isMonday = now.getDay() === 1;
    const hour = now.getHours();
    const weekKey = getWeek();

    if (isMonday && hour >= 8 && hour < 12) {
      const flag = `weekly-reminder-${weekKey}`;
      if (!localStorage.getItem(flagKey(flag))) {
        localStorage.setItem(flagKey(flag), 'true');
        const activeTasks = tasks.filter(t => !t.completed);
        if (activeTasks.length > 0) {
          setTimeout(() => {
            sendNotification({
              ...NotifTemplates.weeklyReminder(activeTasks.length, lang),
              tag: 'misu-weekly-reminder',
              dedupKey: `weekly-reminder-${weekKey}`,
            });
          }, 12000);
        }
      }
    }
  }, [tasks, prefs.enabled, prefs.weeklyReminder, lang]);

  // ── Pomodoro events (listen to custom DOM events) ─────────
  useEffect(() => {
    if (!prefs.enabled || !prefs.pomodoro) return;

    const onPomodoroStart = (e) => {
      const { taskTitle } = e.detail || {};
      if (getPermissionStatus() !== 'granted') return;
      sendNotification({
        ...NotifTemplates.pomodoroStart(taskTitle, lang),
        tag: 'misu-pomodoro-start',
        silent: true,
      });
    };

    const onPomodoroFocusEnd = () => {
      if (getPermissionStatus() !== 'granted') return;
      sendNotification({
        ...NotifTemplates.pomodoroEnd(lang),
        tag: 'misu-pomodoro-end',
      });
    };

    const onPomodoroBreakEnd = () => {
      if (getPermissionStatus() !== 'granted') return;
      sendNotification({
        ...NotifTemplates.breakEnd(lang),
        tag: 'misu-pomodoro-break-end',
      });
    };

    const onPomodoroLongBreakEnd = () => {
      if (getPermissionStatus() !== 'granted') return;
      sendNotification({
        ...NotifTemplates.longBreakEnd(lang),
        tag: 'misu-pomodoro-long-break-end',
      });
    };

    window.addEventListener('misu:pomodoro-start', onPomodoroStart);
    window.addEventListener('misu:pomodoro-focus-end', onPomodoroFocusEnd);
    window.addEventListener('misu:pomodoro-break-end', onPomodoroBreakEnd);
    window.addEventListener('misu:pomodoro-long-break-end', onPomodoroLongBreakEnd);

    return () => {
      window.removeEventListener('misu:pomodoro-start', onPomodoroStart);
      window.removeEventListener('misu:pomodoro-focus-end', onPomodoroFocusEnd);
      window.removeEventListener('misu:pomodoro-break-end', onPomodoroBreakEnd);
      window.removeEventListener('misu:pomodoro-long-break-end', onPomodoroLongBreakEnd);
    };
  }, [prefs.enabled, prefs.pomodoro, lang]);

  return {
    permission,
    prefs,
    updatePrefs,
    askPermission,
  };
}
