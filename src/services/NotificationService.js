/* ═══════════════════════════════════════════════════════════════
   NotificationService.js — Misu OS Notification Engine
   ─────────────────────────────────────────────────────────────
   Wraps the Web Notifications API with:
   - Permission lifecycle (request, denied graceful fallback)
   - Scheduled notifications via setTimeout + localStorage dedup
   - Cancel/clear mechanics per notification ID
   - Cross-platform safe (no Service Worker required)
   ═══════════════════════════════════════════════════════════════ */

const SETTINGS_KEY = 'misu:notification-settings';
const DEDUP_KEY    = 'misu:notif-seen';
const SCHEDULED_KEY = 'misu:notif-scheduled';

// ── Default preferences ───────────────────────────────────────
export const DEFAULT_PREFS = {
  enabled: true,
  pomodoro: true,        // Pomodoro session start/end
  deadlines: true,       // 24h before task deadline & day-of
  inactivity: true,      // Inactivity nudge
  weeklyReminder: true,  // Monday morning plan reminder
  taskUpcoming: true,    // Tasks due today (morning check)
  energyCheck: true,     // Mid-afternoon energy check
  mindfulness: true,     // Breathing / mindfulness break reminders
  streak: true,          // All tasks completed celebration
  dailyWrapup: true,     // Evening daily wrap-up & progress celebration
  focusShield: true,     // Focus shield activation confirmation
};

// ── Persist & load preferences ────────────────────────────────
export function loadNotifPrefs() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
    /* ignore parse error */
    return { ...DEFAULT_PREFS };
  }
}

export function saveNotifPrefs(prefs) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(prefs));
}

// ── Permission ────────────────────────────────────────────────
export function getPermissionStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    /* ignore request error */
    return 'denied';
  }
}

// ── Deduplication helpers ─────────────────────────────────────
function getSeenMap() {
  try {
    return JSON.parse(localStorage.getItem(DEDUP_KEY) || '{}');
  } catch {
    /* ignore parse error */
    return {}; 
  }
}

function setSeenMap(map) {
  localStorage.setItem(DEDUP_KEY, JSON.stringify(map));
}

// Returns true if notification with key was already shown within `windowMs`
function alreadySeen(key, windowMs = 23 * 60 * 60 * 1000) {
  const map = getSeenMap();
  const ts = map[key];
  if (!ts) return false;
  return Date.now() - ts < windowMs;
}

function markSeen(key) {
  const map = getSeenMap();
  map[key] = Date.now();
  setSeenMap(map);
}

// ── Active timer registry (to cancel scheduled ones) ─────────
const timers = new Map(); // notifId → timeoutHandle

// ── Core send ─────────────────────────────────────────────────
/**
 * Fire an immediate native notification.
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.body
 * @param {string} [opts.icon]          — URL to icon
 * @param {string} [opts.tag]           — dedup tag (same tag replaces previous)
 * @param {string} [opts.dedupKey]      — localStorage dedup key (optional)
 * @param {number} [opts.dedupWindow]   — ms window for dedup (default 23h)
 * @param {boolean} [opts.silent]       — suppress OS sound
 * @returns {Notification|null}
 */
export function sendNotification({ title, body, icon, tag, dedupKey, dedupWindow, silent = false }) {
  const prefs = loadNotifPrefs();
  if (!prefs.enabled) return null;
  if (getPermissionStatus() !== 'granted') return null;

  if (dedupKey && alreadySeen(dedupKey, dedupWindow)) return null;
  if (dedupKey) markSeen(dedupKey);

  try {
    const notif = new Notification(title, {
      body,
      icon: icon || '/misu-logo-color.svg',
      tag: tag || dedupKey || `misu-${Date.now()}`,
      silent,
      badge: '/misu-logo-color.svg',
    });

    notif.onclick = () => {
      window.focus();
      try {
        notif.close();
      } catch {
        /* ignore close error */
      }
    };

    return notif;
  } catch (err) {
    console.warn('[Misu Notifications] Failed to create notification:', err);
    return null;
  }
}

// ── Scheduled send ────────────────────────────────────────────
/**
 * Schedule a notification to fire at a future Date (or after `delayMs`).
 * @param {string} id          — unique ID for this scheduled notif (allows cancel)
 * @param {object} notifOpts   — same as sendNotification opts
 * @param {Date|number} when   — Date object OR ms delay from now
 * @returns {string} id
 */
export function scheduleNotification(id, notifOpts, when) {
  cancelScheduled(id); // clear any existing timer with same id

  const delayMs = when instanceof Date
    ? when.getTime() - Date.now()
    : when;

  if (delayMs < 0) return id; // already past

  const handle = setTimeout(() => {
    sendNotification(notifOpts);
    timers.delete(id);
    // remove from localStorage registry
    try {
      const reg = JSON.parse(localStorage.getItem(SCHEDULED_KEY) || '{}');
      delete reg[id];
      localStorage.setItem(SCHEDULED_KEY, JSON.stringify(reg));
    } catch {
      /* ignore storage errors */
    }
  }, delayMs);

  timers.set(id, handle);

  // Persist schedule record (for debugging / reload awareness)
  try {
    const reg = JSON.parse(localStorage.getItem(SCHEDULED_KEY) || '{}');
    reg[id] = { notifOpts, fireAt: Date.now() + delayMs };
    localStorage.setItem(SCHEDULED_KEY, JSON.stringify(reg));
  } catch {
    /* ignore storage errors */
  }

  return id;
}

