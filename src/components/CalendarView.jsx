import { useState, useMemo } from 'react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { formatDayShort, toInputDate } from '../utils/dateUtils';
import DraggableWidget from './DraggableWidget';
import { getEnergyColor } from '../utils/energy';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './CalendarView.css';

export default function CalendarView({ visible, onClose }) {
  const { tasks, weeklyPlan } = useTasks();
  const { t, language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());


  const tasksWithDeadlines = useMemo(() => {
    return tasks.filter(t => t.deadline);
  }, [tasks]);

  const weeklyPlanTasks = useMemo(() => {
    if (!weeklyPlan) return [];
    const all = [];
    Object.keys(weeklyPlan).forEach(day => {
      weeklyPlan[day].forEach(task => {
        // Look up original task to get energy level and detailed description
        const original = tasks.find(t => t.id === task.taskId);
        all.push({ 
          ...task, 
          scheduledDate: day,
          energyRequired: original?.energyRequired || task.energyRequired || 3,
          description: original?.description || task.description || ''
        });
      });
    });
    return all;
  }, [weeklyPlan, tasks]);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday start
    
    // Previous month padding
    for (let i = startOffset; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // A4: Dynamic padding — only fill to a complete row (not always 42 cells)
    const remainder = days.length % 7;
    if (remainder !== 0) {
      const endOffset = 7 - remainder;
      for (let i = 1; i <= endOffset; i++) {
        days.push(new Date(year, month + 1, i));
      }
    }
    
    return days;
  }, [currentMonth]);

  const monthName = currentMonth.toLocaleString(language, { month: 'long', year: 'numeric' });

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  if (!visible) return null;

  return (
    <DraggableWidget 
      id="calendar-widget" 
      title={t('widgets.calendar')} 
      icon={<CalendarIcon size={14} />}
      defaultPosition={{ x: 100, y: 100 }}
      customWidth={320}
    >
      <div className="calendar-widget">
        <div className="calendar-widget__nav">
          <button onClick={prevMonth} className="calendar-nav-btn"><ChevronLeft size={16} /></button>
          <span className="calendar-month-title">{monthName}</span>
          <button onClick={nextMonth} className="calendar-nav-btn"><ChevronRight size={16} /></button>
        </div>

        <div className="calendar-grid">
          {/* X8: Locale-aware weekday headers */}
          {Array.from({ length: 7 }, (_, i) => {
            // Monday-first: 0=Mon, 6=Sun; adjust reference date to a known Monday
            const refMonday = new Date(2024, 0, 1); // Jan 1 2024 is a Monday
            const d = new Date(refMonday);
            d.setDate(refMonday.getDate() + i);
            return d.toLocaleDateString(language, { weekday: 'narrow' });
          }).map((day, i) => (
            <div key={i} className="calendar-grid__weekday">{day}</div>
          ))}
          {daysInMonth.map((date, i) => {
            const dateStr = toInputDate(date);
            const isToday = dateStr === toInputDate(new Date());
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            
            // Combine tasks with deadlines and weekly plan scheduled tasks
            const dailyTasks = [
              ...tasksWithDeadlines.filter(t => t.deadline === dateStr),
              ...weeklyPlanTasks.filter(t => t.scheduledDate === dateStr)
            ].filter((v, i, a) => a.findIndex(t => (t.id || t.taskId) === (v.id || v.taskId)) === i);

            return (
              <div 
                key={i} 
                className={`calendar-day ${isCurrentMonth ? '' : 'outside'} ${isToday ? 'today' : ''}`}
              >
                <span className="day-number">{date.getDate()}</span>
                <div className="day-tasks">
                  {dailyTasks.map((task, idx) => (
                    <div 
                      key={idx} 
                      className="calendar-task-dot"
                    >
                      <div className="calendar-task-hover-tag">
                        {task.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>


      </div>
    </DraggableWidget>
  );
}
