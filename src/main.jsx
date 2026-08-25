import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { TaskProvider } from './context/TaskContext';
import { EnergyProvider } from './context/EnergyContext';
import { ThemeProvider } from './context/ThemeContext';
import { useEnergy } from './context/EnergyContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import SplashScreen from './components/SplashScreen';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import sampleTasks from './data/sample-tasks.json';
import './index.css';

/** Resolve __TODAY__, __TOMORROW__, __IN3DAYS__ placeholders → real YYYY-MM-DD strings */
function resolveSampleDates(tasks) {
  const pad = n => String(n).padStart(2, '0');
  const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const in3Days  = new Date(today); in3Days.setDate(today.getDate() + 3);

  const MAP = {
    '__TODAY__':   toDateStr(today),
    '__TOMORROW__': toDateStr(tomorrow),
    '__IN3DAYS__':  toDateStr(in3Days),
  };

  return tasks.map(task => ({
    ...task,
    deadline: MAP[task.deadline] ?? task.deadline,
  }));
}


// 🐛 Debug mode — auto-enabled on localhost, bypasses auth + seeds sample tasks
const IS_DEBUG = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Tiny floating badge shown only in debug mode — always renders in the OPPOSITE theme
function DebugBadge() {
  const [dismissed, setDismissed] = useState(false);
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'dark'
  );

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  if (!IS_DEBUG || dismissed) return null;

  const oppositeTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <div
      data-theme={oppositeTheme}
      onClick={() => setDismissed(true)}
      title="Debug mode: no login required. Click to dismiss."
      style={{
        position: 'fixed',
        bottom: '18px',
        left: '18px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: '8px 14px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--bg-overlay)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-md)',
        cursor: 'pointer',
        userSelect: 'none',
        fontSize: '12px',
        fontFamily: "'Outfit', -apple-system, sans-serif",
        fontWeight: 600,
        color: 'var(--text-primary)',
        letterSpacing: '0.03em',
        transition: 'all var(--transition-fast)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = 'var(--text-secondary)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--text-primary)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Small status dot — energy color from opposite theme context */}
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'var(--energy-primary-vivid, var(--energy-primary))',
        flexShrink: 0,
        opacity: 1,
      }} />
      DEBUG MODE
    </div>
  );
}



function AuthGate() {
  const { user } = useAuth();

  // 🐛 Debug mode: skip login entirely, seed with sample tasks
  if (IS_DEBUG) {
    return (
      <TaskProvider initialTasks={resolveSampleDates(sampleTasks.tasks)}>
        <ThemedApp />
      </TaskProvider>
    );
  }

  if (!user) return <AuthPage />;
  
  return (
    <TaskProvider>
      <ThemedApp />
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

// Chequeo de las 8 horas — síncrono, fuera de React
function shouldShowSplash() {
  if (IS_DEBUG) return true; // En dev siempre mostrar el splash
  const LAST_LOAD_KEY = 'misu:lastLoadTime';
  const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
  const now = Date.now();
  const last = localStorage.getItem(LAST_LOAD_KEY);
  if (!last || now - parseInt(last, 10) > EIGHT_HOURS_MS) {
    localStorage.setItem(LAST_LOAD_KEY, now.toString());
    return true;
  }
  return false;
}

// Wrapper que gestiona el splash antes de montar la app completa
function AppWithSplash() {
  const [appReady, setAppReady] = useState(false);
  // splashDone arranca en true si no toca mostrar el splash:
  // SplashScreen NUNCA se monta → cero frames de flash
  const [splashDone, setSplashDone] = useState(() => !shouldShowSplash());

  // Marcar como listo en el siguiente frame tras el primer render
  useEffect(() => {
    const id = requestAnimationFrame(() => setAppReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      {!splashDone && (
        <SplashScreen appReady={appReady} onDone={() => setSplashDone(true)} />
      )}
      <ErrorBoundary>
        <LanguageProvider>
          <AuthProvider>
            <EnergyProvider>
              <AuthGate />
            </EnergyProvider>
          </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
      <DebugBadge />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWithSplash />
  </StrictMode>
);

