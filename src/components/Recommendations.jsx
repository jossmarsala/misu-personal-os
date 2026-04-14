import { useMemo } from 'react';
import { useTasks } from '../context/TaskContext';
import { useEnergy } from '../context/EnergyContext';
import { getRecommendations } from '../utils/recommendations';
import { getEnergyDef } from '../utils/energy';
import { formatDeadline, getDeadlineStatus } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';
import { Compass } from 'lucide-react';
import './Recommendations.css';

export default function Recommendations() {
  const { tasks } = useTasks();
  const { currentEnergy } = useEnergy();
  const { t } = useLanguage();
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

  const getDeadlineText = (deadline) => {
    const status = getDeadlineStatus(deadline);
    if (status === 'today') return t('common.today');
    if (status === 'tomorrow') return t('common.tomorrow');
    if (status === 'overdue') return t('common.overdue');
    return formatDeadline(deadline); // Fallback to util for complex cases
  };

  return (
    <div className="recommendations" id="recommendations">
      <div className="recommendations__header">
        <div className="recommendations__title">
          <Compass size={18} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--energy-primary)' }} />
          {t('recommendations.title')}
        </div>
        <div className="recommendations__message">{t(`energy.${currentEnergy}.msg`)}</div>
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
                    {getDeadlineText(task.deadline)}
                  </span>
                )}
                <span className="task-card__duration">{task.estimatedHours}{t('common.hours').substring(0, 1)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="recommendations__empty">
          <span className="recommendations__empty-icon">
            {currentEnergy <= 2 ? '🌙' : '🏛️'}
          </span>
          {t(`energy.${currentEnergy}.empty`)}
        </div>
      )}
    </div>
  );
}
