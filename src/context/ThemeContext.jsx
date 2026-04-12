import { createContext, useContext, useState, useEffect } from 'react';
import { loadTheme, saveTheme } from '../services/storage';

const ThemeContext = createContext();

export function ThemeProvider({ children, energyLevel }) {
  const [mode, setMode] = useState(() => loadTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    saveTheme(mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-energy', String(energyLevel));
  }, [energyLevel]);

  const toggleMode = () => {
    setMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
