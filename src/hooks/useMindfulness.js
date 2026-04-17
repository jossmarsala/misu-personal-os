import { useState, useEffect, useRef } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { useTasks } from '../context/TaskContext';

export function useMindfulness(dndVisible) {
  const { currentEnergy, breathingActive, setBreathingActive } = useEnergy();
  const { tasks } = useTasks();
  
  const [advice, setAdvice] = useState(null);
  const [helperVisible, setHelperVisible] = useState(false);
  const [helperType, setHelperType] = useState('advice');
  
  const lastActivityRef = useRef(Date.now());
  const tasksCountRef = useRef(tasks.length);

  // Track activity (task additions or completions)
  useEffect(() => {
    if (tasks.length !== tasksCountRef.current) {
      lastActivityRef.current = Date.now();
      tasksCountRef.current = tasks.length;
    }
  }, [tasks]);

  // Logic to detect "Flow Inconsistency" and trigger advice
  useEffect(() => {
    const interval = setInterval(() => {
      const activeTasksCount = tasks.filter(t => !t.completed).length;
      const timeSinceActivity = (Date.now() - lastActivityRef.current) / 1000 / 60; // minutes

      // L6: Triggers for energy >= 3 (medium and above) with pending tasks
      if (currentEnergy >= 3 && activeTasksCount > 0 && timeSinceActivity > 20 && !helperVisible && !breathingActive) {
        setHelperType('mindfulness'); // Change to mindfulness type to show the circle
        setAdvice('mindfulness.idleAdvice');
        setHelperVisible(true);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentEnergy, tasks, helperVisible, breathingActive]);

  // Show breathing guide when breathing mode is toggled ON
  useEffect(() => {
    if (breathingActive) {
      setHelperType('mindfulness');
      setAdvice('mindfulness.breathing');
      setHelperVisible(true);
    } else if (helperType !== 'advice') { // Don't hide if it's just general advice
      setHelperVisible(false);
    }
  }, [breathingActive]);

  // Handle Focus Shield Onboarding
  useEffect(() => {
    if (dndVisible) {
      const hasSeenHelp = localStorage.getItem('misu_seen_dnd_help');
      if (!hasSeenHelp) {
        setHelperType('info');
        setAdvice('mindfulness.dndHelp');
        setHelperVisible(true);
        localStorage.setItem('misu_seen_dnd_help', 'true');
      }
    }
  }, [dndVisible]);

  return {
    advice,
    helperVisible,
    helperType,
    setHelperVisible
  };
}
