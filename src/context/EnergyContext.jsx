import { createContext, useContext, useState, useEffect } from 'react';
import { loadEnergy, saveEnergy } from '../services/storage';

const EnergyContext = createContext();

export function EnergyProvider({ children }) {
  const [currentEnergy, setCurrentEnergy] = useState(() => loadEnergy());

  useEffect(() => {
    saveEnergy(currentEnergy);
  }, [currentEnergy]);

  return (
    <EnergyContext.Provider value={{ currentEnergy, setCurrentEnergy }}>
      {children}
    </EnergyContext.Provider>
  );
}

export function useEnergy() {
  const ctx = useContext(EnergyContext);
  if (!ctx) throw new Error('useEnergy must be used within EnergyProvider');
  return ctx;
}
