import { useState, useMemo } from 'react';
import { useTasks } from '../context/TaskContext';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import { getDaysUntil } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';
import { useEnergy } from '../context/EnergyContext';
import { getEnergyDef } from '../utils/energy';
import GradientOrb from './GradientOrb';
import { PixelLoaderMini } from './PixelLoader';
import './TaskList.css';

export default function TaskList() {
  const { tasks, loading } = useTasks(); // X6: consume loading state
  const { t } = useLanguage();
  const { currentEnergy } = useEnergy();
  const energyDef = getEnergyDef(currentEnergy);
  const [filter, setFilter] = useState('active');
  const [sort, setSort] = useState('deadline');

  const filtered = useMemo(() => {
    let list = [...tasks];

    // Filter
    if (filter === 'active') list = list.filter(t => !t.completed);
    else if (filter === 'completed') list = list.filter(t => t.completed);

    // Sort
    list.sort((a, b) => {
      if (sort === 'deadline') {
        const daysA = getDaysUntil(a.deadline) ?? 999;
        const daysB = getDaysUntil(b.deadline) ?? 999;
        return daysA - daysB;
      }
      if (sort === 'energy') return b.energyRequired - a.energyRequired;
      if (sort === 'duration') return (b.estimatedHours || 0) - (a.estimatedHours || 0);
      return 0;
    });

    return list;
  }, [tasks, filter, sort]);

  const counts = {
    all: tasks.length,
    active: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
  };

  // X6: Show skeleton while data is loading from Supabase
  if (loading) {
    return (
      <div id="task-list" className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <PixelLoaderMini height={88} />
      </div>
    );
  }

  return (
    <div id="task-list">
      <TaskForm />

      <div className="task-list__header">
        <div className="task-list__filters" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {['active', 'all', 'completed'].map(f => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)}
            >
              {t(`common.${f}`)}
              <span style={{ marginLeft: '4px', opacity: 0.5 }}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        <div className="task-list__sort" style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {[
            { key: 'deadline', label: t('tasks.fieldDeadline') },
            { key: 'energy', label: t('tasks.fieldEnergy') },
            { key: 'duration', label: t('common.hours') },
          ].map(s => (
            <button
              key={s.key}
              className={`btn btn-sm ${sort === s.key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSort(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="task-list__items stagger-children">
          {filtered.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="task-list__empty">
          <div style={{ width: '80px', height: '80px', marginBottom: 'var(--space-4)', opacity: 0.4 }}>
            <GradientOrb color={energyDef.vividColorA} size="100%" />
          </div>
          {/* X1: Contextual empty state messages per filter */}
          <p className="task-list__empty-text">
            {filter === 'completed'
              ? t('tasks.emptyCompleted') || 'No completed tasks yet'
              : filter === 'active'
              ? t(`energy.${currentEnergy}.empty`)
              : t('tasks.emptyState')}
          </p>
        </div>
      )}
    </div>
  );
}
