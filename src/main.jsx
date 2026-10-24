import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { TaskProvider } from './context/TaskContext';
import { EnergyProvider } from './context/EnergyContext';
import { ThemeProvider } from './context/ThemeContext';
import { useEnergy } from './context/EnergyContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
import SplashScreen from './components/SplashScreen';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import sampleTasks from './data/sample-tasks.json';
import { LogOut, Sparkles } from 'lucide-react';
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

// Floating badge shown only when exploring in Live Demo mode — always renders in the OPPOSITE theme
function DemoBadge() {
  const { isDemo, exitDemo } = useAuth();
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(false);
  const [theme, setTheme] = useState(
    () => (typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') || 'dark' : 'dark')
  );

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  if (!isDemo || dismissed) return null;

  const oppositeTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <div
      data-theme={oppositeTheme}
      className="demo-floating-badge"
      title={t('auth.demoNotice') || 'Live demonstration only · Changes will not be saved'}
      style={{
        position: 'fixed',
        bottom: '18px',
        left: '18px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px 8px 14px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--bg-overlay)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-md)',
        fontSize: '12px',
        fontFamily: "'Outfit', -apple-system, sans-serif",
        fontWeight: 600,
        color: 'var(--text-primary)',
        letterSpacing: '0.03em',
        transition: 'all var(--transition-fast)',
        maxWidth: 'calc(100vw - 36px)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        <Sparkles size={13} style={{ color: 'var(--energy-primary)' }} />
        <span>{t('auth.demoBadge') || 'LIVE DEMO'}</span>
      </span>
      <span style={{ opacity: 0.3, flexShrink: 0 }}>·</span>
      <span
        style={{
          fontSize: '11px',
          fontWeight: 400,
          color: 'var(--text-secondary)',
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '280px',
        }}
      >
        {t('auth.demoNotice') || 'Changes will not be saved'}
      </span>
      <span style={{ opacity: 0.3, flexShrink: 0 }}>|</span>
      <button
        onClick={exitDemo}
        type="button"
        title="Exit Demo and return to sign-in page"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--energy-primary)',
          fontWeight: 700,
          cursor: 'pointer',
          padding: '2px 4px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11px',
          letterSpacing: '0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontFamily: 'inherit',
        }}
      >
        <LogOut size={12} />
        {t('auth.exitDemo') || 'Exit Demo'}
      </button>
      <button
        onClick={() => setDismissed(true)}
        type="button"
        aria-label="Dismiss badge"
        title="Dismiss"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-tertiary)',
          cursor: 'pointer',
          padding: '0 2px',
          display: 'flex',
          alignItems: 'center',
          fontSize: '14px',
          lineHeight: 1,
          opacity: 0.7,
        }}
      >
        ×
      </button>
    </div>
  );
}

function AuthGate() {
  const { user, isDemo } = useAuth();

  // 🚀 Live Demo mode: skip login entirely, seed with sample tasks
  if (isDemo) {
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
              <DemoBadge />
            </EnergyProvider>
          </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWithSplash />
  </StrictMode>
);

