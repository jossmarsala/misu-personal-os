import { useState, useEffect, useMemo, lazy, Suspense, useCallback } from 'react';
import { useEnergy } from './context/EnergyContext';
import { useTasks } from './context/TaskContext';
import { loadSettings, saveSettings } from './services/storage';
import { getEnergyDef } from './utils/energy';
import Header from './components/Header';
import TaskList from './components/TaskList';
import Recommendations from './components/Recommendations';
import EnergySelector from './components/EnergySelector';
import MosaicBackground from './components/MosaicBackground';
import CommandPalette from './components/CommandPalette';
import GlassIcons from './components/GlassIcons';
import MisuHelper from './components/MisuHelper';
import { useMindfulness } from './hooks/useMindfulness';
import { Clock, CheckCircle2, Timer, Music, Wind, Shield, Calendar, Command } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, KeyboardSensor, DragOverlay } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { playPop } from './utils/audio';
import { toInputDate, getWeekDays } from './utils/dateUtils';

// C3: Lazy-load heavy widgets to reduce initial bundle chunk size
const WeeklyPlanner = lazy(() => import('./components/WeeklyPlanner'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));
const PomodoroWidget = lazy(() => import('./components/PomodoroWidget'));
const MusicPlayer = lazy(() => import('./components/MusicPlayer'));
const DNDWidget = lazy(() => import('./components/DNDWidget'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const OnboardingTour = lazy(() => import('./components/OnboardingTour'));
import { useOnboarding } from './hooks/useOnboarding';

import './App.css';
function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [showDND, setShowDND] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const { currentEnergy, dndActive, breathingActive, setBreathingActive } = useEnergy();
  const { tasks, deleteTask, weeklyPlan, setWeeklyPlan } = useTasks();
  const { t } = useLanguage();
  const energyDef = getEnergyDef(currentEnergy);

  const { advice, helperVisible, helperType, setHelperVisible } = useMindfulness(showDND, showMusic, showPomodoro);
  const { showOnboarding, tourKey, finishOnboarding, replayOnboarding } = useOnboarding();

  // ── Shared DnD setup (spans task list + weekly planner) ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeDragTask, setActiveDragTask] = useState(null); // for DragOverlay

  const handleDragStart = useCallback((event) => {
    const { active } = event;
    if (active.data.current?.type === 'task-card') {
      setActiveDragTask(active.data.current.task);
    }
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveDragTask(null);
    if (!over) return;

    const activeType = active.data.current?.type;

    // ── Cross-zone: task card dropped onto a planner day ──
    if (activeType === 'task-card') {
      if (!weeklyPlan) return; // no plan — silently do nothing
      const targetDay = over.id; // must match a YYYY-MM-DD key
      if (!weeklyPlan[targetDay]) return;
      const task = active.data.current.task;
      const newBlock = {
        taskId: task.id,
        title: task.title,
        hours: task.estimatedHours || 1,
        isChunk: false,
        chunkLabel: '',
        dndId: `${targetDay}-${task.id}-manual-${Date.now()}`,
        energyRequired: task.energyRequired || 3,
      };
      setWeeklyPlan(prev => ({
        ...prev,
        [targetDay]: [...(prev[targetDay] || []), newBlock],
      }));
      playPop();
      return;
    }

    // ── Within planner: reorder blocks between days ──
    if (activeType === 'planner-block') {
      // Delegated to WeeklyPlanner's internal handler via event — handled below
      window.dispatchEvent(new CustomEvent('misu:planner-drag-end', { detail: event }));
    }
  }, [weeklyPlan, setWeeklyPlan]);

  // Handle commands emitted by CommandPalette via custom events
  useEffect(() => {
    const handler = (e) => {
      const { action } = e.detail;
      if (action === 'toggle-pomodoro') setShowPomodoro(p => !p);
      if (action === 'toggle-music') setShowMusic(p => !p);
      if (action === 'toggle-dnd') setShowDND(p => !p);
      if (action === 'toggle-calendar') setShowCalendar(p => !p);
      if (action === 'open-settings') setSettingsOpen(true);
      if (action === 'clear-completed') {
        tasks.filter(t => t.completed).forEach(t => deleteTask(t.id));
      }
    };
    window.addEventListener('misu:command', handler);
    return () => window.removeEventListener('misu:command', handler);
  }, [tasks, deleteTask]);

  const stats = useMemo(() => {
    const active = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);
    const totalHours = active.reduce((s, t) => s + (t.estimatedHours || 0), 0);
    return { active: active.length, completed: completed.length, totalHours };
  }, [tasks]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
    <div className={`app ${dndActive ? 'app--dnd-active' : ''}`}>
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <CommandPalette />

      {/* Widget toggle buttons — X2: Add Cmd+K hint */}
      <div className="widget-toggles">
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
        {/* X2: Keyboard shortcut hint — hidden on mobile/tablet via CSS */}
        <span className="widget-kbd-hint" style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
          <Command size={10} /><kbd style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px' }}>K</kbd>
        </span>
      </div>

      <main className="app__main">
        <div className="container" style={{ paddingBottom: '120px' }}>
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
            <div style={{ gridColumn: 'span 2' }}>
              {/* Hero card */}
              <motion.div
                className="bento-grid__hero bento-card bento-card--accent hero-card"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
              >
                <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
                  <MosaicBackground
                    colorA={energyDef.vividColorA}
                    colorB={energyDef.vividColorB}
                    colorC={
                      currentEnergy === 1 ? '#5BC9F5' : // Touch of Light Blue for energy 1
                      currentEnergy === 2 ? '#DC143C' : // Touch of Crimson Red for energy 2
                      currentEnergy === 4 ? '#8A2BE2' : // Touch of BlueViolet for energy 4
                      undefined
                    }
                    tileSize={20}
                    speed={0.35}
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
                </div>
                <div className="hero-card__energy">
                  <EnergySelector />
                </div>
              </motion.div>

            </div>

            {/* Tasks */}
            <motion.div
              className="bento-grid__tasks bento-card"
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
            >
              <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>
                <CheckCircle2 size={18} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--energy-primary)' }} />
                {t('tasks.title')}
              </h2>
              <TaskList />
            </motion.div>

            {/* Recommendations sidebar + mini stats */}
            <motion.div
              className="bento-grid__reco"
              variants={{
                hidden: { opacity: 0, x: 20 },
                show: { opacity: 1, x: 0 }
              }}
            >
              <div className="bento-card reco-card">
                <Recommendations />
              </div>
              <div className="stats-mini">
                <div className="stat-chip bento-card">
                  <span className="stat-chip__label">
                    <Clock size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                    {t('stats.hoursToGo')}
                  </span>
                  <span className="stat-chip__value">{stats.totalHours}</span>
                  <span className="stat-chip__hint">{stats.active} {t('stats.activeTasks')}</span>
                </div>
                <div className="stat-chip bento-card bento-card--gradient" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.55 }}>
                    <MosaicBackground
                      colorA={energyDef.vividColorB}
                      colorB={energyDef.vividColorA}
                      colorC={
                        currentEnergy === 1 ? '#5BC9F5' :
                        currentEnergy === 2 ? '#DC143C' :
                        currentEnergy === 4 ? '#8A2BE2' :
                        undefined
                      }
                      tileSize={40}
                      speed={0.18}
                    />
                  </div>
                  <span className="stat-chip__label" style={{ position: 'relative', zIndex: 1, color: '#000', textShadow: '0 1px 2px rgba(255, 255, 255, 0.3)' }}>
                    <CheckCircle2 size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                    {t('common.completed')}
                  </span>
                  <span className="stat-chip__value" style={{ position: 'relative', zIndex: 1, color: '#000', textShadow: '0 2px 6px rgba(255, 255, 255, 0.4)' }}>{stats.completed}</span>
                  <span className="stat-chip__hint" style={{ position: 'relative', zIndex: 1, color: '#000', textShadow: '0 1px 2px rgba(255, 255, 255, 0.3)' }}>{t('stats.tasksFinished')}</span>
                </div>
              </div>
            </motion.div>

            {/* Weekly Planner — C3: Lazy-loaded */}
            <motion.div
              className="bento-grid__planner bento-card"
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
            >
              <Suspense fallback={<div className="shimmer" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} />}>
                <WeeklyPlanner />
              </Suspense>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {settingsOpen && (
        <Suspense fallback={null}>
          <SettingsModal onClose={() => setSettingsOpen(false)} onReplayTour={() => { setSettingsOpen(false); replayOnboarding(); }} />
        </Suspense>
      )}

      {/* C3: Lazy-loaded Draggable Widgets */}
      <Suspense fallback={null}>
        <PomodoroWidget visible={showPomodoro} onClose={() => setShowPomodoro(false)} />
        <MusicPlayer visible={showMusic} />
        <DNDWidget visible={showDND} />
        <CalendarView visible={showCalendar} onClose={() => setShowCalendar(false)} />
      </Suspense>

      <MisuHelper
        visible={helperVisible}
        advice={t(advice) || ''}
        type={helperType}
        onClose={setHelperVisible}
      />

      {/* First-time onboarding tour */}
      <Suspense fallback={null}>
        {showOnboarding && <OnboardingTour key={tourKey} onFinish={finishOnboarding} />}
      </Suspense>

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

      {/* Drag overlay — shown while dragging a task card */}
      <DragOverlay dropAnimation={null}>
        {activeDragTask && (
          <div className="task-drag-ghost">
            <span className="task-drag-ghost__title">{activeDragTask.title}</span>
            <span className="task-drag-ghost__meta">{activeDragTask.estimatedHours || 1}h</span>
          </div>
        )}
      </DragOverlay>
    </div>
    </DndContext>
  );
}

export default App;
