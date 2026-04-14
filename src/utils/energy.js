/* ═══════════════════════════════════════
   Energy level definitions, colors, and helper functions
   Music/Vibes-based energy system
   ═══════════════════════════════════════ */

export const ENERGY_LEVELS = [
  {
    level: 1,
    name: 'Whisper',
    label: 'Very Low',
    description: 'Ambient sounds — No music',
    colorA: '#B9C97B',
    colorB: '#D4E1CC',
    emoji: '🎮',
    gradientLabel: 'Sage → Mint',
    message: 'Take it easy. Something gentle for you...',
    emptyMessage: 'Nothing light enough — maybe just rest a little?',
  },
  {
    level: 2,
    name: 'Calm',
    label: 'Low',
    description: 'Soft nostalgic sounds — Piano',
    colorA: '#EED6FB',
    colorB: '#FEDDE6',
    emoji: '🌿',
    gradientLabel: 'Lavender → Rose',
    message: 'Ease into something manageable...',
    emptyMessage: 'No matching tasks — enjoy the calm.',
  },
  {
    level: 3,
    name: 'Rhythm',
    label: 'Medium',
    description: 'Lo-fi beats',
    colorA: '#8B98E3',
    colorB: '#F5C8E7',
    emoji: '🎧',
    gradientLabel: 'Periwinkle → Blush',
    message: 'Good rhythm going. Try these...',
    emptyMessage: 'All clear — you\'re ahead of schedule!',
  },
  {
    level: 4,
    name: 'Pulse',
    label: 'High',
    description: 'Animated beats',
    colorA: '#c9ada7',
    colorB: '#9a8c98',
    emoji: '🎸',
    gradientLabel: 'Dusty Rose → Mauve',
    message: 'Feeling inspired! Take on something creative...',
    emptyMessage: 'No big tasks left — channel that spark elsewhere!',
  },
  {
    level: 5,
    name: 'Peak',
    label: 'Very High',
    description: 'Old Jazz classics',
    colorA: '#8d99ae',
    colorB: '#2b2d42',
    emoji: '🎷',
    gradientLabel: 'Steel → Dark Blue',
    message: 'You\'re in the zone! Tackle the big ones...',
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
