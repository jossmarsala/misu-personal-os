import { useMemo } from 'react';
import { useTasks } from '../context/TaskContext';
import { useEnergy } from '../context/EnergyContext';
import { getRecommendations } from '../utils/recommendations';
import { getEnergyDef } from '../utils/energy';
import { formatDeadline, getDeadlineStatus } from '../utils/dateUtils';
import { Sparkles } from 'lucide-react';
import './Recommendations.css';

export default function Recommendations() {
  const { tasks } = useTasks();
  const { currentEnergy } = useEnergy();
  const energyDef = getEnergyDef(currentEnergy);

  const recommended = useMemo(() => {
    return getRecommendations(tasks, currentEnergy);
  }, [tasks, currentEnergy]);

  const deadlineBadgeClass = (deadline) => {
    const status = getDeadlineStatus(deadline);
    return {
      overdue: 'badge badge-danger',
      today: 'badge badge-warning',
      tomorrow: 'badge badge-warning',
      soon: 'badge badge-energy',
      normal: 'badge badge-energy',
    }[status] || 'badge badge-energy';
  };

  return (
    <div className="recommendations" id="recommendations">
      <div className="recommendations__header">
        <div className="recommendations__title">
          <Sparkles size={18} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--energy-primary)' }} />
          What can I do right now?
        </div>
        <div className="recommendations__message">{energyDef.message}</div>
      </div>

      {recommended.length > 0 ? (
        <div className="recommendations__list stagger-children">
          {recommended.map((task, i) => (
            <div key={task.id} className="recommendations__item">
              <span className="recommendations__item-rank">#{i + 1}</span>
              <span className="recommendations__item-title">{task.title}</span>
              <div className="recommendations__item-meta">
                {task.deadline && (
                  <span className={deadlineBadgeClass(task.deadline)}>
                    {formatDeadline(task.deadline)}
                  </span>
                )}
                <span className="task-card__duration">{task.estimatedHours}h</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="recommendations__empty">
          <span className="recommendations__empty-icon">
            {currentEnergy <= 2 ? '🌙' : '🏛️'}
          </span>
          {energyDef.emptyMessage}
        </div>
      )}
    </div>
  );
}
