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
import GradientBlinds from './components/GradientBlinds';
import CommandPalette from './components/CommandPalette';
import PomodoroWidget from './components/PomodoroWidget';
import MusicPlayer from './components/MusicPlayer';
import GlassIcons from './components/GlassIcons';
import DNDWidget from './components/DNDWidget';
import CalendarView from './components/CalendarView';
import MisuHelper from './components/MisuHelper';
import { useMindfulness } from './hooks/useMindfulness';
import { Clock, CheckCircle2, Timer, Music, Wind, Shield, Calendar } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const DEFAULT_API_KEY = 'AIzaSyD3FlFwMgIYzfPsqbdEUXp7Dkzw-tiG3RY';

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [showDND, setShowDND] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const { currentEnergy, dndActive, breathingActive, setBreathingActive } = useEnergy();
  const { tasks } = useTasks();
  const { t } = useLanguage();
  const energyDef = getEnergyDef(currentEnergy);

  const { advice, helperVisible, helperType, setHelperVisible } = useMindfulness(showDND);

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
    <div className={`app ${dndActive ? 'app--dnd-active' : ''}`}>
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <CommandPalette />

      {/* Widget toggle buttons via GlassIcons centered */}
      <div className="widget-toggles" style={{ display: 'flex', gap: '16px', fontSize: '10px', justifyContent: 'center', width: '100%', marginBottom: 'var(--space-2)' }}>
        <GlassIcons 
          items={[
            { 
              icon: <Timer size={20} />, 
              color: showPomodoro ? energyDef.colorA : 'gray', 
              label: t('widgets.focus'), 
              onClick: () => setShowPomodoro(!showPomodoro) 
            },
            { 
              icon: <Music size={20} />, 
              color: showMusic ? energyDef.colorA : 'gray', 
              label: t('widgets.audio'), 
              onClick: () => setShowMusic(!showMusic) 
            },
            { 
              icon: <Shield size={20} />, 
              color: showDND ? energyDef.colorA : 'gray', 
              label: t('settings.shield'), 
              onClick: () => setShowDND(!showDND) 
            },
            { 
              icon: <Calendar size={20} />, 
              color: showCalendar ? energyDef.colorA : 'gray', 
              label: t('widgets.calendar'), 
              onClick: () => setShowCalendar(!showCalendar) 
            }
          ]} 
          colorful={true}
          className="widget-glass-container"
        />
      </div>

      <main className="app__main">
        <div className="container" style={{ paddingBottom: 'var(--space-9)' }}>
          <motion.div 
            className="bento-grid"
            initial="hidden"
            animate="show"
            variants={{
              show: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {/* Hero card */}
            <motion.div 
              className="bento-grid__hero bento-card bento-card--accent hero-card"
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
            >
              <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 1.0, mixBlendMode: 'normal', pointerEvents: 'none' }}>
                <GradientBlinds
                  gradientColors={[energyDef.vividColorA, energyDef.vividColorB]}
                  angle={0}
                  noise={0.05}
                  blindCount={12}
                  blindMinWidth={50}
                  spotlightRadius={0.5}
                  spotlightSoftness={1}
                  spotlightOpacity={1}
                  mouseDampening={0.15}
                  distortAmount={0}
                  shineDirection="left"
                  mixBlendMode="lighten"
                />
              </div>
              <div className="hero-card__content">
                <motion.h2 
                  className="hero-card__title"
                  layoutId="hero-title"
                >
                  {t('hero.title')}{' '}
                  <span style={{ fontStyle: 'italic' }}>{t(`energy.${currentEnergy}.label`)}</span>{' '}
                  {t('hero.energySuffix')}
                </motion.h2>
                <p className="hero-card__subtitle">
                  {t(`energy.${currentEnergy}.desc`)}
                </p>
                <p className="hero-card__music-desc">
                  {t(`energy.${currentEnergy}.musicDesc`)}
                </p>
              </div>
              <div className="hero-card__energy">
                <EnergySelector />
              </div>
            </motion.div>

            {/* Stats row */}
            <motion.div 
              className="stats-row"
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
            >
              <div className="stat-card bento-card">
                <span className="stat-card__label">
                  <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {t('stats.hoursToGo')}
                </span>
                <span className="stat-card__value">{stats.totalHours}</span>
                <span className="stat-card__hint">{stats.active} {t('stats.activeTasks')}</span>
              </div>
              <div className="stat-card bento-card bento-card--gradient">
                <span className="stat-card__label" style={{ opacity: 0.7 }}>
                  <CheckCircle2 size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {t('common.completed')}
                </span>
                <span className="stat-card__value">{stats.completed}</span>
                <span className="stat-card__hint" style={{ opacity: 0.6 }}>{t('stats.tasksFinished')}</span>
              </div>
            </motion.div>

            {/* Recommendations sidebar */}
            <motion.div 
              className="bento-grid__reco bento-card reco-card"
              variants={{
                hidden: { opacity: 0, x: 20 },
                show: { opacity: 1, x: 0 }
              }}
            >
              <Recommendations />
            </motion.div>

            {/* Tasks */}
            <motion.div 
              className="bento-grid__tasks bento-card"
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
            >
              <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>{t('tasks.title')}</h2>
              <TaskList />
            </motion.div>

            {/* Weekly Planner */}
            <motion.div 
              className="bento-grid__planner bento-card"
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
            >
              <WeeklyPlanner />
            </motion.div>
          </motion.div>
        </div>
      </main>

      {settingsOpen && (
        <SettingsModal onClose={() => setSettingsOpen(false)} />
      )}
      
      {/* Draggable Widgets */}
      <PomodoroWidget visible={showPomodoro} onClose={() => setShowPomodoro(false)} />
      <MusicPlayer visible={showMusic} />
      <DNDWidget visible={showDND} />
      <CalendarView visible={showCalendar} onClose={() => setShowCalendar(false)} />
      
      <MisuHelper 
        visible={helperVisible} 
        advice={t(advice) || ''} 
        type={helperType}
        onClose={() => setHelperVisible(false)}
      />

      {/* Global SVG Filters for Gradient Orbs */}
      <svg style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}>
        <defs>
          <filter id="distort">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="15" />
          </filter>
          <filter id="pixelate">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" result="noise" />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" in2="noise" mode="soft-light" />
            
            {/* Color Quantization for Pixelated Look */}
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues="0 0.15 0.3 0.45 0.6 0.75 0.9 1" />
              <feFuncG type="discrete" tableValues="0 0.15 0.3 0.45 0.6 0.75 0.9 1" />
              <feFuncB type="discrete" tableValues="0 0.15 0.3 0.45 0.6 0.75 0.9 1" />
            </feComponentTransfer>
            
            {/* Mosaic Effect (Chunky Pixels) */}
            <feMorphology operator="dilate" radius="1.5" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

export default App;
