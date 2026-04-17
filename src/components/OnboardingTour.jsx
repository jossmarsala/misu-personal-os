import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, CheckSquare, Sparkles, LayoutGrid, Calendar, 
  GripVertical, ArrowRight, X, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ENERGY_LEVELS } from '../utils/energy';
import './OnboardingTour.css';

const STEPS = [
  {
    id: 'welcome',
    icon: Sparkles,
    color: 'var(--energy-vivid-a, #7c8fff)',
    illustrationKey: 'welcome',
  },
  {
    id: 'energy',
    icon: Zap,
    color: 'var(--energy-primary)',
    illustrationKey: 'energy',
  },
  {
    id: 'tasks',
    icon: CheckSquare,
    color: 'var(--energy-primary)',
    illustrationKey: 'tasks',
  },
  {
    id: 'recommendations',
    icon: LayoutGrid,
    color: 'var(--energy-primary)',
    illustrationKey: 'recommendations',
  },
  {
    id: 'widgets',
    icon: LayoutGrid,
    color: 'var(--energy-primary)',
    illustrationKey: 'widgets',
  },
  {
    id: 'planner',
    icon: Calendar,
    color: 'var(--energy-primary)',
    illustrationKey: 'planner',
  },
  {
    id: 'dnd',
    icon: GripVertical,
    color: 'var(--energy-primary)',
    illustrationKey: 'dnd',
  },
];

function WelcomeIllustration() {
  return (
    <div className="ob-illustration ob-illustration--welcome">
      <div className="ob-orb ob-orb--a" />
      <div className="ob-orb ob-orb--b" />
      <div className="ob-orb ob-orb--c" />
      <span className="ob-logo-text">misu</span>
    </div>
  );
}

function EnergyIllustration() {
  const colors = ['#B9D6C5', '#D770F3', '#4F67FF', '#FF5E3A'];
  const labels = ['1', '2', '3', '4'];
  return (
    <div className="ob-illustration ob-illustration--energy">
      {ENERGY_LEVELS.map((e, i) => (
        <div
          key={e.level}
          className="ob-energy-pill"
          style={{
            background: `linear-gradient(135deg, ${e.colorA}, ${e.vividColorA})`,
            animationDelay: `${i * 0.12}s`,
          }}
        >
          <span className="ob-energy-pill__num">{e.level}</span>
          <span className="ob-energy-pill__name">{e.name}</span>
        </div>
      ))}
    </div>
  );
}

