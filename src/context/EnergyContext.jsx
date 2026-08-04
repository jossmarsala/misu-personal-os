import { createContext, useContext, useState, useEffect } from 'react';
import { loadEnergy, saveEnergy } from '../services/storage';

const EnergyContext = createContext();

export function EnergyProvider({ children }) {
  const [currentEnergy, setCurrentEnergy] = useState(() => loadEnergy());
  const [dndActive, setDndActive] = useState(false);
  const [breathingActive, setBreathingActive] = useState(false);
  // Shield one-task focus: id of the task currently spotlighted (null = first active)
  const [focusedTaskId, setFocusedTaskId] = useState(null);

  useEffect(() => {
    saveEnergy(currentEnergy);
  }, [currentEnergy]);

  // Clear focused task when shield turns off
  useEffect(() => {
    if (!dndActive) setFocusedTaskId(null);
  }, [dndActive]);

  return (
    <EnergyContext.Provider value={{ 
      currentEnergy, 
      setCurrentEnergy,
      dndActive,
      setDndActive,
      breathingActive,
      setBreathingActive,
      focusedTaskId,
      setFocusedTaskId,
    }}>
      {children}
    </EnergyContext.Provider>
  );
}

export function useEnergy() {
  const ctx = useContext(EnergyContext);
  if (!ctx) throw new Error('useEnergy must be used within EnergyProvider');
  return ctx;
}
