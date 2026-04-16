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

  // Resizing state (specific to Calendar for now as requested)
  const [size, setSize] = useState({ width: 420, height: 420 });

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
    
    // Next month padding
    const endOffset = 42 - days.length;
    for (let i = 1; i <= endOffset; i++) {
      days.push(new Date(year, month + 1, i));
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
      customWidth={size.width}
    >
      <div className="calendar-widget" style={{ width: size.width, height: size.height }}>
        <div className="calendar-widget__nav">
          <button onClick={prevMonth} className="calendar-nav-btn"><ChevronLeft size={16} /></button>
          <span className="calendar-month-title">{monthName}</span>
          <button onClick={nextMonth} className="calendar-nav-btn"><ChevronRight size={16} /></button>
        </div>

        <div className="calendar-grid">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
            <div key={d} className="calendar-grid__weekday">{d}</div>
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
                      style={{ backgroundColor: getEnergyColor(task.energyRequired || 3) }}
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

        {/* Resize Handle */}
        <div 
          className="calendar-resize-handle"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startY = e.clientY;
            const startW = size.width;
            const startH = size.height;

            const onMouseMove = (moveEvent) => {
              setSize({
                width: Math.max(300, startW + (moveEvent.clientX - startX)),
                height: Math.max(300, startH + (moveEvent.clientY - startY))
              });
            };

            const onMouseUp = () => {
              window.removeEventListener('mousemove', onMouseMove);
              window.removeEventListener('mouseup', onMouseUp);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
          }}
        >
          <div className="resize-handle-icon" />
        </div>

      </div>
    </DraggableWidget>
  );
}
