import { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { Check, Pencil, Trash2, X, Save, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { getEnergyDef } from '../utils/energy';
import { formatDeadline, getDeadlineStatus } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';
import { useEnergy } from '../context/EnergyContext';
import { playUISound } from '../services/AudioService';
import GradientOrb from './GradientOrb';
import './TaskCard.css';

import { motion, AnimatePresence } from 'framer-motion';

export default function TaskCard({ task }) {
  const { toggleComplete, updateTask, deleteTask, setFocusedTaskId } = useTasks();
  const { t } = useLanguage();
  const { currentEnergy } = useEnergy();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const energy = getEnergyDef(task.energyRequired);
  const deadlineStatus = getDeadlineStatus(task.deadline);
  
  const getDeadlineText = (deadline) => {
    if (!deadline) return '';
    const status = getDeadlineStatus(deadline);
    if (status === 'today') return t('common.today');
    if (status === 'tomorrow') return t('common.tomorrow');
    if (status === 'overdue') return t('common.overdue');
    return formatDeadline(deadline); 
  };

  const deadlineText = getDeadlineText(task.deadline);

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      updateTask(task.id, { title: editTitle.trim() });
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (confirmDelete) {
      deleteTask(task.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const deadlineBadgeClass = {
    overdue: 'badge badge-danger',
    today: 'badge badge-warning',
    tomorrow: 'badge badge-warning',
    soon: 'badge badge-energy',
    normal: 'badge badge-energy',
  }[deadlineStatus] || '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className={`task-card ${task.completed ? 'completed' : ''}`}
      data-task-energy={task.energyRequired}
      id={`task-${task.id}`}
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        className={`task-card__checkbox ${task.completed ? 'checked' : ''}`}
        onClick={() => {
          toggleComplete(task.id);
          playUISound('complete', currentEnergy);
        }}
        aria-label={task.completed ? t('common.active') : t('common.completed')}
      >
        <AnimatePresence mode="wait">
          {task.completed && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 45 }}
              key="check"
            >
              <Check size={14} color="white" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <div className="task-card__content">
        {isEditing ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              className="task-card__edit-input"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button className="btn btn-ghost btn-sm" onClick={handleSaveEdit}>
              <Save size={14} />
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setEditTitle(task.title); setIsEditing(false); }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div
              className="task-card__title"
              onClick={() => task.description && setExpanded(!expanded)}
              style={{ cursor: task.description ? 'pointer' : 'default' }}
            >
              {task.title}
              {task.description && (
                <span style={{ marginLeft: '4px', opacity: 0.4 }}>
                  {expanded ? <ChevronUp size={14} style={{ verticalAlign: 'middle' }} /> : <ChevronDown size={14} style={{ verticalAlign: 'middle' }} />}
                </span>
              )}
            </div>
            
            <AnimatePresence>
              {expanded && task.description && (
                <motion.p 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 0.7 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="task-card__desc"
                >
                  {task.description}
                </motion.p>
              )}
            </AnimatePresence>
          </>
        )}

        <div className="task-card__meta">
          {deadlineText && (
            <span className={deadlineBadgeClass}>{deadlineText}</span>
          )}
          <span className="badge badge-energy" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px' }}>
              <GradientOrb color={energy.vividColorA} size="100%" />
            </div>
            {energy.name}
          </span>
          {task.estimatedHours && (
            <span className="task-card__duration">{task.estimatedHours}{t('common.hours').substring(0,1)}</span>
          )}
        </div>
      </div>

      <div className="task-card__actions" style={{ flexShrink: 0 }}>
        {!task.completed && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="btn btn-ghost btn-icon btn-sm"
            onClick={() => setFocusedTaskId(task.id)}
            aria-label="Zen Focus"
            title="Zen Focus"
          >
            <Play size={14} />
          </motion.button>
        )}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="btn btn-ghost btn-icon btn-sm"
          onClick={() => { setIsEditing(true); setEditTitle(task.title); }}
          aria-label={t('common.edit')}
        >
          <Pencil size={14} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`btn ${confirmDelete ? 'btn-danger' : 'btn-ghost'} btn-icon btn-sm`}
          onClick={handleDelete}
          aria-label={confirmDelete ? t('common.delete') : t('common.delete')}
        >
          <Trash2 size={14} />
        </motion.button>
      </div>
    </motion.div>
  );
}
