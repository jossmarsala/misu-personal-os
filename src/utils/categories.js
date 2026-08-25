/* ═══════════════════════════════════════
   Task Category definitions
   Single source of truth for all category
   metadata (label, icon, colour).
   ═══════════════════════════════════════ */

export const CATEGORIES = [
  {
    id: 'studies',
    icon: '📚',
    color: '#818CF8',          // indigo-400
    colorBg: 'rgba(129,140,248,0.15)',
    colorBorder: 'rgba(129,140,248,0.25)',
    labels: { en: 'Studies', es: 'Estudios', it: 'Studi' },
  },
  {
    id: 'work',
    icon: '💼',
    color: '#34D399',          // emerald-400
    colorBg: 'rgba(52,211,153,0.15)',
    colorBorder: 'rgba(52,211,153,0.25)',
    labels: { en: 'Work', es: 'Trabajo', it: 'Lavoro' },
  },
  {
    id: 'social',
    icon: '🤝',
    color: '#FB923C',          // orange-400
    colorBg: 'rgba(251,146,60,0.15)',
    colorBorder: 'rgba(251,146,60,0.25)',
    labels: { en: 'Social', es: 'Social', it: 'Sociale' },
  },
  {
    id: 'hobbies',
    icon: '🎨',
    color: '#F472B6',          // pink-400
    colorBg: 'rgba(244,114,182,0.15)',
    colorBorder: 'rgba(244,114,182,0.25)',
    labels: { en: 'Hobbies', es: 'Pasatiempos', it: 'Hobby' },
  },
  {
    id: 'sideProjects',
    icon: '🚀',
    color: '#38BDF8',          // sky-400
    colorBg: 'rgba(56,189,248,0.15)',
    colorBorder: 'rgba(56,189,248,0.25)',
    labels: { en: 'Side Projects', es: 'Proyectos propios', it: 'Progetti personali' },
  },
  {
    id: 'health',
    icon: '🏃',
    color: '#4ADE80',          // green-400
    colorBg: 'rgba(74,222,128,0.15)',
    colorBorder: 'rgba(74,222,128,0.25)',
    labels: { en: 'Health', es: 'Salud', it: 'Salute' },
  },
  {
    id: 'home',
    icon: '🏠',
    color: '#FBBF24',          // amber-400
    colorBg: 'rgba(251,191,36,0.15)',
    colorBorder: 'rgba(251,191,36,0.25)',
    labels: { en: 'Home', es: 'Hogar', it: 'Casa' },
  },
  {
    id: 'other',
    icon: '📌',
    color: '#94A3B8',          // slate-400
    colorBg: 'rgba(148,163,184,0.15)',
    colorBorder: 'rgba(148,163,184,0.25)',
    labels: { en: 'Other', es: 'Otro', it: 'Altro' },
  },
];

/** Find a category by id (returns `other` as fallback). */
export function getCategoryDef(id) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES.find(c => c.id === 'other');
}

/** Get localised label for a category. */
export function getCategoryLabel(id, language = 'en') {
  const cat = getCategoryDef(id);
  return cat.labels[language] ?? cat.labels.en;
}
