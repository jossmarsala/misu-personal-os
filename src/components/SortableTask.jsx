import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getEnergyDef } from '../utils/energy';
import GradientOrb from './GradientOrb';

export default function SortableTask({ id, task, t, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const energyDef = getEnergyDef(task.energyRequired || 3);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`planner__task ${isDragging ? 'dragging' : ''}`}
    >
      <div className="planner__task-inner">
        <div className="planner__task-meta">
          <div style={{ width: '10px', height: '10px' }}>
            <GradientOrb color={energyDef.vividColorA} size="100%" />
          </div>
          <div className="planner__task-hours">{task.hours}{t('common.hours').substring(0, 1)}</div>
        </div>
        
        <div className="planner__task-content">
          <div className="planner__task-title">{task.title}</div>
          {task.isChunk && (
            <div className="planner__task-chunk">{task.chunkLabel}</div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
