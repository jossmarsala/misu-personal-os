import { useMemo } from 'react';
import { useTasks } from '../context/TaskContext';
import { useEnergy } from '../context/EnergyContext';
import { getRecommendations } from '../utils/recommendations';
import { getEnergyDef } from '../utils/energy';
import { formatDeadline, getDeadlineStatus } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';
import { Compass } from 'lucide-react';
import GradientOrb from './GradientOrb';
import { motion, AnimatePresence } from 'framer-motion';
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
    return formatDeadline(deadline); 
  };

  return (
    <div className="recommendations" id="recommendations">
      <div className="recommendations__header">
        <motion.h2 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-title"
          style={{ marginBottom: '2px' }}
        >
          <Compass size={18} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--energy-primary)' }} />
          {t('recommendations.title')}
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          className="section-subtitle"
          style={{ marginTop: 0 }}
        >
          {t(`energy.${currentEnergy}.msg`)}
        </motion.p>
      </div>

      <AnimatePresence mode="wait">
        {recommended.length > 0 ? (
          <motion.div 
            key="list"
            className="recommendations__list"
            initial="hidden"
            animate="show"
            variants={{
              show: {
                transition: {
                  staggerChildren: 0.08
                }
              }
            }}
          >
            {recommended.map((task, i) => (
              <motion.div 
                key={task.id} 
                className="recommendations__item"
                variants={{
                  hidden: { opacity: 0, x: 20 },
                  show: { opacity: 1, x: 0 }
                }}
                whileHover={{ x: -4, scale: 1.02 }}
              >
                <div style={{ width: '16px', height: '16px', marginRight: '8px' }}>
                  <GradientOrb color={energyDef.vividColorA} size="100%" />
                </div>
                <span className="recommendations__item-title">{task.title}</span>
                <div className="recommendations__item-meta">
                  {task.deadline && (
                    <span className={deadlineBadgeClass(task.deadline)}>
                      {getDeadlineText(task.deadline)}
                    </span>
                  )}
                  <span className="task-card__duration">{task.estimatedHours}{t('common.hours').substring(0, 1)}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="recommendations__empty"
          >
            <div style={{ width: '64px', height: '64px', marginBottom: '16px', opacity: 0.5 }}>
              <GradientOrb color={energyDef.vividColorA} size="100%" />
            </div>
            {t(`energy.${currentEnergy}.empty`)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
