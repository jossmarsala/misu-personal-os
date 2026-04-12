import { useEnergy } from '../context/EnergyContext';
import { ENERGY_LEVELS, getEnergyDef } from '../utils/energy';
import './EnergySelector.css';

export default function EnergySelector() {
  const { currentEnergy, setCurrentEnergy } = useEnergy();
  const current = getEnergyDef(currentEnergy);

  return (
    <div className="energy-selector" id="energy-selector">
      <span className="energy-selector__label">Current Energy</span>
      <div className="energy-selector__track">
        {ENERGY_LEVELS.map(e => (
          <button
            key={e.level}
            className={`energy-selector__btn ${currentEnergy === e.level ? 'active' : ''}`}
            onClick={() => setCurrentEnergy(e.level)}
            aria-label={`Set energy to ${e.label}`}
            title={`${e.name} — ${e.label}`}
          >
            <span className="energy-selector__btn-emoji">{e.emoji}</span>
            <span className="energy-selector__btn-level">{e.level}</span>
          </button>
        ))}
      </div>
      <div className="energy-selector__info">
        <div className="energy-selector__name">{current.name}</div>
        <div className="energy-selector__desc">{current.description}</div>
      </div>
    </div>
  );
}
