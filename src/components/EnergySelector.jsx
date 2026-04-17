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
          animate={{ x: (currentEnergy - 1) * 60 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ width: '56px' }}
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
              size="32px" 
              style={{ 
                opacity: currentEnergy === e.level ? 1 : 0.6,
                transform: currentEnergy === e.level ? 'scale(1.1)' : 'scale(1)'
              }} 
            />
            <span style={{ 
              fontSize: '0.95rem', 
              fontWeight: '800', 
              color: currentEnergy === e.level ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
              textShadow: currentEnergy === e.level 
                ? '0 2px 8px rgba(0, 0, 0, 0.5)' 
                : '0 1px 4px rgba(0, 0, 0, 0.4)',
              marginTop: '-4px',
              transition: 'all 0.3s'
            }}>
              {e.level}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
