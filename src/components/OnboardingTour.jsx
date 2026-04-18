import { useState, useCallback } from 'react';
import { Joyride, ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, X, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './OnboardingTour.css';

// ── Step definitions ─────────────────────────────────────────
// Each step targets a DOM element by CSS selector.
// The 4 steps cover the core value pillars of Misu OS.
const STEP_KEYS = ['energy', 'tasks', 'widgets', 'planner'];

function getSteps(t) {
  return [
    {
      // Step 1 — Energy-aware recommendations
      target: '.reco-card',
      content: t('tour.energy.content'),
      title: t('tour.energy.title'),
      placement: 'left',
      disableBeacon: true,
      spotlightPadding: 8,
    },
    {
      // Step 2 — Task creation (quick add)
      target: '#add-task-btn',
      content: t('tour.tasks.content'),
      title: t('tour.tasks.title'),
      placement: 'bottom',
      disableBeacon: true,
      spotlightPadding: 12,
    },
    {
      // Step 3 — Widget toolbar (Pomodoro, Music, Focus Shield, Calendar)
      target: '.widget-glass-container',
      content: t('tour.widgets.content'),
      title: t('tour.widgets.title'),
      placement: 'bottom',
      disableBeacon: true,
      spotlightPadding: 10,
    },
    {
      // Step 4 — Weekly planner
      target: '#weekly-planner',
      content: t('tour.planner.content'),
      title: t('tour.planner.title'),
      placement: 'top',
      disableBeacon: true,
      spotlightPadding: 8,
    },
  ];
}

// ── Custom Tooltip Component ─────────────────────────────────
// Matches Misu's glassmorphism / rounded-card aesthetic.
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
  const [stepIndex, setStepIndex] = useState(0);
  const [run, setRun] = useState(true);

  const steps = getSteps(t);

  const handleCallback = useCallback((data) => {
    const { action, index, status, type } = data;

    // Tour finished or skipped
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      onFinish();
      return;
    }

    // Navigate steps
    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) {
        setStepIndex(prev => prev + 1);
      } else if (action === ACTIONS.PREV) {
        setStepIndex(prev => prev - 1);
      }
    }

    // Close button clicked
    if (action === ACTIONS.CLOSE) {
      setRun(false);
      onFinish();
    }
  }, [onFinish]);

  return (
    <Joyride
      steps={steps}
      stepIndex={stepIndex}
      run={run}
      continuous
      showSkipButton={false}
      showProgress={false}
      disableOverlayClose={false}
      disableScrolling={false}
      scrollOffset={80}
      callback={handleCallback}
      tooltipComponent={MisuTooltip}
      locale={{
        back: t('tour.back'),
        close: t('tour.skip'),
        last: t('tour.finish'),
        next: t('tour.next'),
        skip: t('tour.skip'),
      }}
      styles={{
        options: {
          zIndex: 400,
          arrowColor: 'transparent',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        },
        spotlight: {
          borderRadius: 'var(--card-radius, 28px)',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45), 0 0 40px rgba(0, 0, 0, 0.3)',
        },
        // Hide default beacon entirely
        beacon: {
          display: 'none',
        },
        // Hide the default arrow
        tooltipContainer: {
          textAlign: 'left',
        },
      }}
      floaterProps={{
        disableAnimation: true,
        hideArrow: true,
        styles: {
          arrow: { display: 'none' },
          floater: { filter: 'none' },
        },
      }}
    />
  );
}
