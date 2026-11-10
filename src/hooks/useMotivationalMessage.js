import { useState, useEffect, useRef, useCallback } from 'react';
import { getDeadlineStatus, getDaysUntil } from '../utils/dateUtils';
import {
  getDailyCompletedCount,
  recordTaskCompletion,
  syncTasksWithDailyTracker,
  setupMidnightReset,
  getDailyCompletedData,
  resetDailyCompletedCount,
} from '../utils/dailyTaskTracker';

const COOLDOWNS = {
  tasksCompleted: 4 * 1000,         // 4s debounce between rapid task completions
  lateNight: 60 * 60 * 1000,        // 1 hour cooldown
  earlyMorning: 3 * 60 * 60 * 1000, // 3 hours cooldown
  multipleOverdue: 2 * 60 * 60 * 1000, // 2 hours cooldown
  planTomorrow: 2 * 60 * 60 * 1000, // 2 hours cooldown
};

function getStoredTime(key) {
  try {
    const val = sessionStorage.getItem(`misu_motivational_${key}`);
    return val ? parseInt(val, 10) : 0;
  } catch (err) {
    void err;
    return 0;
  }
}

function setStoredTime(key, val = Date.now()) {
  try {
    sessionStorage.setItem(`misu_motivational_${key}`, String(val));
  } catch (err) {
    void err;
  }
}

/**
 * Custom hook to generate and manage contextual motivational messages inside the energy bar.
 * Replaces energy label and description at key moments, with auto-revert, cooldowns, and manual dismissal.
 */
