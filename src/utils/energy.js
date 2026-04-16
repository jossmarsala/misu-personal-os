/* ═══════════════════════════════════════
   Energy level definitions, colors, and helper functions
   Music/Vibes-based energy system
   ═══════════════════════════════════════ */

export const ENERGY_LEVELS = [
  {
    level: 1,
    name: 'Whisper',
    label: 'Very Low',
    description: 'A moment for deep rest and recovery',
    colorA: '#B9C97B',
    colorB: '#D4E1CC',
    vividColorA: '#A4D431',
    vividColorB: '#DFFFCD',
    gradientLabel: 'Sage → Mint',
    message: 'Take it easy. Something gentle for you...',
    emptyMessage: 'Nothing light enough — maybe just rest a little?',
  },
  {
    level: 2,
    name: 'Calm',
    label: 'Low',
    description: 'Gentle focus for light and easy tasks',
    colorA: '#EED6FB',
    colorB: '#FEDDE6',
    vividColorA: '#D770F3',
    vividColorB: '#FFB7FF',
    gradientLabel: 'Lavender → Rose',
    message: 'Ease into something manageable...',
    emptyMessage: 'No matching tasks — enjoy the calm.',
  },
  {
    level: 3,
    name: 'Rhythm',
    label: 'Medium',
    description: 'Steady rhythm for fluid productivity',
    colorA: '#8B98E3',
    colorB: '#F5C8E7',
    vividColorA: '#4F67FF',
    vividColorB: '#FF99E2',
    gradientLabel: 'Periwinkle → Blush',
    message: 'Good rhythm going. Try these...',
    emptyMessage: 'All clear — you\'re ahead of schedule!',
  },
  {
    level: 4,
    name: 'Pulse',
    label: 'High',
    description: 'High creative spark and mental drive',
    colorA: '#F8AD9D',
    colorB: '#FFDAB9',
    vividColorA: '#FF5E3A',
    vividColorB: '#FFAC71',
    gradientLabel: 'Melon → Peach',
    message: 'Feeling inspired! Take on something creative...',
    emptyMessage: 'No big tasks left — channel that spark elsewhere!',
  },
  {
    level: 5,
    name: 'Peak',
    label: 'Very High',
    description: 'Full power for your biggest challenges',
    colorA: '#81d4fa',
    colorB: '#fff176',
    vividColorA: '#00D2FF',
    vividColorB: '#FFE100',
    gradientLabel: 'Soft Blue → Yellow',
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
