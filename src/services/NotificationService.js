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
  deadlines: true,       // 24h before task deadline
  inactivity: true,      // Long inactivity nudge
  weeklyReminder: true,  // Monday morning plan reminder
  taskUpcoming: true,    // Tasks due today (morning check)
  energyCheck: true,     // Mid-afternoon energy check
};

// ── Persist & load preferences ────────────────────────────────
export function loadNotifPrefs() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
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
    return 'denied';
  }
}

// ── Deduplication helpers ─────────────────────────────────────
function getSeenMap() {
  try {
    return JSON.parse(localStorage.getItem(DEDUP_KEY) || '{}');
  } catch { return {}; }
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
      icon: icon || '/pwa-192x192.png',
      tag: tag || dedupKey || `misu-${Date.now()}`,
      silent,
      badge: '/masked-icon.svg',
    });
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
    } catch {}
  }, delayMs);

  timers.set(id, handle);

  // Persist schedule record (for debugging / reload awareness)
  try {
    const reg = JSON.parse(localStorage.getItem(SCHEDULED_KEY) || '{}');
    reg[id] = { notifOpts, fireAt: Date.now() + delayMs };
    localStorage.setItem(SCHEDULED_KEY, JSON.stringify(reg));
  } catch {}

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
  } catch {}
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
      en: { title: 'Focus Session Started', body: taskTitle ? `Working on: ${taskTitle}` : `25 minutes of deep focus.` },
      es: { title: 'Sesión de Enfoque Iniciada', body: taskTitle ? `Trabajando en: ${taskTitle}` : '25 minutos de enfoque profundo.' },
      it: { title: 'Sessione Focus Avviata', body: taskTitle ? `Lavorando su: ${taskTitle}` : '25 minuti di focus profondo.' },
    };
    return msgs[lang] || msgs.en;
  },

  pomodoroEnd(lang = 'en') {
    const msgs = {
      en: { title: 'Focus Session Complete', body: 'Take a short break to recover.' },
      es: { title: 'Sesión de Enfoque Completada', body: 'Toma un breve descanso para recuperar.' },
      it: { title: 'Sessione Focus Completata', body: 'Fai una breve pausa per recuperare.' },
    };
    return msgs[lang] || msgs.en;
  },

  breakEnd(lang = 'en') {
    const msgs = {
      en: { title: 'Break Over', body: 'Ready to resume your focus.' },
      es: { title: 'Descanso Terminado', body: 'Listo para retomar el enfoque.' },
      it: { title: 'Pausa Terminata', body: 'Pronto a riprendere la concentrazione.' },
    };
    return msgs[lang] || msgs.en;
  },

  longBreakEnd(lang = 'en') {
    const msgs = {
      en: { title: 'Long Break Over', body: 'Energy restored. Start a new cycle when ready.' },
      es: { title: 'Descanso Largo Terminado', body: 'Energía restaurada. Inicia un nuevo ciclo cuando estés listo.' },
      it: { title: 'Pausa Lunga Terminata', body: 'Energia ripristinata. Inizia un nuovo ciclo quando sei pronto.' },
    };
    return msgs[lang] || msgs.en;
  },

  deadlineTomorrow(taskTitle, lang = 'en') {
    const msgs = {
      en: { title: 'Deadline Tomorrow', body: `"${taskTitle}" is due tomorrow. Plan accordingly.` },
      es: { title: 'Vence Mañana', body: `"${taskTitle}" vence mañana. Planifica tu tiempo.` },
      it: { title: 'Scadenza Domani', body: `"${taskTitle}" scade domani. Pianifica il tuo tempo.` },
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
      en: { title: 'Weekly Plan', body: `You have ${taskCount} task${taskCount !== 1 ? 's' : ''} this week. Time to plan.` },
      es: { title: 'Plan Semanal', body: `Tienes ${taskCount} tarea${taskCount !== 1 ? 's' : ''} esta semana. Es hora de planificar.` },
      it: { title: 'Piano Settimanale', body: `Hai ${taskCount} attività questa settimana. È ora di pianificare.` },
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
      en: { title: 'System Idle', body: 'Regain your focus when you are ready to continue.' },
      es: { title: 'Sistema Inactivo', body: 'Recupera tu enfoque cuando estés listo para continuar.' },
      it: { title: 'Sistema Inattivo', body: 'Recupera la concentrazione quando sei pronto a continuare.' },
    };
    return msgs[lang] || msgs.en;
  },

  energyCheckIn(lang = 'en') {
    const msgs = {
      en: { title: 'Energy Check', body: 'Time to update your current energy level.' },
      es: { title: 'Control de Energía', body: 'Es momento de actualizar tu nivel de energía actual.' },
      it: { title: 'Controllo Energia', body: 'È il momento di aggiornare il tuo livello di energia attuale.' },
    };
    return msgs[lang] || msgs.en;
  },

  overdue(taskTitle, lang = 'en') {
    const msgs = {
      en: { title: 'Overdue Task', body: `"${taskTitle}" is pending. Action is required.` },
      es: { title: 'Tarea Pendiente', body: `"${taskTitle}" está atrasada. Se requiere acción.` },
      it: { title: 'Attività in Sospeso', body: `"${taskTitle}" è in ritardo. È richiesta un'azione.` },
    };
    return msgs[lang] || msgs.en;
  },
};
