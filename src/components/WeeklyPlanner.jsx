import { useState, useCallback, useEffect, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import { generateWeeklyPlan } from '../services/gemini';
import { getWeekDays, formatDayShort, toInputDate, getStartOfWeek, formatWeekRange, getWeekOffset } from '../utils/dateUtils';
import { loadSettings } from '../services/storage';
import { useLanguage } from '../context/LanguageContext';
import { playChime, playPop } from '../utils/audio';
import { Calendar, Sparkles, RefreshCw, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { PixelLoaderMini } from './PixelLoader';
import { arrayMove } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import DroppableColumn from './DroppableColumn';
import './WeeklyPlanner.css';

function WeekTabItem({ targetDate, label, active, onSelect }) {
  const dayKey = toInputDate(targetDate);
  const { setNodeRef, isOver } = useDroppable({
    id: `week-tab-${dayKey}`,
    data: {
      type: 'week-switcher',
      targetDay: dayKey,
      targetDate,
    }
  });

  const timerRef = useRef(null);

  useEffect(() => {
    if (isOver && !active) {
      timerRef.current = setTimeout(() => {
        onSelect(targetDate);
        playPop();
      }, 450);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOver, active, onSelect, targetDate]);

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onSelect(targetDate)}
      className={`planner__week-tab ${active ? 'planner__week-tab--active' : ''} ${isOver ? 'highlighted-drop' : ''}`}
      title={label}
    >
      {label}
    </button>
  );
}

function WeekNavButton({ direction, baseDate, onClick, label }) {
  const isNext = direction === 'next';
  const targetDate = new Date(baseDate);
  targetDate.setDate(targetDate.getDate() + (isNext ? 7 : -7));
  const targetDay = toInputDate(targetDate);

  const { setNodeRef, isOver } = useDroppable({
    id: `week-nav-${direction}-${targetDay}`,
    data: {
      type: 'week-switcher',
      targetDay,
      targetDate,
    }
  });

  const timerRef = useRef(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (isOver) {
      if (!hasTriggeredRef.current) {
        timerRef.current = setTimeout(() => {
          onClick();
          playPop();
          hasTriggeredRef.current = true;
        }, 500);
      }
    } else {
      hasTriggeredRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOver, onClick]);

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      className={`btn btn-icon planner__nav-btn ${isOver ? 'highlighted-drop' : ''}`}
      style={{ padding: '8px' }}
      aria-label={label}
      title={label}
    >
      {isNext ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
    </button>
  );
}

export default function WeeklyPlanner() {
  const { tasks, weeklyPlan: plan, setWeeklyPlan: setPlan } = useTasks();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [baseDate, setBaseDate] = useState(() => getStartOfWeek(new Date()));
  const currentWeekStart = getStartOfWeek(new Date());
  const weekOffset = getWeekOffset(baseDate, currentWeekStart);
  const isCurrentWeek = weekOffset === 0;

  const weekDays = getWeekDays(baseDate);
  const dayKeys = weekDays.map(d => toInputDate(d));
  const today = toInputDate(new Date());

  const planData = plan || {};
  const hasTasksThisWeek = weekDays.some(d => (planData[toInputDate(d)] || []).length > 0);

  const handlePrevWeek = useCallback(() => {
    setBaseDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, []);

  const handleNextWeek = useCallback(() => {
    setBaseDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, []);

  const handleResetToCurrent = useCallback(() => {
    setBaseDate(getStartOfWeek(new Date()));
    playPop();
  }, []);

  // Listen for planner date shifts (e.g. from dropping on another week)
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.date) {
        setBaseDate(getStartOfWeek(e.detail.date));
      }
    };
    window.addEventListener('misu:planner-set-date', handler);
    return () => window.removeEventListener('misu:planner-set-date', handler);
  }, []);

  const getRelativeWeekLabel = (offset) => {
    if (offset === 0) return t('planner.thisWeek');
    if (offset === 1) return t('planner.nextWeek');
    if (offset > 1) return t('planner.inWeeks', { n: offset }) || `+${offset} Wks`;
    if (offset === -1) return t('planner.prevWeek') || 'Last Week';
    return `${offset} Wks`;
  };

  const weekTabOptions = [
    { offset: 0, date: currentWeekStart, label: t('planner.thisWeek') },
    {
      offset: 1,
      date: (() => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 7); return d; })(),
      label: t('planner.nextWeek')
    },
    {
      offset: 2,
      date: (() => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 14); return d; })(),
      label: t('planner.inWeeks', { n: 2 }) || '+2 Wks'
    },
  ];

  if (weekOffset < 0 || weekOffset > 2) {
    const customTab = {
      offset: weekOffset,
      date: baseDate,
      label: getRelativeWeekLabel(weekOffset),
    };
    if (weekOffset < 0) {
      weekTabOptions.unshift(customTab);
    } else {
      weekTabOptions.push(customTab);
    }
  }

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
      const result = await generateWeeklyPlan(tasks, apiKey, language, baseDate);
      
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
      
      setPlan(prev => ({
        ...(prev || {}),
        ...result
      }));
      playChime();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Internal planner reordering & moving between days / weeks
  const handlePlannerDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    setPlan(prev => {
      const newPlan = { ...(prev || {}) };

      let sourceDay = null;
      let targetDay = null;

      for (const day of Object.keys(newPlan)) {
        if (newPlan[day]?.some(t => t.dndId === activeId)) sourceDay = day;
        if (newPlan[day]?.some(t => t.dndId === overId)) targetDay = day;
      }

      if (!targetDay && over.data?.current?.day) targetDay = over.data.current.day;
      if (!targetDay && over.data?.current?.targetDay) targetDay = over.data.current.targetDay;
      if (!targetDay && dayKeys.includes(overId)) targetDay = overId;
      if (!targetDay && typeof overId === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(overId)) {
        targetDay = overId;
      }
      if (!sourceDay || !targetDay) return prev;

      if (sourceDay === targetDay) {
        const list = [...(newPlan[sourceDay] || [])];
        const oldIndex = list.findIndex(t => t.dndId === activeId);
        const newIndex = list.findIndex(t => t.dndId === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          newPlan[sourceDay] = arrayMove(list, oldIndex, newIndex);
        }
      } else {
        const sourceList = [...(newPlan[sourceDay] || [])];
        const targetList = [...(newPlan[targetDay] || [])];
        const activeItemIndex = sourceList.findIndex(t => t.dndId === activeId);
        if (activeItemIndex === -1) return prev;
        const [movedTask] = sourceList.splice(activeItemIndex, 1);
        if (dayKeys.includes(overId) || overId === targetDay || over.data?.current?.type === 'week-switcher') {
          targetList.push(movedTask);
        } else {
          const overIndex = targetList.findIndex(t => t.dndId === overId);
          if (overIndex !== -1) {
            targetList.splice(overIndex, 0, movedTask);
          } else {
            targetList.push(movedTask);
          }
        }
        newPlan[sourceDay] = sourceList;
        newPlan[targetDay] = targetList;
      }
      playPop();
      return newPlan;
    });

    if (over.data?.current?.type === 'week-switcher' && over.data?.current?.targetDate) {
      setBaseDate(getStartOfWeek(over.data.current.targetDate));
    }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>
              <Calendar size={18} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--energy-primary)' }} />
              {t('planner.title')}
            </h2>
            <span className="planner__range-badge">
              {formatWeekRange(weekDays[0], weekDays[6])}
            </span>
          </div>
          <p className="section-subtitle">
            {t('planner.subtitle')} · {getRelativeWeekLabel(weekOffset)}
          </p>
        </div>

        <div className="planner__actions">
          {/* Week navigation with droppable buttons and tabs */}
          <div className="planner__nav">
            <WeekNavButton
              direction="prev"
              baseDate={baseDate}
              onClick={handlePrevWeek}
              label={t('planner.prevWeek')}
            />
            <div className="planner__week-tabs">
              {weekTabOptions.map((opt) => (
                <WeekTabItem
                  key={`tab-${opt.offset}`}
                  targetDate={opt.date}
                  label={opt.label}
                  active={weekOffset === opt.offset}
                  onSelect={(d) => setBaseDate(d)}
                />
              ))}
            </div>
            <WeekNavButton
              direction="next"
              baseDate={baseDate}
              onClick={handleNextWeek}
              label={t('planner.nextWeek')}
            />
            {!isCurrentWeek && (
              <button
                type="button"
                onClick={handleResetToCurrent}
                className="btn btn-icon planner__reset-btn"
                title={t('planner.currentWeek')}
                style={{ padding: '8px', marginLeft: '2px' }}
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

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
            {hasTasksThisWeek ? (t('planner.regenerate') || 'Regenerate Plan') : t('planner.generate')}
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

      {!loading && (
        <>
          {!hasTasksThisWeek && (
            <div className="planner__quick-hint animate-fade-in">
              <Sparkles size={14} style={{ color: 'var(--energy-primary)', flexShrink: 0 }} />
              <span>{t('planner.dragHint')}</span>
            </div>
          )}

          <div className="planner__week animate-fade-in">
            {(() => {
              const taskOccurrences = {};
              dayKeys.forEach(dayKey => {
                const dayTasks = planData[dayKey] || [];
                dayTasks.forEach(t => {
                  taskOccurrences[t.taskId] = (taskOccurrences[t.taskId] || 0) + 1;
                });
              });

              const taskCurrentPart = {};

              return weekDays.map((date, i) => {
                const dayKey = dayKeys[i];
                const rawDayTasks = planData[dayKey] || [];
                const isToday = toInputDate(date) === today;

                const dayTasks = rawDayTasks.map(t => {
                  const total = taskOccurrences[t.taskId];
                  if (total > 1) {
                    taskCurrentPart[t.taskId] = (taskCurrentPart[t.taskId] || 0) + 1;
                    return {
                      ...t,
                      isChunk: true,
                      chunkLabel: `Part ${taskCurrentPart[t.taskId]} / ${total}`
                    };
                  }
                  return { ...t, isChunk: false, chunkLabel: '' };
                });

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
              });
            })()}
          </div>
        </>
      )}
    </div>
  );
}
