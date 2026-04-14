import { useState, useEffect, useRef } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { useTasks } from '../context/TaskContext';

export function useMindfulness() {
  const { currentEnergy, breathingActive } = useEnergy();
  const { tasks } = useTasks();
  
  const [advice, setAdvice] = useState(null);
  const [helperVisible, setHelperVisible] = useState(false);
  const [helperType, setHelperType] = useState('advice');
  
  const lastActivityRef = useRef(Date.now());
  const tasksCountRef = useRef(tasks.length);

  // Track activity (task additions or completions)
  useEffect(() => {
    const activeTasks = tasks.filter(t => !t.completed).length;
    if (tasks.length !== tasksCountRef.current) {
      lastActivityRef.current = Date.now();
      tasksCountRef.current = tasks.length;
    }
  }, [tasks]);

  // Logic to detect "Flow Inconsistency"
  useEffect(() => {
    const interval = setInterval(() => {
      const activeTasksCount = tasks.filter(t => !t.completed).length;
      const timeSinceActivity = (Date.now() - lastActivityRef.current) / 1000 / 60; // minutes

      // If high energy (4-5) but no activity for > 20 mins and has pending tasks
      if (currentEnergy >= 4 && activeTasksCount > 0 && timeSinceActivity > 20 && !helperVisible && !breathingActive) {
        setHelperType('advice');
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
    } else {
      setHelperVisible(false);
    }
  }, [breathingActive]);

  return {
    advice,
    helperVisible,
    helperType,
    setHelperVisible
  };
}
