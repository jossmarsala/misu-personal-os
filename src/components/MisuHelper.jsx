import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Sparkles, Brain, Wind, X, Info } from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';
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
      return { phase, remaining: phase.duration - Math.floor(t), progress: t / phase.duration };
    }
    t -= phase.duration;
  }
  return { phase: PHASES[0], remaining: PHASES[0].duration, progress: 0 };
}

function BreathingBar() {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((Date.now() - startRef.current) / 1000);
    }, 100);
    return () => clearInterval(id);
  }, []);

  const { phase, remaining, progress } = getPhaseAt(elapsed);

  // Bar fills in on inhale/hold, drains on exhale
  const barProgress = phase.key === 'exhale' ? 1 - progress : progress;

  return (
    <div className="breath-bar-container">
      {/* Phase label + countdown */}
      <div className="breath-bar-header">
        <span className="breath-phase-label" data-phase={phase.key}>
          {phase.label}
        </span>
        <span className="breath-phase-seconds">{remaining}s</span>
      </div>

      {/* Horizontal bar track */}
      <div className="breath-bar-track">
        <motion.div
          className="breath-bar-fill"
          data-phase={phase.key}
          animate={{ width: `${barProgress * 100}%` }}
          transition={{
            duration: 0.1,
            ease: 'linear',
          }}
        />
        {/* Glowing dot at the leading edge */}
        <motion.div
          className="breath-bar-dot"
          data-phase={phase.key}
          animate={{ left: `${barProgress * 100}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      </div>

      {/* Phase ticks */}
      <div className="breath-bar-phases">
        {PHASES.map((p) => (
          <span
            key={p.key}
            className={`breath-tick ${p.key === phase.key ? 'breath-tick--active' : ''}`}
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MisuHelper({ advice, visible, onClose, type = 'advice' }) {
  const { currentEnergy } = useEnergy();

  const icons = {
    advice:      <Brain    size={18} className="misu-helper__icon" />,
    mindfulness: <Wind     size={18} className="misu-helper__icon" />,
    surprise:    <Sparkles size={18} className="misu-helper__icon" />,
    info:        <Info     size={18} className="misu-helper__icon" />,
  };

  const titles = {
    advice:      'Misu says',
    mindfulness: '4-7-8 Breathing',
    surprise:    'Nice one ✨',
    info:        'Quick tip',
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
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
              <button className="misu-helper__close" onClick={onClose}>
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}