function TaskIllustration() {
  return (
    <div className="ob-illustration ob-illustration--tasks">
      {[
        { w: '80%', label: 'Design mockups', bar: '60%' },
        { w: '65%', label: 'Write report', bar: '30%' },
        { w: '90%', label: 'Review PR', bar: '85%' },
      ].map((t, i) => (
        <div key={i} className="ob-task-row" style={{ animationDelay: `${i * 0.1}s` }}>
          <div className="ob-task-check" />
          <div className="ob-task-body">
            <div className="ob-task-name" style={{ width: t.w }}>{t.label}</div>
            <div className="ob-task-bar">
              <div className="ob-task-bar__fill" style={{ width: t.bar }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecommendationsIllustration() {
  return (
    <div className="ob-illustration ob-illustration--reco">
      <div className="ob-reco-card">
        <div className="ob-reco-icon">⚡</div>
        <div>
          <div className="ob-reco-title">Quick review</div>
          <div className="ob-reco-sub">~30 min · Energy 2</div>
        </div>
      </div>
      <div className="ob-reco-card" style={{ animationDelay: '0.1s' }}>
        <div className="ob-reco-icon">🎨</div>
        <div>
          <div className="ob-reco-title">Design mood board</div>
          <div className="ob-reco-sub">~1h · Energy 4</div>
        </div>
      </div>
    </div>
  );
}

function WidgetsIllustration() {
  const chips = [
    { emoji: '⏱', label: 'Pomodoro' },
    { emoji: '🎵', label: 'Music' },
    { emoji: '🛡', label: 'Focus Shield' },
    { emoji: '📅', label: 'Calendar' },
  ];
  return (
    <div className="ob-illustration ob-illustration--widgets">
      {chips.map((w, i) => (
        <div key={i} className="ob-widget-chip" style={{ animationDelay: `${i * 0.08}s` }}>
          <span>{w.emoji}</span>
          <span className="ob-widget-chip__label">{w.label}</span>
        </div>
      ))}
    </div>
  );
}

function PlannerIllustration() {
  const days = ['M', 'T', 'W', 'T', 'F'];
  const heights = [60, 85, 40, 70, 50];
  return (
    <div className="ob-illustration ob-illustration--planner">
      {days.map((d, i) => (
        <div key={i} className="ob-plan-col" style={{ animationDelay: `${i * 0.08}s` }}>
          <div className="ob-plan-bar" style={{ height: `${heights[i]}%` }} />
          <div className="ob-plan-day">{d}</div>
        </div>
      ))}
    </div>
  );
}

function DragIllustration() {
  return (
    <div className="ob-illustration ob-illustration--dnd">
      <div className="ob-drag-card ob-drag-card--lifted">
        <GripVertical size={14} style={{ opacity: 0.5 }} />
        <span>Finish report draft</span>
      </div>
      <div className="ob-drag-arrow">↓</div>
      <div className="ob-drag-target">
        <span>Drop here</span>
      </div>
    </div>
  );
}

const ILLUSTRATIONS = {
  welcome:         <WelcomeIllustration />,
  energy:          <EnergyIllustration />,
  tasks:           <TaskIllustration />,
  recommendations: <RecommendationsIllustration />,
  widgets:         <WidgetsIllustration />,
  planner:         <PlannerIllustration />,
  dnd:             <DragIllustration />,
};

export default function OnboardingTour({ onFinish }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const total = STEPS.length;
  const current = STEPS[step];
  const Icon = current.icon;

  const go = (delta) => {
    setDirection(delta);
    setStep(s => s + delta);
  };

  return (
    <div className="ob-overlay" role="dialog" aria-modal="true" aria-label="Onboarding tour">
      {/* Backdrop */}
      <div className="ob-backdrop" onClick={onFinish} />

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          className="ob-card"
          custom={direction}
          variants={{
            enter: d => ({ x: d > 0 ? 60 : -60, opacity: 0, scale: 0.97 }),
            center: { x: 0, opacity: 1, scale: 1 },
            exit:  d => ({ x: d > 0 ? -60 : 60, opacity: 0, scale: 0.97 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        >
          {/* Glow */}
          <div className="ob-glow" />

          {/* Skip */}
          <button className="ob-skip" onClick={onFinish} aria-label="Skip tour">
            <X size={16} />
          </button>

          {/* Illustration */}
          <div className="ob-illustration-wrap">
            {ILLUSTRATIONS[current.illustrationKey]}
          </div>

          {/* Icon badge */}
          <div className="ob-icon-badge">
            <Icon size={18} />
          </div>

          {/* Text */}
          <div className="ob-text">
            <h2 className="ob-title">{t(`onboarding.${current.id}.title`)}</h2>
            <p className="ob-desc">{t(`onboarding.${current.id}.desc`)}</p>
          </div>

          {/* Progress dots */}
          <div className="ob-dots" role="tablist" aria-label="Step progress">
            {STEPS.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === step}
                className={`ob-dot ${i === step ? 'ob-dot--active' : ''}`}
                onClick={() => { setDirection(i > step ? 1 : -1); setStep(i); }}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>

          {/* Nav */}
          <div className="ob-nav">
            {step > 0 ? (
              <button className="ob-btn ob-btn--ghost" onClick={() => go(-1)}>
                <ChevronLeft size={16} />
                {t('onboarding.back')}
              </button>
            ) : (
              <div />
            )}

            {step < total - 1 ? (
              <button className="ob-btn ob-btn--primary" onClick={() => go(1)}>
                {t('onboarding.next')}
                <ChevronRight size={16} />
              </button>
            ) : (
              <button className="ob-btn ob-btn--primary" onClick={onFinish}>
                {t('onboarding.finish')}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
