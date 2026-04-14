import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function SortableTask({ id, task, t, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    zIndex: isDragging ? 1 : 0,
    boxShadow: isDragging ? 'var(--shadow-md)' : 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`planner__task ${isDragging ? 'dragging' : ''}`}
    >
      <div className="planner__task-title">{task.title}</div>
      <div className="planner__task-hours">{task.hours}{t('common.hours').substring(0, 1)}</div>
      {task.isChunk && (
        <div className="planner__task-chunk">{task.chunkLabel}</div>
      )}
      {children}
    </div>
  );
}
