import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

const TaskContext = createContext();

export function TaskProvider({ children }) {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const isInitialMount = useRef(true);

  // Fetch from Supabase on mount/user change
  useEffect(() => {
    const init = async () => {
      try {
        const { data, error } = await supabase
          .from('user_data')
          .select('payload')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows'
          console.error("Supabase fetch error:", error);
        } else if (data?.payload?.tasks) {
          setTasks(data.payload.tasks);
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
      setLoading(false);
    }
  }, [user]);

  // Sync to Supabase on change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!loading && user?.id) {
      const sync = async () => {
        const { error } = await supabase
          .from('user_data')
          .upsert({ user_id: user.id, payload: { tasks } }, { onConflict: 'user_id' });
        
        if (error) console.error("Supabase sync error:", error);
      };
      sync();
    }
  }, [tasks, loading, user]);

  const addTask = useCallback((taskData) => {
    const newTask = {
      id: uuidv4(),
      title: taskData.title,
      description: taskData.description || '',
      deadline: taskData.deadline || null,
      estimatedHours: taskData.estimatedHours || 1,
      energyRequired: taskData.energyRequired || 3,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
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
