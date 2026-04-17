import { useState, useCallback, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { generateWeeklyPlan } from '../services/gemini';
import { getWeekDays, formatDayShort, toInputDate } from '../utils/dateUtils';
import { loadSettings } from '../services/storage';
import { useLanguage } from '../context/LanguageContext';
import { playChime, playPop } from '../utils/audio';
import { Calendar, Sparkles, RefreshCw } from 'lucide-react';
import { PixelLoaderMini } from './PixelLoader';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DroppableColumn from './DroppableColumn';
import { useEnergy } from '../context/EnergyContext';
import { getEnergyDef } from '../utils/energy';
import GradientOrb from './GradientOrb';
import './WeeklyPlanner.css';

export default function WeeklyPlanner() {
  const { tasks, weeklyPlan: plan, setWeeklyPlan: setPlan } = useTasks();
  const { t, language } = useLanguage();
  const { currentEnergy } = useEnergy();
  const energyDef = getEnergyDef(currentEnergy);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const weekDays = getWeekDays();
  const dayKeys = weekDays.map(d => toInputDate(d));
  const today = toInputDate(new Date());

  const handleGenerate = async () => {
    const settings = loadSettings();
    const apiKey = settings.geminiApiKey;

    if (!apiKey) {
      setError(t('planner.apiError'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateWeeklyPlan(tasks, apiKey, language);
      
      for (const day of Object.keys(result)) {
        if (Array.isArray(result[day])) {
          result[day] = result[day].map((t, idx) => {
            const associatedTask = tasks.find(x => x.id === t.taskId);
            return {
              ...t,
              dndId: `${day}-${t.taskId}-${idx}-${Date.now()}`,
              energyRequired: associatedTask ? associatedTask.energyRequired : 3
            };
          });
        }
      }
      
      setPlan(result);
      playChime();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Internal planner reordering — triggered by top-level DndContext via custom event
  const handlePlannerDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    setPlan(prev => {
      const newPlan = { ...prev };

      let sourceDay = null;
      let targetDay = null;

      for (const day of Object.keys(newPlan)) {
        if (newPlan[day].some(t => t.dndId === activeId)) sourceDay = day;
        if (newPlan[day].some(t => t.dndId === overId)) targetDay = day;
      }

      if (!targetDay && dayKeys.includes(overId)) targetDay = overId;
      if (!sourceDay || !targetDay) return prev;

      if (sourceDay === targetDay) {
        const list = [...newPlan[sourceDay]];
        const oldIndex = list.findIndex(t => t.dndId === activeId);
        const newIndex = list.findIndex(t => t.dndId === overId);
        newPlan[sourceDay] = arrayMove(list, oldIndex, newIndex);
      } else {
        const sourceList = [...newPlan[sourceDay]];
        const targetList = [...newPlan[targetDay]];
        const activeItemIndex = sourceList.findIndex(t => t.dndId === activeId);
        const [movedTask] = sourceList.splice(activeItemIndex, 1);
        if (dayKeys.includes(overId)) {
          targetList.push(movedTask);
        } else {
          const overIndex = targetList.findIndex(t => t.dndId === overId);
          targetList.splice(overIndex, 0, movedTask);
        }
        newPlan[sourceDay] = sourceList;
        newPlan[targetDay] = targetList;
      }
      playPop();
      return newPlan;
    });
  }, [dayKeys]);

  useEffect(() => {
    const handler = (e) => handlePlannerDragEnd(e.detail);
    window.addEventListener('misu:planner-drag-end', handler);
    return () => window.removeEventListener('misu:planner-drag-end', handler);
  }, [handlePlannerDragEnd]);

  return (
    <div className="planner" id="weekly-planner">
      <div className="planner__header">
        <div className="planner__title-area">
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            <Calendar size={18} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--energy-primary)' }} />
            {t('planner.title')}
          </h2>
          <p className="section-subtitle">{t('planner.subtitle')}</p>
        </div>
        <div className="planner__actions">
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading || tasks.filter(t => !t.completed).length === 0}
            id="generate-plan-btn"
          >
            {loading ? (
              <RefreshCw size={16} className="spinning" />
            ) : (
              <Sparkles size={16} />
            )}
            {plan ? t('planner.regenerate') || 'Regenerate Plan' : t('planner.generate')}
          </button>
        </div>
      </div>

      {loading && (
        <div className="planner__loading animate-fade-in">
          <PixelLoaderMini
            label={t('planner.loading')}
            height={88}
          />
        </div>
      )}

      {error && (
        <div className="planner__error animate-fade-in">{error}</div>
      )}

      {!loading && !plan && !error && (
        <div className="planner__empty">
          <div style={{ width: '80px', height: '80px', marginBottom: 'var(--space-4)', opacity: 0.4 }}>
            <GradientOrb color={energyDef.vividColorA} size="100%" />
          </div>
          <p>{t('planner.generate')}</p>
          <p className="section-subtitle" style={{ marginTop: '8px' }}>
            {tasks.filter(t => !t.completed).length} {t('stats.activeTasks')}
          </p>
        </div>
      )}

      {!loading && plan && (
        <div className="planner__week animate-fade-in">
          {weekDays.map((date, i) => {
            const dayKey = dayKeys[i];
            const dayTasks = plan[dayKey] || [];
            const isToday = toInputDate(date) === today;

            return (
              <DroppableColumn
                key={dayKey}
                id={dayKey}
                dayTasks={dayTasks}
                t={t}
                dayName={formatDayShort(date)}
                dayDate={date.getDate()}
                isToday={isToday}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
