import { useState, useEffect, useMemo } from 'react';
import { useEnergy } from './context/EnergyContext';
import { useTasks } from './context/TaskContext';
import { loadSettings, saveSettings } from './services/storage';
import { getEnergyDef } from './utils/energy';
import Header from './components/Header';
import TaskList from './components/TaskList';
import Recommendations from './components/Recommendations';
import WeeklyPlanner from './components/WeeklyPlanner';
import SettingsModal from './components/SettingsModal';
import EnergySelector from './components/EnergySelector';
import PrismaticBurst from './components/PrismaticBurst';
import { Clock, CheckCircle2 } from 'lucide-react';
import './App.css';

const DEFAULT_API_KEY = 'AIzaSyD3FlFwMgIYzfPsqbdEUXp7Dkzw-tiG3RY';

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { currentEnergy } = useEnergy();
  const { tasks } = useTasks();
  const energyDef = getEnergyDef(currentEnergy);

  useEffect(() => {
    const settings = loadSettings();
    if (!settings.geminiApiKey) {
      saveSettings({ ...settings, geminiApiKey: DEFAULT_API_KEY });
    }
  }, []);

  const stats = useMemo(() => {
    const active = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);
    const totalHours = active.reduce((s, t) => s + (t.estimatedHours || 0), 0);
    return { active: active.length, completed: completed.length, totalHours };
  }, [tasks]);

  return (
    <div className="app">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <main className="app__main">
        <div className="container">
          <div className="bento-grid">
            {/* Hero card */}
            <div className="bento-grid__hero bento-card bento-card--accent hero-card">
              <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.85, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
                <PrismaticBurst
                  animationType="rotate3d"
                  intensity={2.5}
                  speed={0.5}
                  distort={0}
                  paused={false}
                  offset={{ x: 0, y: 0 }}
                  hoverDampness={0.25}
                  rayCount={0}
                  mixBlendMode="lighten"
                  colors={[energyDef.colorA, energyDef.colorB, '#ffffff']}
                />
              </div>
              <div className="hero-card__content">
                <h2 className="hero-card__title">
                  Manage your tasks with{' '}
                  <span style={{ fontStyle: 'italic' }}>{energyDef.name}</span>{' '}
                  energy.
                </h2>
                <p className="hero-card__subtitle">
                  {energyDef.description}. Misu adapts to your energy level for smarter productivity.
                </p>
              </div>
              <div className="hero-card__energy">
                <EnergySelector />
              </div>
            </div>

            {/* Stats row */}
            <div className="stats-row">
              <div className="stat-card bento-card">
                <span className="stat-card__label">
                  <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Hours to go
                </span>
                <span className="stat-card__value">{stats.totalHours}</span>
                <span className="stat-card__hint">{stats.active} active tasks remaining</span>
              </div>
              <div className="stat-card bento-card bento-card--gradient">
                <span className="stat-card__label" style={{ opacity: 0.7 }}>
                  <CheckCircle2 size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Completed
                </span>
                <span className="stat-card__value">{stats.completed}</span>
                <span className="stat-card__hint" style={{ opacity: 0.6 }}>tasks finished</span>
              </div>
            </div>

            {/* Recommendations sidebar */}
            <div className="bento-grid__reco">
              <Recommendations />
            </div>

            {/* Tasks */}
            <div className="bento-grid__tasks bento-card">
              <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>Tasks</h2>
              <TaskList />
            </div>

            {/* Weekly Planner */}
            <div className="bento-grid__planner">
              <WeeklyPlanner />
            </div>
          </div>
        </div>
      </main>

      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}

export default App;
