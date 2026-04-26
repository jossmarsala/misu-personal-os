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
      icon: icon || '/misu-logo-color.svg',
      tag: tag || dedupKey || `misu-${Date.now()}`,
      silent,
      badge: '/misu-logo-color.svg',
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
      en: { title: '🍅 Focus Session Started', body: taskTitle ? `Working on: ${taskTitle}` : `25 minutes of deep focus. You've got this!` },
      es: { title: '🍅 Sesión de Enfoque Iniciada', body: taskTitle ? `Trabajando en: ${taskTitle}` : '25 minutos de enfoque profundo. ¡Tú puedes!' },
      it: { title: '🍅 Sessione Focus Avviata', body: taskTitle ? `Lavorando su: ${taskTitle}` : '25 minuti di focus. Ce la fai!' },
    };
    return msgs[lang] || msgs.en;
  },

  pomodoroEnd(lang = 'en') {
    const msgs = {
      en: { title: '✅ Focus Session Complete!', body: 'Great work! Take a short break — you earned it.' },
      es: { title: '✅ ¡Sesión de Enfoque Completada!', body: '¡Buen trabajo! Tómate un descanso corto — te lo ganaste.' },
      it: { title: '✅ Sessione Focus Completata!', body: 'Ottimo lavoro! Prenditi una pausa breve — te la sei guadagnata.' },
    };
    return msgs[lang] || msgs.en;
  },

  breakEnd(lang = 'en') {
    const msgs = {
      en: { title: '⏰ Break Over', body: 'Ready to focus again? Start your next session when you\'re set.' },
      es: { title: '⏰ Descanso Terminado', body: '¿Listo para enfocarte de nuevo? Inicia tu próxima sesión cuando estés listo.' },
      it: { title: '⏰ Pausa Terminata', body: 'Pronto a concentrarti di nuovo? Avvia la prossima sessione quando sei pronto.' },
    };
    return msgs[lang] || msgs.en;
  },

  longBreakEnd(lang = 'en') {
    const msgs = {
      en: { title: '🔋 Long Break Over', body: 'Recharged? Start a fresh Pomodoro cycle when you\'re ready.' },
      es: { title: '🔋 Descanso Largo Terminado', body: '¿Recargado? Empieza un nuevo ciclo Pomodoro cuando estés listo.' },
      it: { title: '🔋 Pausa Lunga Terminata', body: 'Ricaricato? Inizia un nuovo ciclo Pomodoro quando sei pronto.' },
    };
    return msgs[lang] || msgs.en;
  },

  deadlineTomorrow(taskTitle, lang = 'en') {
    const msgs = {
      en: { title: '⚡ Deadline Tomorrow', body: `"${taskTitle}" is due tomorrow. Don't let it sneak up on you!` },
      es: { title: '⚡ Fecha Límite Mañana', body: `"${taskTitle}" vence mañana. ¡No dejes que te tome por sorpresa!` },
      it: { title: '⚡ Scadenza Domani', body: `"${taskTitle}" scade domani. Non lasciare che ti sorprenda!` },
    };
    return msgs[lang] || msgs.en;
  },

  deadlineToday(taskTitle, lang = 'en') {
    const msgs = {
      en: { title: '🚨 Due Today!', body: `"${taskTitle}" is due today. Tackle it now!` },
      es: { title: '🚨 ¡Vence Hoy!', body: `"${taskTitle}" vence hoy. ¡Enfréntalo ahora!` },
      it: { title: '🚨 Scade Oggi!', body: `"${taskTitle}" scade oggi. Affrontalo ora!` },
    };
    return msgs[lang] || msgs.en;
  },

  weeklyReminder(taskCount, lang = 'en') {
    const msgs = {
      en: { title: '📅 Start Your Week Strong', body: `You have ${taskCount} task${taskCount !== 1 ? 's' : ''} this week. Open Misu to plan your days!` },
      es: { title: '📅 Comienza la Semana con Fuerza', body: `Tienes ${taskCount} tarea${taskCount !== 1 ? 's' : ''} esta semana. ¡Abre Misu para planificar tus días!` },
      it: { title: '📅 Inizia la Settimana Forte', body: `Hai ${taskCount} attività questa settimana. Apri Misu per pianificare i tuoi giorni!` },
    };
    return msgs[lang] || msgs.en;
  },

  tasksDueToday(count, lang = 'en') {
    const msgs = {
      en: { title: '☀️ Good Morning!', body: `You have ${count} task${count !== 1 ? 's' : ''} due today. Set your energy and start strong.` },
      es: { title: '☀️ ¡Buenos Días!', body: `Tienes ${count} tarea${count !== 1 ? 's' : ''} para hoy. Ajusta tu energía y empieza con fuerza.` },
      it: { title: '☀️ Buongiorno!', body: `Hai ${count} attività in scadenza oggi. Imposta la tua energia e inizia bene.` },
    };
    return msgs[lang] || msgs.en;
  },

  inactivityNudge(lang = 'en') {
    const msgs = {
      en: { title: '💡 Still There?', body: 'You\'ve been away for a while. Check in with Misu when you\'re ready.' },
      es: { title: '💡 ¿Sigues Ahí?', body: 'Has estado ausente un rato. Vuelve a Misu cuando estés listo.' },
      it: { title: '💡 Sei Ancora Lì?', body: 'Sei stato lontano per un po\'. Torna su Misu quando sei pronto.' },
    };
    return msgs[lang] || msgs.en;
  },

  energyCheckIn(lang = 'en') {
    const msgs = {
      en: { title: '⚡ Energy Check-In', body: 'Afternoon! How\'s your energy right now? Update it in Misu to get fresh task suggestions.' },
      es: { title: '⚡ Revisión de Energía', body: '¡Buenas tardes! ¿Cómo está tu energía ahora? Actualízala en Misu para recibir nuevas sugerencias.' },
      it: { title: '⚡ Check-In Energetico', body: 'Pomeriggio! Come sta andando la tua energia? Aggiornala in Misu per nuovi suggerimenti.' },
    };
    return msgs[lang] || msgs.en;
  },

  overdue(taskTitle, lang = 'en') {
    const msgs = {
      en: { title: '⚠️ Overdue Task', body: `"${taskTitle}" is overdue. Start with just 25 minutes — small progress counts.` },
      es: { title: '⚠️ Tarea Atrasada', body: `"${taskTitle}" está atrasada. Comienza con solo 25 minutos — el progreso pequeño importa.` },
      it: { title: '⚠️ Attività in Ritardo', body: `"${taskTitle}" è in ritardo. Inizia con soli 25 minuti — ogni piccolo progresso conta.` },
    };
    return msgs[lang] || msgs.en;
  },
};
