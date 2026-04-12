import { useState, useMemo } from 'react';
import { useTasks } from '../context/TaskContext';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import { getDaysUntil } from '../utils/dateUtils';
import './TaskList.css';

export default function TaskList() {
  const { tasks } = useTasks();
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

  return (
    <div id="task-list">
      <TaskForm />

      <div className="task-list__header">
        <div className="task-list__filters">
          {['active', 'all', 'completed'].map(f => (
            <button
              key={f}
              className={`task-list__filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span style={{ marginLeft: '4px', opacity: 0.5 }}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        <div className="task-list__sort">
          {[
            { key: 'deadline', label: 'Deadline' },
            { key: 'energy', label: 'Energy' },
            { key: 'duration', label: 'Duration' },
          ].map(s => (
            <button
              key={s.key}
              className={`task-list__sort-btn ${sort === s.key ? 'active' : ''}`}
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
          <div className="task-list__empty-icon">
            {filter === 'completed' ? '🏛️' : '🏺'}
          </div>
          <p className="task-list__empty-text">
            {filter === 'completed'
              ? 'No completed tasks yet. Finish something great!'
              : 'No tasks here. Add one above to begin your odyssey.'}
          </p>
        </div>
      )}
    </div>
  );
}
