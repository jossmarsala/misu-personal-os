import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TaskProvider } from './context/TaskContext';
import { EnergyProvider } from './context/EnergyContext';
import { ThemeProvider } from './context/ThemeContext';
import { useEnergy } from './context/EnergyContext';
import App from './App';
import './index.css';

function ThemedApp() {
  const { currentEnergy } = useEnergy();
  return (
    <ThemeProvider energyLevel={currentEnergy}>
      <App />
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TaskProvider>
      <EnergyProvider>
        <ThemedApp />
      </EnergyProvider>
    </TaskProvider>
  </StrictMode>
);
