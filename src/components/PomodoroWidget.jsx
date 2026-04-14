import { useState, useEffect, useCallback } from 'react';
import { useTasks } from '../context/TaskContext';
import { Timer, Play, Pause, SkipForward, RotateCcw, ChevronDown } from 'lucide-react';
import { playChime, playPop } from '../utils/audio';
import DraggableWidget from './DraggableWidget';
import './PomodoroWidget.css';

const MODES = {
  focus: { label: 'Focus', duration: 25 * 60, color: 'var(--energy-primary)' },
  shortBreak: { label: 'Break', duration: 5 * 60, color: 'var(--energy-accent)' },
  longBreak: { label: 'Long Break', duration: 15 * 60, color: 'var(--energy-accent)' },
};

export default function PomodoroWidget({ visible, onClose }) {
  const { tasks, toggleComplete } = useTasks();
  const activeTasks = tasks.filter(t => !t.completed);

  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [boundTaskId, setBoundTaskId] = useState('');
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  const currentMode = MODES[mode];
  const totalTime = currentMode.duration;
  const progress = 1 - (timeLeft / totalTime);
  
  // SVG circle math
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Timer tick
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      playChime();

      if (mode === 'focus') {
        const newSessions = sessions + 1;
        setSessions(newSessions);
        // Every 4 focus sessions → long break
        const nextMode = newSessions % 4 === 0 ? 'longBreak' : 'shortBreak';
        setMode(nextMode);
        setTimeLeft(MODES[nextMode].duration);
      } else {
        setMode('focus');
        setTimeLeft(MODES.focus.duration);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, sessions]);

  const toggle = () => {
    setIsActive(!isActive);
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

  const completeTask = () => {
    if (boundTaskId) {
      toggleComplete(boundTaskId);
      playPop();
      setBoundTaskId('');
    }
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  const boundTask = tasks.find(t => t.id === boundTaskId);

  if (!visible) return null;

  return (
    <DraggableWidget 
      id="pomodoro" 
      title="Pomodoro" 
      icon={<Timer size={14} />}
      defaultPosition={{ x: window.innerWidth - 310, y: 100 }}
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
              {m.label}
            </button>
          ))}
        </div>

        {/* Timer ring */}
        <div className="pomodoro__ring-container">
          <svg className="pomodoro__ring" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} className="pomodoro__ring-bg" />
            <circle
              cx="60" cy="60" r={radius}
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
          </div>
        </div>

        {/* Controls */}
        <div className="pomodoro__controls">
          <button className="pomodoro__btn pomodoro__btn--sm" onClick={reset} title="Reset">
            <RotateCcw size={16} />
          </button>
          <button className={`pomodoro__btn pomodoro__btn--main ${isActive ? 'active' : ''}`} onClick={toggle}>
            {isActive ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button className="pomodoro__btn pomodoro__btn--sm" onClick={skip} title="Skip">
            <SkipForward size={16} />
          </button>
        </div>

        {/* Session dots */}
        <div className="pomodoro__sessions">
          {[0,1,2,3].map(i => (
            <div key={i} className={`pomodoro__dot ${i < (sessions % 4) ? 'filled' : ''}`} />
          ))}
        </div>

        {/* Task picker */}
        <div className="pomodoro__task-bind">
          <button 
            className="pomodoro__task-picker" 
            onClick={() => setShowTaskPicker(!showTaskPicker)}
          >
            <span>{boundTask ? boundTask.title : 'Select a task...'}</span>
            <ChevronDown size={14} />
          </button>
          {showTaskPicker && (
            <div className="pomodoro__task-list">
              {activeTasks.map(t => (
                <button 
                  key={t.id}
                  className="pomodoro__task-option"
                  onClick={() => { setBoundTaskId(t.id); setShowTaskPicker(false); }}
                >
                  {t.title}
                </button>
              ))}
              {activeTasks.length === 0 && (
                <div className="pomodoro__task-option" style={{ opacity: 0.5 }}>No active tasks</div>
              )}
            </div>
          )}
        </div>

        {boundTask && (
          <button className="pomodoro__done-btn" onClick={completeTask}>
            ✓ Mark as done
          </button>
        )}
      </div>
    </DraggableWidget>
  );
}
