import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Music, Shield, CalendarDays, X } from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';
import { getEnergyDef } from '../utils/energy';
import { useLanguage } from '../context/LanguageContext';
import { playPop } from '../utils/audio';
import './ToolsSheet.css';

const SHEET_VARIANTS = {
  hidden: { y: '100%', opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 340, damping: 32, mass: 0.9 },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: 0.22, ease: 'easeIn' },
  },
};

const BACKDROP_VARIANTS = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
};

export default function ToolsSheet({
  open,
  onClose,
  showPomodoro, onTogglePomodoro,
  showMusic,    onToggleMusic,
  showDND,      onToggleDND,
  showCalendar, onToggleCalendar,
}) {
  const { currentEnergy } = useEnergy();
  const energyDef = getEnergyDef(currentEnergy);
  const { t } = useLanguage();
  const sheetRef = useRef(null);

  // Close on backdrop click / Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const tools = [
    {
      id: 'pomodoro',
      icon: Timer,
      label: t('widgets.focus'),
      active: showPomodoro,
      onToggle: () => { playPop(); onTogglePomodoro(); onClose(); },
      color: energyDef.colorA,
    },
    {
      id: 'music',
      icon: Music,
      label: t('widgets.audio'),
      active: showMusic,
      onToggle: () => { playPop(); onToggleMusic(); onClose(); },
      color: energyDef.colorA,
    },
    {
      id: 'dnd',
      icon: Shield,
      label: t('settings.shield'),
      active: showDND,
      onToggle: () => { playPop(); onToggleDND(); },
      color: energyDef.colorA,
    },
    {
      id: 'calendar',
      icon: CalendarDays,
      label: t('widgets.calendar'),
      active: showCalendar,
      onToggle: () => { playPop(); onToggleCalendar(); onClose(); },
      color: energyDef.colorA,
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="tools-sheet__backdrop"
            variants={BACKDROP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            className="tools-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Tools"
            variants={SHEET_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Handle */}
            <div className="tools-sheet__handle" />

            {/* Header */}
            <div className="tools-sheet__header">
              <h3 className="tools-sheet__title">
                {t('widgets.tools') || 'Tools'}
              </h3>
              <button
                className="tools-sheet__close btn btn-ghost btn-icon"
                onClick={onClose}
                aria-label="Close tools"
              >
                <X size={18} />
              </button>
            </div>

            {/* Grid of tool buttons */}
            <div className="tools-sheet__grid">
              {tools.map(({ id, icon: Icon, label, active, onToggle, color }) => (
                <button
                  key={id}
                  className={`tools-sheet__tool${active ? ' tools-sheet__tool--active' : ''}`}
                  onClick={onToggle}
                  aria-pressed={active}
                  style={active ? {
                    '--tool-color': color,
                    background: `${color}22`,
                    borderColor: `${color}55`,
                  } : {}}
                >
                  <span
                    className="tools-sheet__tool-icon"
                    style={active ? { color } : {}}
                  >
                    <Icon size={26} strokeWidth={active ? 2.2 : 1.6} />
                  </span>
                  <span className="tools-sheet__tool-label">{label}</span>
                  <span className={`tools-sheet__tool-badge${active ? ' tools-sheet__tool-badge--on' : ''}`}>
                    {active ? (t('common.on') || 'On') : (t('common.off') || 'Off')}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
