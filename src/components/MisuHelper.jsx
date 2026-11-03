import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Sparkles, Brain, Wind, X, Info } from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';
import { useLanguage } from '../context/LanguageContext';
import './MisuHelper.css';

// 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s
const PHASES = [
  { key: 'inhale', label: 'Inhale', duration: 4 },
  { key: 'hold',   label: 'Hold',   duration: 7 },
  { key: 'exhale', label: 'Exhale', duration: 8 },
];
const TOTAL_CYCLE = PHASES.reduce((s, p) => s + p.duration, 0); // 19s

function getPhaseAt(elapsed) {
  let t = elapsed % TOTAL_CYCLE;
  for (const phase of PHASES) {
    if (t < phase.duration) {
      return { 
        phase, 
        remaining: Math.max(1, Math.ceil(phase.duration - t)), 
        progress: t / phase.duration 
      };
    }
    t -= phase.duration;
  }
  return { phase: PHASES[0], remaining: PHASES[0].duration, progress: 0 };
}

function BreathingBar() {
  const { t } = useLanguage();
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    startRef.current = Date.now();
    const id = setInterval(() => {
      setElapsed((Date.now() - (startRef.current || Date.now())) / 1000);
    }, 50);
    return () => clearInterval(id);
  }, []);

  const { phase, remaining, progress } = getPhaseAt(elapsed);

  // Requirement:
  // Dot animation on inhale goes from 0 to 50,
  // stays in place at 50 for hold,
  // and then goes from 50 to 100 in exhale.
  let dotProgress = 0;
  if (phase.key === 'inhale') {
    dotProgress = Math.min(50, Math.max(0, progress * 50));
  } else if (phase.key === 'hold') {
    dotProgress = 50;
  } else if (phase.key === 'exhale') {
    dotProgress = Math.min(100, Math.max(50, 50 + progress * 50));
  }

  return (
    <div className="breath-bar-container">
      {/* Phase label + countdown */}
      <div className="breath-bar-header">
        <span className="breath-phase-label" data-phase={phase.key}>
          {t(`mindfulness.phase_${phase.key}`) || phase.label}
        </span>
        <span className="breath-phase-seconds">{remaining}s</span>
      </div>

      {/* Horizontal bar track */}
      <div className="breath-bar-track">
        <Motion.div
          className="breath-bar-fill"
          data-phase={phase.key}
          animate={{ width: `${dotProgress}%` }}
          transition={{
            duration: 0.05,
            ease: 'linear',
          }}
        />
        {/* Glowing dot at the leading edge */}
        <Motion.div
          className="breath-bar-dot"
          data-phase={phase.key}
          animate={{ left: `${dotProgress}%` }}
          transition={{ duration: 0.05, ease: 'linear' }}
        />
      </div>

      {/* Phase ticks */}
      <div className="breath-bar-phases">
        {PHASES.map((p) => (
          <span
            key={p.key}
            className={`breath-tick ${p.key === phase.key ? 'breath-tick--active' : ''}`}
          >
            {t(`mindfulness.phase_${p.key}`) || p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MisuHelper({ advice, visible, onClose, type = 'advice' }) {
  useEnergy();
  const { t } = useLanguage();

  const icons = {
    advice:      <Brain    size={18} className="misu-helper__icon" />,
    mindfulness: <Wind     size={18} className="misu-helper__icon" />,
    surprise:    <Sparkles size={18} className="misu-helper__icon" />,
    info:        <Info     size={18} className="misu-helper__icon" />,
  };

  const titles = {
    advice:      t('helper.advice') || 'Misu says',
    mindfulness: t('helper.mindfulness') || '4-7-8 Breathing',
    surprise:    t('helper.surprise') || 'Nice one ✨',
    info:        t('helper.info') || 'Quick tip',
  };

  return (
    <AnimatePresence>
      {visible && (
        <Motion.div
          className={`misu-helper misu-helper--${type}`}
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <div className="misu-helper__glow" />
          <div className="misu-helper__content">
            <div className="misu-helper__header">
              <div className="misu-helper__icon-container">
                {icons[type]}
              </div>
              <button 
                className="misu-helper__close" 
                onClick={() => onClose && onClose(false)}
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
            <div className="misu-helper__text">
              <h4 className="misu-helper__title">
                {titles[type] ?? 'Misu says'}
              </h4>
              <p className="misu-helper__desc">{advice}</p>
            </div>
            {type === 'mindfulness' && (
              <div className="misu-helper__visualizer">
                <BreathingBar />
              </div>
            )}
          </div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
