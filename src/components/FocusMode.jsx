import { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { useEnergy } from '../context/EnergyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Check } from 'lucide-react';
import { playPop, playChime } from '../utils/audio';
import './FocusMode.css';

export default function FocusMode() {
  const { tasks, focusedTaskId, setFocusedTaskId, toggleComplete } = useTasks();
  const { currentEnergy } = useEnergy();
  
  const task = tasks.find(t => t.id === focusedTaskId);
  
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 mins Focus Timer
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      playChime();
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  if (!focusedTaskId || !task) return null;

  const toggleTimer = () => setIsActive(!isActive);

  const completeFocus = () => {
    if (!task.completed) {
      toggleComplete(task.id);
      playPop();
    }
    setFocusedTaskId(null);
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <AnimatePresence>
      <motion.div 
        className="focus-overlay"
        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
        exit={{ opacity: 0 }}
      >
        <div className="focus-card bento-card bento-card--accent">
          <button className="focus-close btn btn-ghost btn-icon" onClick={() => setFocusedTaskId(null)}>
            <X size={20} />
          </button>
          
          <h2 className="focus-title">{task.title}</h2>
          
          <div className="focus-timer">
            <span className="focus-time">{mins}:{secs}</span>
          </div>

          <div className="focus-controls">
            <button className={`btn btn-icon ${isActive ? 'btn-ghost' : 'btn-primary'}`} onClick={toggleTimer} style={{ width: '56px', height: '56px' }}>
              {isActive ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button className="btn btn-primary" onClick={completeFocus} style={{ height: '56px', padding: '0 32px' }}>
              <Check size={20} /> Done
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
