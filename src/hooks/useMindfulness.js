import { useState, useEffect, useRef, useCallback } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { useTasks } from '../context/TaskContext';

// Keys for localStorage flags (one-time tips)
const FLAGS = {
  DND_HELP:          'misu_seen_dnd_help',
  FIRST_TASK:        'misu_seen_first_task_tip',
  FIRST_COMPLETE:    'misu_seen_first_complete_tip',
  MUSIC_INTRO:       'misu_seen_music_intro',
  POMODORO_INTRO:    'misu_seen_pomodoro_intro',
  MORNING_GREETED:   'misu_morning_greeted', // resets daily
  WHISPER_HINT:      'misu_seen_whisper_hint',
};

function hasSeenToday(key) {
  const stored = localStorage.getItem(key);
  if (!stored) return false;
  return stored === new Date().toDateString();
}

function markSeenToday(key) {
  localStorage.setItem(key, new Date().toDateString());
}

function hasSeen(key) {
  return !!localStorage.getItem(key);
}

function markSeen(key) {
  localStorage.setItem(key, 'true');
}

export function useMindfulness(dndVisible, musicVisible, pomodoroVisible) {
  const { currentEnergy, breathingActive } = useEnergy();
  const { tasks } = useTasks();

  const [advice, setAdvice]             = useState(null);
  const [helperVisible, setHelperVisible] = useState(false);
  const [helperType, setHelperType]     = useState('advice');

  const lastActivityRef   = useRef(Date.now());
  const prevTasksCountRef = useRef(tasks.length);
  const prevCompletedRef  = useRef(tasks.filter(t => t.completed).length);
  const prevEnergyRef     = useRef(currentEnergy);
  const tipQueueRef       = useRef([]); // queued tips to show one at a time

  // Helper: show a tip (queues if one is already showing)
  const showTip = useCallback((tipAdvice, tipType = 'advice') => {
    if (helperVisible) {
      tipQueueRef.current.push({ tipAdvice, tipType });
      return;
    }
    setAdvice(tipAdvice);
    setHelperType(tipType);
    setHelperVisible(true);
  }, [helperVisible]);

  // When tip is dismissed, show next in queue
  const handleClose = useCallback(() => {
    setHelperVisible(false);
    const next = tipQueueRef.current.shift();
    if (next) {
      setTimeout(() => {
        setAdvice(next.tipAdvice);
        setHelperType(next.tipType);
        setHelperVisible(true);
      }, 400);
    }
  }, []);

  // ─── Track activity ────────────────────────────────────────
  useEffect(() => {
    const activeCount    = tasks.filter(t => !t.completed).length;
    const completedCount = tasks.filter(t => t.completed).length;

    // Task count changed → reset activity timer
    if (tasks.length !== prevTasksCountRef.current) {
      lastActivityRef.current = Date.now();
    }

    // ── First task ever added ──────────────────────────────
    if (activeCount === 1 && prevTasksCountRef.current === 0 && !hasSeen(FLAGS.FIRST_TASK)) {
      markSeen(FLAGS.FIRST_TASK);
      showTip('tips.firstTask', 'surprise');
    }

    // ── First task ever completed ──────────────────────────
    if (completedCount > prevCompletedRef.current && !hasSeen(FLAGS.FIRST_COMPLETE)) {
      markSeen(FLAGS.FIRST_COMPLETE);
      showTip('tips.firstComplete', 'surprise');
    }

    prevTasksCountRef.current = tasks.length;
    prevCompletedRef.current  = completedCount;
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Morning greeting (once per day) ──────────────────────
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12 && !hasSeenToday(FLAGS.MORNING_GREETED)) {
      markSeenToday(FLAGS.MORNING_GREETED);
      const activeTasks = tasks.filter(t => !t.completed).length;
      if (activeTasks > 0) {
        setTimeout(() => showTip('tips.morningGreeting', 'surprise'), 3000);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Overdue tasks detected on load ───────────────────────
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = tasks.filter(t => {
      if (t.completed || !t.deadline) return false;
      const dl = new Date(t.deadline);
      dl.setHours(0, 0, 0, 0);
      return dl < today;
    });

    if (overdue.length > 0) {
      const key = `misu_overdue_warned_${new Date().toDateString()}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, 'true');
        setTimeout(() => showTip('tips.overdueWarning', 'advice'), 5000);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Energy level changed to Whisper (1) ──────────────────
  useEffect(() => {
    if (currentEnergy === 1 && prevEnergyRef.current !== 1 && !hasSeen(FLAGS.WHISPER_HINT)) {
      markSeen(FLAGS.WHISPER_HINT);
      showTip('tips.whisperMode', 'mindfulness');
    }
    // Heavy workload warning when switching to peak energy (4) with many tasks
    if (currentEnergy === 4 && prevEnergyRef.current !== 4) {
      const heavyTasks = tasks.filter(t => !t.completed && (t.estimatedHours || 0) > 3);
      if (heavyTasks.length >= 3) {
        showTip('tips.heavyWorkload', 'advice');
      }
    }
    prevEnergyRef.current = currentEnergy;
  }, [currentEnergy]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Idle trigger (20+ min inactive with pending tasks) ───
  useEffect(() => {
    const interval = setInterval(() => {
      const activeCount = tasks.filter(t => !t.completed).length;
      const idleMinutes = (Date.now() - lastActivityRef.current) / 60000;

      if (currentEnergy >= 3 && activeCount > 0 && idleMinutes > 20 && !helperVisible && !breathingActive) {
        setHelperType('mindfulness');
        setAdvice('mindfulness.idleAdvice');
        setHelperVisible(true);
        lastActivityRef.current = Date.now(); // reset so it doesn't fire immediately again
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentEnergy, tasks, helperVisible, breathingActive]);

  // ─── Show breathing guide when DND breathing mode is active ─
  useEffect(() => {
    if (breathingActive) {
      setHelperType('mindfulness');
      setAdvice('mindfulness.breathing');
      setHelperVisible(true);
    } else if (helperType === 'mindfulness' && advice === 'mindfulness.breathing') {
      setHelperVisible(false);
    }
  }, [breathingActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Focus Shield first-time onboarding ───────────────────
  useEffect(() => {
    if (dndVisible && !hasSeen(FLAGS.DND_HELP)) {
      markSeen(FLAGS.DND_HELP);
      setHelperType('info');
      setAdvice('mindfulness.dndHelp');
      setHelperVisible(true);
    }
  }, [dndVisible]);

  // ─── Music widget first open ───────────────────────────────
  useEffect(() => {
    if (musicVisible && !hasSeen(FLAGS.MUSIC_INTRO)) {
      markSeen(FLAGS.MUSIC_INTRO);
      setTimeout(() => showTip('tips.musicIntro', 'info'), 800);
    }
  }, [musicVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Pomodoro widget first open ───────────────────────────
  useEffect(() => {
    if (pomodoroVisible && !hasSeen(FLAGS.POMODORO_INTRO)) {
      markSeen(FLAGS.POMODORO_INTRO);
      setTimeout(() => showTip('tips.pomodoroIntro', 'info'), 800);
    }
  }, [pomodoroVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    advice,
    helperVisible,
    helperType,
    setHelperVisible: handleClose,
  };
}
