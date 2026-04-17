import { useEnergy } from '../context/EnergyContext';
import { playUISound } from '../services/AudioService';
import './GlassIcons.css';

// C4: gradientMapping removed — was dead code, color prop already receives hex from energyDef
const GlassIcons = ({ items, className, colorful = true }) => {
  const { currentEnergy } = useEnergy();
  
  const getBackgroundStyle = color => {
    if (!colorful) return { background: 'var(--energy-surface)' };
    return { background: color || 'var(--energy-primary)' };
  };

  return (
    <div className={`icon-btns ${className || ''}`}>
      {items.map((item, index) => (
        <button 
          key={index} 
          className={`icon-btn ${item.customClass || ''}`} 
          aria-label={item.label} 
          type="button"
          onClick={(e) => {
            playUISound('click', currentEnergy);
            item.onClick?.(e);
          }}
        >
          <span className="icon-btn__back" style={getBackgroundStyle(item.color)}></span>
          <span className="icon-btn__front">
            <span className="icon-btn__icon" aria-hidden="true">
              {item.icon}
            </span>
          </span>
          <span className="icon-btn__label">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default GlassIcons;
