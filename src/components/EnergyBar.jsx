import { useMemo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { getEnergyDef } from '../utils/energy';
import { useMotivationalMessage } from '../hooks/useMotivationalMessage';
import MosaicBackground from './MosaicBackground';
import EnergySelector from './EnergySelector';
import './EnergyBar.css';

export default function EnergyBar({ isMobile = false, dndActive = false }) {
  const { currentEnergy } = useEnergy();
  const { tasks } = useTasks();
  const { t } = useLanguage();

  const energyDef = useMemo(() => getEnergyDef(currentEnergy), [currentEnergy]);

  const { activeMessage, dismissMessage } = useMotivationalMessage({
    tasks,
    currentEnergy,
    t,
  });

  const colorC = useMemo(() => {
    if (currentEnergy === 1) return '#5BC9F5'; // Touch of Light Blue for energy 1
    if (currentEnergy === 2) return '#DC143C'; // Touch of Crimson Red for energy 2
    if (currentEnergy === 4) return '#8A2BE2'; // Touch of BlueViolet for energy 4
    return undefined;
  }, [currentEnergy]);

  const content = (
    <>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <MosaicBackground
          colorA={energyDef.vividColorA}
          colorB={energyDef.vividColorB}
          colorC={colorC}
          tileSize={isMobile ? 18 : 20}
          speed={dndActive ? 0.04 : 0.35}
        />
      </div>

      <div className="hero-card__content" style={{ position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {activeMessage ? (
            <Motion.div
              key={`motivational-${activeMessage.type}`}
              className="hero-card__motivational"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <h2 className="hero-card__title hero-card__title--motivational">
                {activeMessage.title}
              </h2>
              <p className="hero-card__subtitle hero-card__subtitle--motivational">
                {activeMessage.desc}
              </p>
              <div className="hero-card__motivational-actions">
                <button
                  type="button"
                  onClick={dismissMessage}
                  className="hero-card__motivational-dismiss"
                  title={t('motivational.viewEnergy')}
                  aria-label={t('motivational.viewEnergy')}
                >
                  <X size={12} />
                  <span>{t('motivational.viewEnergy')}</span>
                </button>
              </div>
            </Motion.div>
          ) : (
            <Motion.div
              key={`energy-${currentEnergy}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <h2 className="hero-card__title">
                {t('hero.title')}{' '}
                <span style={{ fontStyle: 'italic' }}>{t(`energy.${currentEnergy}.label`)}</span>{' '}
                {t('hero.energySuffix')}
              </h2>
              <p className="hero-card__subtitle">
                {t(`energy.${currentEnergy}.desc`)}
              </p>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="hero-card__energy" style={{ position: 'relative', zIndex: 1 }}>
        <EnergySelector />
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="bento-card bento-card--accent hero-card mobile-hero-card">
        {content}
      </div>
    );
  }

  return (
    <Motion.div
      className="bento-grid__hero bento-card bento-card--accent hero-card"
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
    >
      {content}
    </Motion.div>
  );
}
