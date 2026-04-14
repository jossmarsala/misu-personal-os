import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Wind, X, Info } from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';
import './MisuHelper.css';

export default function MisuHelper({ advice, visible, onClose, type = 'advice' }) {
  const { currentEnergy } = useEnergy();

  const icons = {
    advice: <Brain size={18} className="misu-helper__icon" />,
    mindfulness: <Wind size={18} className="misu-helper__icon" />,
    surprise: <Sparkles size={18} className="misu-helper__icon" />,
    info: <Info size={18} className="misu-helper__icon" />
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
                {type === 'mindfulness' ? 'Respiración 4-7-8' : 'Misu Advice'}
              </h4>
              <p className="misu-helper__desc">{advice}</p>
            </div>
            {type === 'mindfulness' && (
              <div className="misu-helper__visualizer">
                <div className="misu-helper__circle" />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
