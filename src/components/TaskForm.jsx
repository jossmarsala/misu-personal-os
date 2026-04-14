import { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { Plus, X } from 'lucide-react';
import { ENERGY_LEVELS } from '../utils/energy';
import { useLanguage } from '../context/LanguageContext';
import './TaskForm.css';

import { useEnergy } from '../context/EnergyContext';
import { playUISound } from '../services/AudioService';
import './TaskForm.css';

export default function TaskForm() {
  const { addTask } = useTasks();
  const { t } = useLanguage();
  const { currentEnergy } = useEnergy();
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

    playUISound('click', currentEnergy);
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
          onClick={() => {
            playUISound('switch', currentEnergy);
            setIsOpen(true);
          }}
          id="add-task-btn"
        >
          <Plus size={18} />
          {t('tasks.addNew')}
        </button>
      </div>
    );
  }

  return (
    <div className="task-form">
      <form onSubmit={handleSubmit} className="task-form__body glass-subtle" id="task-form">
        <div className="task-form__grid">
          <div className="task-form__group full-width">
            <label className="input-label">{t('tasks.fieldTitle')} *</label>
            <input
              className="input"
              type="text"
              placeholder={t('tasks.fieldTitle') + '...'}
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              autoFocus
              required
              id="task-title-input"
            />
          </div>

          <div className="task-form__group">
            <label className="input-label">{t('tasks.fieldDeadline')}</label>
            <input
              className="input"
              type="date"
              value={form.deadline}
              onChange={e => handleChange('deadline', e.target.value)}
              id="task-deadline-input"
            />
          </div>

          <div className="task-form__group">
            <label className="input-label">{t('tasks.fieldHours')}</label>
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
            <label className="input-label">{t('tasks.fieldEnergy')}</label>
            <div className="task-form__energy-row">
              {ENERGY_LEVELS.map(e => (
                <button
                  key={e.level}
                  type="button"
                  className={`task-form__energy-btn ${form.energyRequired === e.level ? 'selected' : ''}`}
                  onClick={() => handleChange('energyRequired', e.level)}
                  title={t(`energy.${e.level}.label`)}
                >
                  {e.emoji} {t(`energy.${e.level}.label`)}
                </button>
              ))}
            </div>
          </div>

          <div className="task-form__group full-width">
            <label className="input-label">{t('tasks.fieldDescription')}</label>
            <textarea
              className="input"
              placeholder="..."
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
            <X size={16} /> {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!form.title.trim()}
            id="task-submit-btn"
          >
            <Plus size={16} /> {t('tasks.create')}
          </button>
        </div>
      </form>
    </div>
  );
}
