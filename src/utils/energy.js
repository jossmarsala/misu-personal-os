/* ═══════════════════════════════════════
   Energy level definitions, colors, and helper functions
   ═══════════════════════════════════════ */

export const ENERGY_LEVELS = [
  {
    level: 1,
    name: 'Hypnos',
    label: 'Very Low',
    description: 'Rest mode — slow, gentle tasks only',
    colorA: '#a8c5a0',
    colorB: '#e8d98e',
    emoji: '🌙',
    gradientLabel: 'Green → Yellow',
    message: 'Take it easy. Here\'s something gentle for you...',
    emptyMessage: 'Nothing light enough — maybe rest a little?',
  },
  {
    level: 2,
    name: 'Selene',
    label: 'Low',
    description: 'Calm energy — simple, reflective work',
    colorA: '#93c5fd',
    colorB: '#c4b5fd',
    emoji: '🍃',
    gradientLabel: 'Blue → Lavender',
    message: 'Ease into something manageable...',
    emptyMessage: 'No matching tasks — enjoy the calm.',
  },
  {
    level: 3,
    name: 'Hermes',
    label: 'Medium',
    description: 'Steady flow — balanced productivity',
    colorA: '#818cf8',
    colorB: '#c084fc',
    emoji: '🍰',
    gradientLabel: 'Indigo → Lilac',
    message: 'You\'re in a good rhythm. Try these...',
    emptyMessage: 'All clear — you\'re ahead of schedule!',
  },
  {
    level: 4,
    name: 'Apollo',
    label: 'High',
    description: 'Radiant energy — tackle demanding work',
    colorA: '#fdba74',
    colorB: '#fb923c',
    emoji: '💌',
    gradientLabel: 'Peach → Coral',
    message: 'You\'re shining! Take on something ambitious...',
    emptyMessage: 'No big tasks left — channel that energy elsewhere!',
  },
  {
    level: 5,
    name: 'Zeus',
    label: 'Very High',
    description: 'Peak power — conquer anything',
    colorA: '#2563eb',
    colorB: '#22d3ee',
    emoji: '🎬',
    gradientLabel: 'Cobalt → Cyan',
    message: 'You\'re on fire! Tackle the hardest tasks...',
    emptyMessage: 'Everything\'s done — you\'re unstoppable!',
  },
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
