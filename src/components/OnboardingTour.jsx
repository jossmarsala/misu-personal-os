import { useCallback } from 'react';
import { Joyride, ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, X, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './OnboardingTour.css';

// ── Step definitions ──────────────────────────────────────────
// Natural page flow: energy system → task creation → recommendations → planner
function getSteps(t) {
  return [
    {
      // Step 1 — The energy system: explain all 4 levels
      target: '#energy-selector',
      content: t('tour.energy.content'),
      title: t('tour.energy.title'),
      placement: 'bottom',
      skipBeacon: true,
      spotlightPadding: 16,
    },
    {
      // Step 2 — Create first task
      target: '#add-task-btn',
      content: t('tour.tasks.content'),
      title: t('tour.tasks.title'),
      placement: 'bottom',
      skipBeacon: true,
      spotlightPadding: 12,
    },
    {
      // Step 3 — "What can I do now?" energy-matched recommendations
      target: '.reco-card',
      content: t('tour.reco.content'),
      title: t('tour.reco.title'),
      placement: 'left',
      skipBeacon: true,
      spotlightPadding: 10,
    },
    {
      // Step 4 — Widget toolbar (Pomodoro, Music, Focus Shield, Calendar)
      target: '.widget-glass-container',
      content: t('tour.widgets.content'),
      title: t('tour.widgets.title'),
      placement: 'bottom',
      skipBeacon: true,
      spotlightPadding: 10,
    },
    {
      // Step 5 — Weekly planner & AI scheduling
      target: '#weekly-planner',
      content: t('tour.planner.content'),
      title: t('tour.planner.title'),
      placement: 'top',
      skipBeacon: true,
      spotlightPadding: 10,
    },
  ];
}

// ── Energy level pills (shown inside step 1 tooltip) ─────────
const ENERGY_PILLS = [
  { level: 1, label: 'Whisper', labelEs: 'Susurro', labelIt: 'Sussurro', color: '#60a5fa', desc: 'Rest & recovery' },
  { level: 2, label: 'Calm',    labelEs: 'Calma',   labelIt: 'Calma',    color: '#34d399', desc: 'Light work' },
  { level: 3, label: 'Rhythm',  labelEs: 'Ritmo',   labelIt: 'Ritmo',    color: '#f59e0b', desc: 'Steady output' },
  { level: 4, label: 'Pulse',   labelEs: 'Impulso', labelIt: 'Impulso',  color: '#f87171', desc: 'Full power' },
];

// ── Custom Tooltip Component ─────────────────────────────────
function MisuTooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  size,
  isLastStep,
}) {
  const progress = ((index + 1) / size) * 100;
  const isEnergyStep = index === 0;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        {...tooltipProps}
        className="joyride-tooltip"
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        key={index}
      >
        {/* Glow accent */}
        <div className="joyride-tooltip__glow" />

        {/* Skip / Close */}
        <button className="joyride-tooltip__close" {...closeProps} aria-label="Close tour">
          <X size={14} />
        </button>

        {/* Progress bar */}
        <div className="joyride-tooltip__progress-track">
          <motion.div
            className="joyride-tooltip__progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        {/* Step counter chip */}
        <div className="joyride-tooltip__step-chip">
          <Sparkles size={10} />
          <span>{index + 1} / {size}</span>
        </div>

        {/* Title */}
        {step.title && (
          <h3 className="joyride-tooltip__title">{step.title}</h3>
        )}

        {/* Content */}
        <p className="joyride-tooltip__content">{step.content}</p>

        {/* Energy pills — only on step 1 */}
        {isEnergyStep && (
          <div className="joyride-tooltip__energy-pills">
            {ENERGY_PILLS.map(({ level, label, color }) => (
              <div key={level} className="joyride-tooltip__energy-pill" style={{ '--pill-color': color }}>
                <span className="joyride-tooltip__energy-pill-dot" />
                <span className="joyride-tooltip__energy-pill-num">{level}</span>
                <span className="joyride-tooltip__energy-pill-label">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="joyride-tooltip__nav">
          {index > 0 ? (
            <button className="joyride-tooltip__btn joyride-tooltip__btn--ghost" {...backProps}>
              <ChevronLeft size={14} />
              <span>{backProps.title}</span>
            </button>
          ) : (
            <div />
          )}

          {continuous && (
            <button
              className="joyride-tooltip__btn joyride-tooltip__btn--primary"
              {...primaryProps}
            >
              <span>{isLastStep ? primaryProps['data-finish'] || primaryProps.title : primaryProps.title}</span>
              {isLastStep ? <ArrowRight size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main Tour Component ──────────────────────────────────────
export default function OnboardingTour({ onFinish }) {
  const { t } = useLanguage();

  const steps = getSteps(t);

  const handleEvent = useCallback((data, controls) => {
    const { action, status, type } = data;

    // Tour finished or skipped naturally
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status) && type === EVENTS.TOUR_END) {
      onFinish();
      return;
    }

    // Close button explicitly clicked — end the tour
    if (action === ACTIONS.CLOSE && type === EVENTS.STEP_AFTER) {
      controls.stop();
      onFinish();
    }
  }, [onFinish]);

  return (
    <Joyride
      steps={steps}
      run
      continuous
      tooltipComponent={MisuTooltip}
      onEvent={handleEvent}
      locale={{
        back: t('tour.back'),
        close: t('tour.skip'),
        last: t('tour.finish'),
        next: t('tour.next'),
        skip: t('tour.skip'),
      }}
      options={{
        zIndex: 400,
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        spotlightRadius: 24,
        scrollOffset: 100,
        overlayClickAction: false,
        closeButtonAction: 'skip',
      }}
      floatingOptions={{
        hideArrow: true,
      }}
      styles={{
        overlay: {},
        spotlight: {},
        beacon: { display: 'none' },
        tooltipContainer: { textAlign: 'left' },
      }}
    />
  );
}
