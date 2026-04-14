import { useEnergy } from '../context/EnergyContext';
import { ENERGY_LEVELS, getEnergyDef } from '../utils/energy';
import { useLanguage } from '../context/LanguageContext';
import { playTick } from '../utils/audio';
import './EnergySelector.css';

export default function EnergySelector() {
  const { currentEnergy, setCurrentEnergy } = useEnergy();
  const { t } = useLanguage();
  const current = getEnergyDef(currentEnergy);

  return (
    <div className="energy-selector" id="energy-selector">
      <span className="energy-selector__label">{t('header.currentEnergy')}</span>
      <div className="energy-selector__track" style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {ENERGY_LEVELS.map(e => (
          <button
            key={e.level}
            className={`btn btn-icon ${currentEnergy === e.level ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => {
              setCurrentEnergy(e.level);
              playTick();
            }}
            aria-label={`${t('header.currentEnergy')} ${t(`energy.${e.level}.label`)}`}
            title={t(`energy.${e.level}.label`)}
            style={{ width: '42px', height: '42px', flexDirection: 'column', gap: '2px' }}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: '1' }}>{e.emoji}</span>
            <span style={{ fontSize: '0.5rem', fontWeight: '700', opacity: currentEnergy===e.level ? 1 : 0.6 }}>{e.level}</span>
          </button>
        ))}
      </div>
      <div className="energy-selector__info">
        <div className="energy-selector__name">{t(`energy.${currentEnergy}.label`)}</div>
        <div className="energy-selector__desc">{t(`energy.${currentEnergy}.desc`)}</div>
      </div>
    </div>
  );
}
