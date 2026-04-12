import { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { generateWeeklyPlan } from '../services/gemini';
import { getWeekDays, formatDayShort, toInputDate } from '../utils/dateUtils';
import { loadSettings } from '../services/storage';
import { Calendar, Sparkles, RefreshCw } from 'lucide-react';
import './WeeklyPlanner.css';

const DAYS_KEY = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function WeeklyPlanner() {
  const { tasks } = useTasks();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const weekDays = getWeekDays();
  const today = toInputDate(new Date());

  const handleGenerate = async () => {
    const settings = loadSettings();
    const apiKey = settings.geminiApiKey;

    if (!apiKey) {
      setError('Please add your Gemini API key in Settings first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateWeeklyPlan(tasks, apiKey);
      setPlan(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="planner" id="weekly-planner">
      <div className="planner__header">
        <div className="planner__title-area">
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            <Calendar size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            Weekly Plan
          </h2>
          <p className="section-subtitle">AI-powered schedule based on your tasks</p>
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
            {plan ? 'Regenerate Plan' : 'Generate Weekly Plan'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="planner__loading animate-fade-in">
          <div className="planner__loading-dots">
            <div className="planner__loading-dot" />
            <div className="planner__loading-dot" />
            <div className="planner__loading-dot" />
          </div>
          <span className="planner__loading-text">
            Crafting your perfect week...
          </span>
        </div>
      )}

      {error && (
        <div className="planner__error animate-fade-in">{error}</div>
      )}

      {!loading && !plan && !error && (
        <div className="planner__empty">
          <span className="planner__empty-icon">📅</span>
          <p>Click "Generate Weekly Plan" to let AI organize your week.</p>
          <p className="section-subtitle" style={{ marginTop: '8px' }}>
            {tasks.filter(t => !t.completed).length} active tasks ready to schedule
          </p>
        </div>
      )}

      {!loading && plan && (
        <div className="planner__week animate-fade-in">
          {weekDays.map((date, i) => {
            const dayKey = DAYS_KEY[i];
            const dayTasks = plan[dayKey] || [];
            const isToday = toInputDate(date) === today;

            return (
              <div
                key={dayKey}
                className={`planner__day glass-subtle ${isToday ? 'planner__day-today' : ''}`}
              >
                <div className="planner__day-header">
                  <span className="planner__day-name">
                    {formatDayShort(date)}
                  </span>
                  <span className="planner__day-date">
                    {date.getDate()}
                  </span>
                </div>

                <div className="planner__day-tasks stagger-children">
                  {dayTasks.length > 0 ? (
                    dayTasks.map((task, j) => (
                      <div key={`${dayKey}-${j}`} className="planner__task">
                        <div className="planner__task-title">{task.title}</div>
                        <div className="planner__task-hours">{task.hours}h</div>
                        {task.isChunk && (
                          <div className="planner__task-chunk">{task.chunkLabel}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="planner__day-empty">Rest day</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
