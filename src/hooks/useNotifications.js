/* ═══════════════════════════════════════════════════════════════
   useNotifications.js — Misu OS Notification Hook
   ─────────────────────────────────────────────────────────────
   Provides:
   - Permission request UI state
   - Scheduled deadline watchers (24h before, day-of, grouped overdue)
   - Weekly Monday morning reminder
   - Morning task-due-today summary
   - Afternoon energy check-in
   - Inactivity desktop nudge & mindfulness break reminder
   - Streak & all-tasks-complete celebration
   - Evening daily wrap-up
   - Focus shield activation notification
   - Pomodoro event integration via custom events
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { useEnergy } from '../context/EnergyContext';
import { getDailyCompletedCount } from '../utils/dailyTaskTracker';
import {
  loadNotifPrefs,
  saveNotifPrefs,
  requestPermission,
  getPermissionStatus,
  sendNotification,
  scheduleNotification,
  cancelScheduled,
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
  const { dndActive } = useEnergy();
  const lang = language || 'en';

  const [permission, setPermission] = useState(getPermissionStatus);
  const [prefs, setPrefsState] = useState(loadNotifPrefs);

  const lastActivityRef = useRef(0);
  const lastInactivityNotifRef = useRef(0);
  const prevDndActiveRef = useRef(dndActive);
  const prevCompletedCountRef = useRef(tasks.filter(t => t.completed).length);

  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, []);

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

  // ── Track page visibility & activity ──────────────────────
  useEffect(() => {
    const onActivity = () => { lastActivityRef.current = Date.now(); };

    document.addEventListener('visibilitychange', onActivity);
    document.addEventListener('mousemove', onActivity);
    document.addEventListener('keydown', onActivity);
    document.addEventListener('touchstart', onActivity, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', onActivity);
      document.removeEventListener('mousemove', onActivity);
      document.removeEventListener('keydown', onActivity);
      document.removeEventListener('touchstart', onActivity);
    };
  }, []);

  // ── Focus Shield activation notification ──────────────────
  useEffect(() => {
    if (dndActive && !prevDndActiveRef.current) {
      if (prefs.enabled && prefs.focusShield && getPermissionStatus() === 'granted') {
        sendNotification({
          ...NotifTemplates.focusShieldActive(lang),
          tag: 'misu-focus-shield',
          silent: true,
        });
      }
    }
    prevDndActiveRef.current = dndActive;
  }, [dndActive, prefs.enabled, prefs.focusShield, lang]);

  // ── Inactivity nudge & mindfulness breathing reminder ─────
  useEffect(() => {
    if (!prefs.enabled || (!prefs.inactivity && !prefs.mindfulness)) return;

    const interval = setInterval(() => {
      const idleMs = Date.now() - (lastActivityRef.current || Date.now());
      const idleMin = idleMs / 60000;
      const cooldownMs = 2.5 * 60 * 60 * 1000; // 2.5h cooldown between nudges
      const canNudge = Date.now() - lastInactivityNotifRef.current > cooldownMs;

      // Only fire if tab is hidden and user has been away 15+ min
      if (document.visibilityState === 'hidden' && idleMin >= 15 && canNudge) {
        lastInactivityNotifRef.current = Date.now();
        markSeenToday('inactivity');

        // Alternate or prioritize mindfulness break if enabled
        if (prefs.mindfulness) {
          sendNotification({
            ...NotifTemplates.mindfulnessBreak(lang),
            tag: 'misu-mindfulness-break',
            dedupKey: `mindfulness-${new Date().toDateString()}-${Math.floor(Date.now() / cooldownMs)}`,
          });
        } else {
          sendNotification({
            ...NotifTemplates.inactivityNudge(lang),
            tag: 'misu-inactivity',
            dedupKey: `inactivity-${new Date().toDateString()}-${Math.floor(Date.now() / cooldownMs)}`,
          });
        }
      }
    }, 5 * 60 * 1000); // check every 5 min

    return () => clearInterval(interval);
  }, [prefs.enabled, prefs.inactivity, prefs.mindfulness, lang]);

  // ── Deadline & Overdue notifications ──────────────────────
  useEffect(() => {
    if (!prefs.enabled || !prefs.deadlines) return;
    if (getPermissionStatus() !== 'granted') return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueList = [];

    tasks.forEach(task => {
      if (task.completed || !task.deadline) return;

      const deadline = new Date(task.deadline);
      deadline.setHours(0, 0, 0, 0);

      const msUntilDeadline = deadline.getTime() - today.getTime();
      const daysUntil = Math.round(msUntilDeadline / (24 * 60 * 60 * 1000));

      // 24h warning — fire once per day per task
      if (daysUntil === 1 && !wasSeenToday(`deadline-tomorrow-${task.id}`)) {
        markSeenToday(`deadline-tomorrow-${task.id}`);
        sendNotification({
          ...NotifTemplates.deadlineTomorrow(task.title, lang),
          tag: `deadline-tomorrow-${task.id}`,
          dedupKey: `deadline-tomorrow-${task.id}-${new Date().toDateString()}`,
        });
      }

      // Day-of warning — fire once per day per task
      if (daysUntil === 0 && !wasSeenToday(`deadline-today-${task.id}`)) {
        markSeenToday(`deadline-today-${task.id}`);
        sendNotification({
          ...NotifTemplates.deadlineToday(task.title, lang),
          tag: `deadline-today-${task.id}`,
          dedupKey: `deadline-today-${task.id}-${new Date().toDateString()}`,
        });
      }

      // Collect overdue tasks
      if (daysUntil < 0) {
        overdueList.push(task);
      }
    });

    // Grouped overdue notifications: prevent multi-notification alert spam
    if (overdueList.length === 1 && !wasSeenToday(`overdue-${overdueList[0].id}`)) {
      markSeenToday(`overdue-${overdueList[0].id}`);
      sendNotification({
        ...NotifTemplates.overdue(overdueList[0].title, lang),
        tag: `overdue-${overdueList[0].id}`,
        dedupKey: `overdue-${overdueList[0].id}-${new Date().toDateString()}`,
      });
    } else if (overdueList.length > 1 && !wasSeenToday('overdue-summary')) {
      markSeenToday('overdue-summary');
      sendNotification({
        ...NotifTemplates.overdueSummary(overdueList.length, lang),
        tag: 'misu-overdue-summary',
        dedupKey: `overdue-summary-${new Date().toDateString()}`,
      });
    }
  }, [tasks, prefs.enabled, prefs.deadlines, lang]);

  // ── Streak / All Tasks Completed Celebration ──────────────
  useEffect(() => {
    if (!prefs.enabled || !prefs.streak) return;
    if (getPermissionStatus() !== 'granted') return;

    const activeCount = tasks.filter(t => !t.completed).length;
    const completedCount = tasks.filter(t => t.completed).length;

    if (activeCount === 0 && completedCount > 0 && prevCompletedCountRef.current < completedCount) {
      if (!wasSeenToday('all-tasks-completed')) {
        markSeenToday('all-tasks-completed');
        sendNotification({
          ...NotifTemplates.allTasksCompleted(lang),
          tag: 'misu-all-completed',
          dedupKey: `all-completed-${new Date().toDateString()}`,
        });
      }
    }

    prevCompletedCountRef.current = completedCount;
  }, [tasks, prefs.enabled, prefs.streak, lang]);

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

    // Schedule if before 3 PM today and not seen
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
    } else if (hour >= 15 && hour < 18 && !wasSeenToday('energy-checkin')) {
      markSeenToday('energy-checkin');
      sendNotification({
        ...NotifTemplates.energyCheckIn(lang),
        tag: 'misu-energy-checkin',
        dedupKey: `energy-checkin-${new Date().toDateString()}`,
      });
    }

    return () => cancelScheduled('misu-energy-checkin');
  }, [prefs.enabled, prefs.energyCheck, lang]);

  // ── Evening Daily Wrap-up (6 PM – 9 PM) ───────────────────
  useEffect(() => {
    if (!prefs.enabled || !prefs.dailyWrapup) return;

    const hour = new Date().getHours();
    const isEvening = hour >= 18 && hour < 22;

    if (!isEvening || wasSeenToday('daily-wrapup')) return;
    if (getPermissionStatus() !== 'granted') return;

    const completedToday = getDailyCompletedCount();
    const activeRemaining = tasks.filter(t => !t.completed).length;

    if (completedToday > 0 || activeRemaining > 0) {
      markSeenToday('daily-wrapup');
      setTimeout(() => {
        sendNotification({
          ...NotifTemplates.dailyWrapup(completedToday, activeRemaining, lang),
          tag: 'misu-daily-wrapup',
          dedupKey: `daily-wrapup-${new Date().toDateString()}`,
        });
      }, 10000);
    }
  }, [tasks, prefs.enabled, prefs.dailyWrapup, lang]);

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