// ── Cancel scheduled ─────────────────────────────────────────
export function cancelScheduled(id) {
  if (timers.has(id)) {
    clearTimeout(timers.get(id));
    timers.delete(id);
  }
  try {
    const reg = JSON.parse(localStorage.getItem(SCHEDULED_KEY) || '{}');
    delete reg[id];
    localStorage.setItem(SCHEDULED_KEY, JSON.stringify(reg));
  } catch {
    /* ignore storage errors */
  }
}

export function cancelAllScheduled() {
  for (const handle of timers.values()) clearTimeout(handle);
  timers.clear();
  localStorage.removeItem(SCHEDULED_KEY);
}

// ── Prefab notification factories ─────────────────────────────
export const NotifTemplates = {
  pomodoroStart(taskTitle, lang = 'en') {
    const msgs = {
      en: { title: 'Focus Session Started', body: taskTitle ? `Working on: ${taskTitle}` : 'Time for deep, uninterrupted focus.' },
      es: { title: 'Sesión de Enfoque Iniciada', body: taskTitle ? `Trabajando en: ${taskTitle}` : 'Momento de enfoque profundo y sin interrupciones.' },
      it: { title: 'Sessione Focus Avviata', body: taskTitle ? `Lavorando su: ${taskTitle}` : 'Momento di concentrazione profonda senza interruzioni.' },
    };
    return msgs[lang] || msgs.en;
  },

  pomodoroEnd(lang = 'en') {
    const msgs = {
      en: { title: 'Focus Session Complete', body: 'Great work! Take a short break to recover and recharge.' },
      es: { title: 'Sesión de Enfoque Completada', body: '¡Buen trabajo! Toma un breve descanso para recuperarte.' },
      it: { title: 'Sessione Focus Completata', body: 'Ottimo lavoro! Fai una breve pausa per ricaricarti.' },
    };
    return msgs[lang] || msgs.en;
  },

  breakEnd(lang = 'en') {
    const msgs = {
      en: { title: 'Break Over', body: 'Ready to refocus? Your next session is ready.' },
      es: { title: 'Descanso Terminado', body: '¿Listo para retomar tu ritmo? Tu próxima sesión te espera.' },
      it: { title: 'Pausa Terminata', body: 'Pronto a ripartire? La tua prossima sessione ti aspetta.' },
    };
    return msgs[lang] || msgs.en;
  },

  longBreakEnd(lang = 'en') {
    const msgs = {
      en: { title: 'Long Break Over', body: 'Energy restored. Start a new cycle whenever you are ready.' },
      es: { title: 'Descanso Largo Terminado', body: 'Energía restaurada. Inicia un nuevo ciclo cuando estés listo.' },
      it: { title: 'Pausa Lunga Terminata', body: 'Energia ripristinata. Inizia un nuovo ciclo quando sei pronto.' },
    };
    return msgs[lang] || msgs.en;
  },

  deadlineTomorrow(taskTitle, lang = 'en') {
    const msgs = {
      en: { title: 'Deadline Tomorrow', body: `"${taskTitle}" is due tomorrow. Plan your schedule accordingly.` },
      es: { title: 'Vence Mañana', body: `"${taskTitle}" vence mañana. Planifica tu tiempo con antelación.` },
      it: { title: 'Scadenza Domani', body: `"${taskTitle}" scade domani. Pianifica il tuo tempo di conseguenza.` },
    };
    return msgs[lang] || msgs.en;
  },

  deadlineToday(taskTitle, lang = 'en') {
    const msgs = {
      en: { title: 'Due Today', body: `"${taskTitle}" requires your attention today.` },
      es: { title: 'Vence Hoy', body: `"${taskTitle}" requiere tu atención hoy.` },
      it: { title: 'Scade Oggi', body: `"${taskTitle}" richiede la tua attenzione oggi.` },
    };
    return msgs[lang] || msgs.en;
  },

  weeklyReminder(taskCount, lang = 'en') {
    const msgs = {
      en: { title: 'Weekly Plan', body: `You have ${taskCount} task${taskCount !== 1 ? 's' : ''} lined up this week. Time to plan.` },
      es: { title: 'Plan Semanal', body: `Tienes ${taskCount} tarea${taskCount !== 1 ? 's' : ''} esta semana. Es hora de planificar tu agenda.` },
      it: { title: 'Piano Settimanale', body: `Hai ${taskCount} attività questa settimana. È ora di pianificare la tua agenda.` },
    };
    return msgs[lang] || msgs.en;
  },

  tasksDueToday(count, lang = 'en') {
    const msgs = {
      en: { title: 'Daily Review', body: `You have ${count} task${count !== 1 ? 's' : ''} due today. Set your energy and begin.` },
      es: { title: 'Revisión Diaria', body: `Tienes ${count} tarea${count !== 1 ? 's' : ''} para hoy. Define tu energía y comienza.` },
      it: { title: 'Revisione Giornaliera', body: `Hai ${count} attività in scadenza oggi. Definisci la tua energia e inizia.` },
    };
    return msgs[lang] || msgs.en;
  },

  inactivityNudge(lang = 'en') {
    const msgs = {
      en: { title: 'Pause Detected', body: 'You have been away for a while. Return to your flow or take a calming breath.' },
      es: { title: 'Pausa Detectada', body: 'Llevas un rato inactivo. Vuelve a tus tareas o haz una pausa de calma.' },
      it: { title: 'Pausa Rilevata', body: 'Sei stato inattivo per un po\'. Torna alle tue attività o concediti una pausa di respiro.' },
    };
    return msgs[lang] || msgs.en;
  },

  energyCheckIn(lang = 'en') {
    const msgs = {
      en: { title: 'Energy Check-In', body: 'How is your energy right now? Update your mood to align your afternoon tasks.' },
      es: { title: 'Control de Energía', body: '¿Cómo está tu energía ahora? Actualiza tu nivel para alinear tus tareas de la tarde.' },
      it: { title: 'Controllo Energia', body: 'Com\'è la tua energia adesso? Aggiorna il livello per allineare i compiti del pomeriggio.' },
    };
    return msgs[lang] || msgs.en;
  },

  overdue(taskTitle, lang = 'en') {
    const msgs = {
      en: { title: 'Overdue Task', body: `"${taskTitle}" was due. Take a moment to reschedule or complete it.` },
      es: { title: 'Tarea Vencida', body: `"${taskTitle}" está vencida. Tómate un momento para reprogramarla o completarla.` },
      it: { title: 'Attività Scaduta', body: `"${taskTitle}" è scaduta. Prenditi un momento per riprogrammarla o completarla.` },
    };
    return msgs[lang] || msgs.en;
  },

  overdueSummary(count, lang = 'en') {
    const msgs = {
      en: { title: 'Overdue Tasks', body: `You have ${count} overdue tasks. Take a moment to review and reschedule.` },
      es: { title: 'Tareas Vencidas', body: `Tienes ${count} tareas atrasadas. Tómate un momento para revisarlas y reprogramar.` },
      it: { title: 'Attività Scadute', body: `Hai ${count} attività scadute. Prenditi un momento per rivederle e riprogrammarle.` },
    };
    return msgs[lang] || msgs.en;
  },

  mindfulnessBreak(lang = 'en') {
    const msgs = {
      en: { title: 'Mindfulness & Breathing', body: 'Time for a 4-7-8 breathing reset. Inhale calm, exhale tension.' },
      es: { title: 'Pausa de Respiración', body: 'Momento de una pausa de respiración 4-7-8. Inhala calma, exhala tensión.' },
      it: { title: 'Pausa di Respirazione', body: 'È il momento di un reset 4-7-8. Inspira calma, espira la tensione.' },
    };
    return msgs[lang] || msgs.en;
  },

  allTasksCompleted(lang = 'en') {
    const msgs = {
      en: { title: 'All Tasks Completed! 🎉', body: 'Outstanding focus! You finished everything planned for today.' },
      es: { title: '¡Todas las tareas listas! 🎉', body: '¡Excelente enfoque! Has terminado todo lo programado para hoy.' },
      it: { title: 'Tutte le attività completate! 🎉', body: 'Lavoro straordinario! Hai completato tutto ciò che era pianificato per oggi.' },
    };
    return msgs[lang] || msgs.en;
  },

  dailyWrapup(completedCount, pendingCount, lang = 'en') {
    const msgs = {
      en: { 
        title: 'Evening Wrap-Up', 
        body: `Great effort today! Finished ${completedCount} task${completedCount !== 1 ? 's' : ''}${pendingCount > 0 ? ` with ${pendingCount} pending` : ''}. Time to unwind!` 
      },
      es: { 
        title: 'Cierre del Día', 
        body: `¡Gran esfuerzo hoy! Completaste ${completedCount} tarea${completedCount !== 1 ? 's' : ''}${pendingCount > 0 ? ` y ${pendingCount} pendiente${pendingCount !== 1 ? 's' : ''}` : ''}. ¡Momento de descansar!` 
      },
      it: { 
        title: 'Riepilogo Serale', 
        body: `Ottimo lavoro oggi! Hai completato ${completedCount} attività${pendingCount > 0 ? ` con ${pendingCount} in sospeso` : ''}. Ora rilassati!` 
      },
    };
    return msgs[lang] || msgs.en;
  },

  focusShieldActive(lang = 'en') {
    const msgs = {
      en: { title: 'Focus Shield Active 🛡️', body: 'Distractions are minimized. Enter your deep work zone.' },
      es: { title: 'Escudo de Enfoque Activo 🛡️', body: 'Distracciones minimizadas. Entra en tu estado de flujo.' },
      it: { title: 'Scudo di Concentrazione Attivo 🛡️', body: 'Distrazioni ridotte al minimo. Entra nel tuo stato di concentrazione.' },
    };
    return msgs[lang] || msgs.en;
  },
};
