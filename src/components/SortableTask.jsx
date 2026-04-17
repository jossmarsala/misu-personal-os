import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getEnergyDef } from '../utils/energy';
import GradientOrb from './GradientOrb';
import { X } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

export default function SortableTask({ id, task, t, children }) {
  const { setWeeklyPlan } = useTasks();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: 'planner-block' } });

  const energyDef = getEnergyDef(task.energyRequired || 3);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.6 : 1,
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setWeeklyPlan(prev => {
      const nextPlan = { ...prev };
      for (const day in nextPlan) {
        nextPlan[day] = nextPlan[day].filter(t => t.dndId !== id);
      }
      return nextPlan;
    });
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

        <button 
          className="planner__task-delete" 
          onClick={handleDelete}
          aria-label={t('common.delete')}
        >
          <X size={12} strokeWidth={3} />
        </button>
      </div>
      {children}
    </div>
  );
}