export function useMotivationalMessage({ tasks = [], currentEnergy, t }) {
  const [activeMessage, setActiveMessage] = useState(null);
  const timerRef = useRef(null);
  const prevEnergyRef = useRef(currentEnergy);
  const prevCompletedSetRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismissMessage = useCallback(() => {
    clearTimer();
    setActiveMessage(null);
  }, [clearTimer]);

  const showMessage = useCallback((messageConfig, duration = 14000) => {
    clearTimer();
    setActiveMessage(messageConfig);

    timerRef.current = setTimeout(() => {
      setActiveMessage(null);
      timerRef.current = null;
    }, duration);
  }, [clearTimer]);

  // Dismiss motivational message immediately if user interacts with energy selector
  useEffect(() => {
    if (prevEnergyRef.current !== currentEnergy) {
      prevEnergyRef.current = currentEnergy;
      if (activeMessage) {
        const timer = setTimeout(() => {
          dismissMessage();
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [currentEnergy, activeMessage, dismissMessage]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Handle midnight reset (automatic rollover)
  useEffect(() => {
    return setupMidnightReset(() => {
      if (activeMessage?.type === 'tasksCompleted') {
        dismissMessage();
      }
    });
  }, [activeMessage, dismissMessage]);

  // 1. Task Completion Trigger (real-time celebration of daily progress)
  useEffect(() => {
    const currentCompleted = tasks.filter(t => t.completed);
    const currentCompletedSet = new Set(currentCompleted.map(t => t.id));

    if (prevCompletedSetRef.current === null) {
      syncTasksWithDailyTracker(tasks);
      prevCompletedSetRef.current = currentCompletedSet;
      return;
    }

    const newlyCompleted = currentCompleted.filter(t => !prevCompletedSetRef.current.has(t.id));
    const newlyUncompleted = Array.from(prevCompletedSetRef.current).filter(id => !currentCompletedSet.has(id));
    prevCompletedSetRef.current = currentCompletedSet;

    newlyUncompleted.forEach(id => {
      recordTaskCompletion(id, false);
    });

    if (newlyCompleted.length > 0) {
      const now = Date.now();
      setStoredTime('tasksCompleted', now);

      newlyCompleted.forEach(t => {
        recordTaskCompletion(t.id, true);
      });

      const count = getDailyCompletedCount();

      const timer = setTimeout(() => {
        showMessage({
          type: 'tasksCompleted',
          title: t('motivational.tasksCompleted.title'),
          desc: count === 1 
            ? t('motivational.tasksCompleted.descOne')
            : t('motivational.tasksCompleted.descMultiple', { count }),
        }, 14000);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [tasks, t, showMessage]);

  // 2. Contextual Moments Evaluation (Late Night, Multiple Overdue, Early Morning, Plan Tomorrow)
  const evaluateContextualMoments = useCallback(() => {
    // If a message is already actively showing, don't interrupt it
    if (activeMessage) return;

    const now = Date.now();
    const currentHour = new Date().getHours();

    // Priority A: Late at Night (rest & recharge)
    const isLateNight = currentHour >= 22 || currentHour < 5;
    if (isLateNight) {
      const lastLateNight = getStoredTime('lateNight');
      if (now - lastLateNight > COOLDOWNS.lateNight) {
        setStoredTime('lateNight', now);
        showMessage({
          type: 'lateNight',
          title: t('motivational.lateNight.title'),
          desc: t('motivational.lateNight.desc'),
        }, 16000);
        return;
      }
    }

    // Priority B: Multiple Overdue Tasks (gentle unblocking, no guilt)
    const overdueTasks = tasks.filter(
      t => !t.completed && t.deadline && getDeadlineStatus(t.deadline) === 'overdue'
    );
    if (overdueTasks.length >= 2 && !isLateNight) {
      const lastOverdue = getStoredTime('multipleOverdue');
      if (now - lastOverdue > COOLDOWNS.multipleOverdue) {
        setStoredTime('multipleOverdue', now);
        showMessage({
          type: 'multipleOverdue',
          title: t('motivational.multipleOverdue.title'),
          desc: t('motivational.multipleOverdue.desc', { count: overdueTasks.length }),
        }, 15000);
        return;
      }
    }

    // Priority C: Early Morning (start day with gentle focus)
    const isEarlyMorning = currentHour >= 5 && currentHour < 10;
    if (isEarlyMorning) {
      const lastMorning = getStoredTime('earlyMorning');
      if (now - lastMorning > COOLDOWNS.earlyMorning) {
        setStoredTime('earlyMorning', now);
        showMessage({
          type: 'earlyMorning',
          title: t('motivational.earlyMorning.title'),
          desc: t('motivational.earlyMorning.desc'),
        }, 15000);
        return;
      }
    }

    // Priority D: Plan for Tomorrow (evening lookahead 17:00 - 21:59)
    const isEvening = currentHour >= 17 && currentHour < 22;
    if (isEvening) {
      const lastPlanning = getStoredTime('planTomorrow');
      if (now - lastPlanning > COOLDOWNS.planTomorrow) {
        setStoredTime('planTomorrow', now);

        const tomorrowTasks = tasks.filter(
          t => !t.completed && t.deadline && getDaysUntil(t.deadline) === 1
        );
        const upcomingTask = tomorrowTasks[0] || tasks.find(t => !t.completed);

        showMessage({
          type: 'planTomorrow',
          title: t('motivational.planTomorrow.title'),
          desc: upcomingTask
            ? t('motivational.planTomorrow.descWithTask', { taskTitle: upcomingTask.title })
            : t('motivational.planTomorrow.descGeneral'),
        }, 15000);
        return;
      }
    }
  }, [activeMessage, tasks, t, showMessage]);

  // Run contextual evaluation on initial load and periodically (every 60s)
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      evaluateContextualMoments();
    }, 100);

    const interval = setInterval(() => {
      evaluateContextualMoments();
    }, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [evaluateContextualMoments]);

  // Expose test helper on window for development/testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__misuDailyTracker = {
        getDailyCompletedData,
        getDailyCompletedCount,
        recordTaskCompletion,
        resetDailyCompletedCount,
      };
      window.__misuTestMotivational = (type, customCount = 3) => {
        if (type === 'tasksCompleted') {
          showMessage({
            type: 'tasksCompleted',
            title: t('motivational.tasksCompleted.title'),
            desc: customCount === 1
              ? t('motivational.tasksCompleted.descOne')
              : t('motivational.tasksCompleted.descMultiple', { count: customCount }),
          }, 15000);
        } else if (type === 'lateNight') {
          showMessage({
            type: 'lateNight',
            title: t('motivational.lateNight.title'),
            desc: t('motivational.lateNight.desc'),
          }, 15000);
        } else if (type === 'earlyMorning') {
          showMessage({
            type: 'earlyMorning',
            title: t('motivational.earlyMorning.title'),
            desc: t('motivational.earlyMorning.desc'),
          }, 15000);
        } else if (type === 'multipleOverdue') {
          showMessage({
            type: 'multipleOverdue',
            title: t('motivational.multipleOverdue.title'),
            desc: t('motivational.multipleOverdue.desc', { count: customCount }),
          }, 15000);
        } else if (type === 'planTomorrow') {
          showMessage({
            type: 'planTomorrow',
            title: t('motivational.planTomorrow.title'),
            desc: t('motivational.planTomorrow.descWithTask', { taskTitle: 'Review pull requests' }),
          }, 15000);
        }
      };
    }
  }, [t, showMessage]);

  return {
    activeMessage,
    dismissMessage,
    triggerMessage: showMessage,
  };
}
