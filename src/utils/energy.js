/* ═══════════════════════════════════════
   Energy level definitions, colors, and helper functions
   Music/Vibes-based energy system
   ═══════════════════════════════════════ */

export const ENERGY_LEVELS = [
  {
    level: 1,
    name: 'Whisper',
    colorA: '#C5D4B5',
    colorB: '#E2EADA',
    vividColorA: '#a6cf80ff',
    vividColorB: '#489ceaff',
    gradientLabel: 'Moss → Sky',
  },
  {
    level: 2,
    name: 'Calm',
    colorA: '#EED6FB',
    colorB: '#FEDDE6',
    vividColorA: '#D770F3',
    vividColorB: '#FFB7FF',
    gradientLabel: 'Lavender → Rose',
  },
  {
    level: 3,
    name: 'Rhythm',
    colorA: '#8B98E3',
    colorB: '#F5C8E7',
    vividColorA: '#4F67FF',
    vividColorB: '#FF99E2',
    gradientLabel: 'Periwinkle → Blush',
  },
  {
    level: 4,
    name: 'Peak',
    colorA: '#F8AD9D',
    colorB: '#FFDAB9',
    vividColorA: '#FF5E3A',
    vividColorB: '#FFAC71',
    gradientLabel: 'Melon → Peach',
  },
  // C1: Human-readable text (descriptions, messages) now live exclusively in translations.js
];

export function getEnergyDef(level) {
  return ENERGY_LEVELS.find(e => e.level === level) || ENERGY_LEVELS[2];
}

export function getEnergyColor(level) {
  const def = getEnergyDef(level);
  return def.colorA;
}

export function getEnergyName(level) {
  return getEnergyDef(level).name;
}

export function getEnergyLabel(level) {
  return getEnergyDef(level).label;
}

export function getEnergyMessage(level) {
  return getEnergyDef(level).message;
}

export function getEnergyEmptyMessage(level) {
  return getEnergyDef(level).emptyMessage;
}
