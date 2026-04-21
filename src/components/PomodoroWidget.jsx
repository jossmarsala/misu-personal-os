import { useState, useEffect } from 'react';
import { Timer, Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { playFocusEnd, playBreakEnd, playLongBreakEnd, playPop } from '../utils/audio';
import { useLanguage } from '../context/LanguageContext';
import DraggableWidget from './DraggableWidget';
import './PomodoroWidget.css';

const MODES = {
  focus:      { labelKey: 'pomodoro.focus',     duration: 25 * 60, color: 'var(--energy-primary)' },
  shortBreak: { labelKey: 'pomodoro.break',     duration:  5 * 60, color: 'var(--energy-accent)'  },
  longBreak:  { labelKey: 'pomodoro.longBreak', duration: 15 * 60, color: 'var(--energy-accent)'  },
};

export default function PomodoroWidget({ visible, onClose }) {
  const { t } = useLanguage();

  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState(0);

  const currentMode = MODES[mode];
  const totalTime = currentMode.duration;
  const progress = 1 - timeLeft / totalTime;

  // SVG ring math
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      
      // Play specific sound based on the mode that just finished
      if (mode === 'focus') {
        playFocusEnd();
        const newSessions = sessions + 1;
        setSessions(newSessions);
        const nextMode = newSessions % 4 === 0 ? 'longBreak' : 'shortBreak';
        setMode(nextMode);
        setTimeLeft(MODES[nextMode].duration);
      } else {
        if (mode === 'shortBreak') playBreakEnd();
        else if (mode === 'longBreak') playLongBreakEnd();
        
        setMode('focus');
        setTimeLeft(MODES.focus.duration);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, sessions]);

  const toggle = () => {
    setIsActive(a => !a);
    if (!isActive) playPop();
  };

  const reset = () => {
    setIsActive(false);
    setTimeLeft(currentMode.duration);
  };

  const skip = () => {
    setIsActive(false);
    if (mode === 'focus') {
      const newSessions = sessions + 1;
      setSessions(newSessions);
      const nextMode = newSessions % 4 === 0 ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      setTimeLeft(MODES[nextMode].duration);
    } else {
      setMode('focus');
      setTimeLeft(MODES.focus.duration);
    }
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  if (!visible) return null;

  return (
    <DraggableWidget 
      id="pomodoro" 
      title={t('pomodoro.title')} 
      icon={<Timer size={14} />}
      defaultPosition={{ x: Math.max(20, window.innerWidth - 330), y: 100 }} // X3: safer positioning
    >
      <div className="pomodoro">
        {/* Mode tabs */}
        <div className="pomodoro__modes">
          {Object.entries(MODES).map(([key, m]) => (
            <button
              key={key}
              className={`pomodoro__mode-btn ${mode === key ? 'active' : ''}`}
              onClick={() => { setMode(key); setTimeLeft(m.duration); setIsActive(false); }}
            >
            {t(`pomodoro.${key === 'shortBreak' ? 'break' : key === 'longBreak' ? 'longBreak' : key}`)}
            </button>
          ))}
        </div>

        {/* Timer ring */}
        <div className="pomodoro__ring-container">
          <svg className="pomodoro__ring" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r={radius} className="pomodoro__ring-bg" />
            <circle
              cx="64" cy="64" r={radius}
              className="pomodoro__ring-progress"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
                stroke: currentMode.color,
              }}
            />
          </svg>
          <div className="pomodoro__time">
            <span className="pomodoro__digits">{mins}:{secs}</span>
            <span className="pomodoro__mode-label">{t(currentMode.labelKey)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="pomodoro__controls">
          <button className="pomodoro__btn pomodoro__btn--sm" onClick={reset} title={t('pomodoro.reset')}>
            <RotateCcw size={15} />
          </button>
          <button className={`pomodoro__btn pomodoro__btn--main ${isActive ? 'active' : ''}`} onClick={toggle}>
            {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />}
          </button>
          <button className="pomodoro__btn pomodoro__btn--sm" onClick={skip} title={t('pomodoro.skip')}>
            <SkipForward size={15} />
          </button>
        </div>

        {/* Session dots */}
        <div className="pomodoro__sessions">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`pomodoro__dot ${i < (sessions % 4) ? 'filled' : ''}`} />
          ))}
        </div>
      </div>
    </DraggableWidget>
  );
}
