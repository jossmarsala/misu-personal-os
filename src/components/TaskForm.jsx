import { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { Plus, X } from 'lucide-react';
import { ENERGY_LEVELS } from '../utils/energy';
import './TaskForm.css';

export default function TaskForm() {
  const { addTask } = useTasks();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '',
    estimatedHours: '',
    energyRequired: 3,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    addTask({
      ...form,
      estimatedHours: parseFloat(form.estimatedHours) || 1,
    });

    setForm({ title: '', description: '', deadline: '', estimatedHours: '', energyRequired: 3 });
    setIsOpen(false);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) {
    return (
      <div className="task-form">
        <button
          className="task-form__toggle"
          onClick={() => setIsOpen(true)}
          id="add-task-btn"
        >
          <Plus size={18} />
          Add new task
        </button>
      </div>
    );
  }

  return (
    <div className="task-form">
      <form onSubmit={handleSubmit} className="task-form__body glass-subtle" id="task-form">
        <div className="task-form__grid">
          <div className="task-form__group full-width">
            <label className="input-label">Title *</label>
            <input
              className="input"
              type="text"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              autoFocus
              required
              id="task-title-input"
            />
          </div>

          <div className="task-form__group">
            <label className="input-label">Deadline</label>
            <input
              className="input"
              type="date"
              value={form.deadline}
              onChange={e => handleChange('deadline', e.target.value)}
              id="task-deadline-input"
            />
          </div>

          <div className="task-form__group">
            <label className="input-label">Estimated Hours</label>
            <input
              className="input"
              type="number"
              min="0.5"
              max="100"
              step="0.5"
              placeholder="e.g. 2"
              value={form.estimatedHours}
              onChange={e => handleChange('estimatedHours', e.target.value)}
              id="task-hours-input"
            />
          </div>

          <div className="task-form__group full-width">
            <label className="input-label">Energy Required</label>
            <div className="task-form__energy-row">
              {ENERGY_LEVELS.map(e => (
                <button
                  key={e.level}
                  type="button"
                  className={`task-form__energy-btn ${form.energyRequired === e.level ? 'selected' : ''}`}
                  onClick={() => handleChange('energyRequired', e.level)}
                >
                  {e.emoji} {e.label}
                </button>
              ))}
            </div>
          </div>

          <div className="task-form__group full-width">
            <label className="input-label">Description (optional)</label>
            <textarea
              className="input"
              placeholder="Add context or notes..."
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              rows={3}
              id="task-desc-input"
            />
          </div>
        </div>

        <div className="task-form__actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setIsOpen(false)}
          >
            <X size={16} /> Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!form.title.trim()}
            id="task-submit-btn"
          >
            <Plus size={16} /> Create Task
          </button>
        </div>
      </form>
    </div>
  );
}
