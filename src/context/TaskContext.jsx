import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

const TaskContext = createContext();

export function TaskProvider({ children }) {
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState(() => {
    try {
      const cached = localStorage.getItem('misu-offline-tasks');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });

  const [weeklyPlan, setWeeklyPlan] = useState(() => {
    try {
      const cached = localStorage.getItem('misu-offline-plan');
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
  
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(typeof window !== 'undefined' ? !navigator.onLine : false);
  const [needsSync, setNeedsSync] = useState(false);
  const isInitialMount = useRef(true);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch from Supabase on mount
  useEffect(() => {
    const init = async () => {
      // If we boot offline, we just use local cache (already loaded)
      if (isOffline) { setLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from('user_data')
          .select('payload')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { 
          console.error("Supabase fetch error:", error);
        } else if (data?.payload) {
          // Sync UI & LocalStorage with fresh cloud data
          if (data.payload.tasks) {
            setTasks(data.payload.tasks);
            localStorage.setItem('misu-offline-tasks', JSON.stringify(data.payload.tasks));
          }
          if (data.payload.weeklyPlan) {
            setWeeklyPlan(data.payload.weeklyPlan);
            localStorage.setItem('misu-offline-plan', JSON.stringify(data.payload.weeklyPlan));
          }
        }
      } catch (err) {
        console.error("Failed to load tasks from Supabase:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) init();
    else if (!user) {
      setTasks([]);
      localStorage.removeItem('misu-offline-tasks');
      setLoading(false);
    }
  }, [user, isOffline]); // trigger mount fetch when user or online status resolves

  // Sync to local and Supabase on change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Always backup to localStorage immediately (offline-first)
    localStorage.setItem('misu-offline-tasks', JSON.stringify(tasks));
    localStorage.setItem('misu-offline-plan', JSON.stringify(weeklyPlan));

    if (!loading && user?.id) {
      if (isOffline) {
        setNeedsSync(true); // Flag that we have unsynced cloud items
        return;
      }

      const sync = async () => {
        const { error } = await supabase
          .from('user_data')
          .upsert({ user_id: user.id, payload: { tasks, weeklyPlan } }, { onConflict: 'user_id' });
        
        if (error) {
          console.error("Supabase sync error:", error);
          setNeedsSync(true);
        } else {
          setNeedsSync(false);
        }
      };
      sync();
    }
  }, [tasks, loading, user, isOffline]);

  // Sync to cloud if weeklyPlan changes independently
  useEffect(() => {
    if (!loading && user?.id && !isOffline) {
      const sync = async () => {
        await supabase
          .from('user_data')
          .upsert({ user_id: user.id, payload: { tasks, weeklyPlan } }, { onConflict: 'user_id' });
      };
      sync();
    }
    localStorage.setItem('misu-offline-plan', JSON.stringify(weeklyPlan));
  }, [weeklyPlan]);

  // Try syncing if returning online with dirty data
  useEffect(() => {
    if (!isOffline && needsSync && user?.id) {
       const pushLocal = async () => {
         const { error } = await supabase
           .from('user_data')
           .upsert({ user_id: user.id, payload: { tasks } }, { onConflict: 'user_id' });
         if (!error) setNeedsSync(false);
       };
       pushLocal();
    }
  }, [isOffline, needsSync, tasks, user]);

  const addTask = useCallback((taskData) => {
    const splitCount = parseInt(taskData.splitCount) || 1;
    const totalHours = parseFloat(taskData.estimatedHours) || 1;
    
    if (splitCount > 1) {
      const parentId = uuidv4();
      const blockSize = Math.round((totalHours / splitCount) * 100) / 100;
      const newTasks = [];
      
      for (let i = 0; i < splitCount; i++) {
        const isLast = i === splitCount - 1;
        // Last block absorbs any rounding differences
        const currentBlockSize = isLast 
          ? Math.round((totalHours - (blockSize * (splitCount - 1))) * 100) / 100 
          : blockSize;
        
        newTasks.push({
          id: uuidv4(),
          parentTaskId: parentId,
          title: `${taskData.title} (${i + 1}/${splitCount})`,
          description: taskData.description || '',
          deadline: taskData.deadline || null,
          estimatedHours: currentBlockSize,
          energyRequired: taskData.energyRequired || 3,
          completed: false,
          createdAt: new Date().toISOString(),
          isChunk: true,
          chunkLabel: `${i + 1}/${splitCount}`
        });
      }
      setTasks(prev => [...newTasks, ...prev]);
      return newTasks[0];
    } else {
      const newTask = {
        id: uuidv4(),
        title: taskData.title,
        description: taskData.description || '',
        deadline: taskData.deadline || null,
        estimatedHours: totalHours,
        energyRequired: taskData.energyRequired || 3,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    }
  }, []);

  const updateTask = useCallback((id, updates) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTask = useCallback((id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleComplete = useCallback((id) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  }, []);

  const importTasksFromJSON = useCallback((importedTasks) => {
    setTasks(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      const newTasks = importedTasks.filter(t => !existingIds.has(t.id));
      return [...prev, ...newTasks];
    });
  }, []);

  const [focusedTaskId, setFocusedTaskId] = useState(null);

  const clearAll = useCallback(() => {
    setTasks([]);
  }, []);

  const reorderTasks = useCallback((activeId, overId) => {
    setTasks(prev => {
      const oldIndex = prev.findIndex(t => t.id === activeId);
      const newIndex = prev.findIndex(t => t.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      
      const newTasks = [...prev];
      const [movedTask] = newTasks.splice(oldIndex, 1);
      newTasks.splice(newIndex, 0, movedTask);
      return newTasks;
    });
  }, []);

  return (
    <TaskContext.Provider value={{
      tasks,
      addTask,
      updateTask,
      deleteTask,
      toggleComplete,
      importTasksFromJSON,
      clearAll,
      reorderTasks,
      focusedTaskId,
      setFocusedTaskId,
      weeklyPlan,
      setWeeklyPlan,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within TaskProvider');
  return ctx;
}
