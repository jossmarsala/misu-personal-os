import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TaskProvider } from './context/TaskContext';
import { EnergyProvider } from './context/EnergyContext';
import { ThemeProvider } from './context/ThemeContext';
import { useEnergy } from './context/EnergyContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import App from './App';
import './index.css';

function AuthGate() {
  const { user } = useAuth();
  if (!user) return <AuthPage />;
  
  return (
    <TaskProvider>
      <EnergyProvider>
        <ThemedApp />
      </EnergyProvider>
    </TaskProvider>
  );
}

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
    <LanguageProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>
);
