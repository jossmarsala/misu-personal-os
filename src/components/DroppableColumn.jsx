import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableTask from './SortableTask';

export default function DroppableColumn({ id, dayTasks, t, dayName, dayDate, isToday }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`planner__day glass-subtle ${isToday ? 'planner__day-today' : ''} ${isOver ? 'highlighted-drop' : ''}`}
      style={{
         transition: 'background 0.2s',
         backgroundColor: isOver ? 'var(--energy-surface)' : undefined
      }}
    >
      <div className="planner__day-header">
        <span className="planner__day-name">{dayName}</span>
        <span className="planner__day-date">{dayDate}</span>
      </div>

      <div className="planner__day-tasks stagger-children" style={{ minHeight: '100px' }}>
        <SortableContext
          id={id}
          items={dayTasks.map(task => task.dndId)}
          strategy={verticalListSortingStrategy}
        >
          {dayTasks.length > 0 ? (
            dayTasks.map(task => (
              <SortableTask key={task.dndId} id={task.dndId} task={task} t={t} />
            ))
          ) : (
            <div className="planner__day-empty">{t('planner.restDay')}</div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
