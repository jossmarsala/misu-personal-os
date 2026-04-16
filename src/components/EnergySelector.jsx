import { useEnergy } from '../context/EnergyContext';
import { ENERGY_LEVELS, getEnergyDef } from '../utils/energy';
import { useLanguage } from '../context/LanguageContext';
import { playTick } from '../utils/audio';
import { motion, AnimatePresence } from 'framer-motion';
import GradientOrb from './GradientOrb';
import './EnergySelector.css';

export default function EnergySelector() {
  const { currentEnergy, setCurrentEnergy } = useEnergy();
  const { t } = useLanguage();

  return (
    <div className="energy-selector" id="energy-selector">
      <span className="energy-selector__label">{t('header.currentEnergy')}</span>
      
      <div className="energy-selector__track">
        <motion.div 
          className="energy-selector__highlight"
          animate={{ x: (currentEnergy - 1) * 48 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ width: '44px' }}
        />
        
        {ENERGY_LEVELS.map(e => (
          <button
            key={e.level}
            className="energy-selector__btn"
            onClick={() => {
              setCurrentEnergy(e.level);
              playTick();
            }}
            aria-label={`${t('header.currentEnergy')} ${t(`energy.${e.level}.label`)}`}
            title={t(`energy.${e.level}.label`)}
          >
            <GradientOrb 
              color={e.vividColorA} 
              size="24px" 
              style={{ 
                opacity: currentEnergy === e.level ? 1 : 0.6,
                transform: currentEnergy === e.level ? 'scale(1.1)' : 'scale(1)'
              }} 
            />
            <span style={{ 
              fontSize: '0.6rem', 
              fontWeight: '800', 
              opacity: currentEnergy === e.level ? 1 : 0.4,
              color: currentEnergy === e.level ? 'white' : 'inherit',
              marginTop: '-4px'
            }}>
              {e.level}
            </span>
          </button>
        ))}
      </div>

      <div className="energy-selector__info">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentEnergy}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            <div className="energy-selector__name">{t(`energy.${currentEnergy}.label`)}</div>
            <div className="energy-selector__desc">{t(`energy.${currentEnergy}.desc`)}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
