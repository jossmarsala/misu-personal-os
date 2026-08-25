import { useState, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import { Plus, X, Calendar, Clock, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { ENERGY_LEVELS } from '../utils/energy';
import { CATEGORIES, getCategoryDef } from '../utils/categories';
import { useLanguage } from '../context/LanguageContext';
import { useEnergy } from '../context/EnergyContext';
import { playUISound } from '../services/AudioService';
import GradientOrb from './GradientOrb';
import './TaskForm.css';

export default function TaskForm() {
  const { addTask } = useTasks();
  const { t } = useLanguage();
  const { currentEnergy } = useEnergy();
  const [isOpen, setIsOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '',
    estimatedHours: '',
    energyRequired: currentEnergy,
    category: 'other',
  });
  const titleRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    playUISound('click', currentEnergy);
    addTask({
      ...form,
      estimatedHours: parseFloat(form.estimatedHours) || 1,
    });

    setForm({ title: '', description: '', deadline: '', estimatedHours: '', energyRequired: currentEnergy, category: 'other' });
    setShowMore(false);
    setShowCategoryPicker(false);
    setIsOpen(false);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleOpen = () => {
    playUISound('switch', currentEnergy);
    setIsOpen(true);
    setTimeout(() => titleRef.current?.focus(), 50);
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowMore(false);
    setShowCategoryPicker(false);
    setForm({ title: '', description: '', deadline: '', estimatedHours: '', energyRequired: currentEnergy, category: 'other' });
  };

  if (!isOpen) {
    return (
      <div className="task-form">
        <button className="task-form__toggle" onClick={handleOpen} id="add-task-btn">
          <Plus size={16} />
          {t('tasks.addNew')}
        </button>
      </div>
    );
  }

  const selectedEnergy = ENERGY_LEVELS.find(e => e.level === form.energyRequired);

  return (
    <div className="task-form">
      <form onSubmit={handleSubmit} className="task-form__body" id="task-form">

        {/* Primary row: title + submit */}
        <div className="task-form__primary">
          <input
            ref={titleRef}
            className="task-form__title-input"
            type="text"
            placeholder={t('tasks.fieldTitle') + '...'}
            value={form.title}
            onChange={e => handleChange('title', e.target.value)}
            required
            id="task-title-input"
          />
          <button
            type="submit"
            className="btn btn-primary task-form__submit"
            disabled={!form.title.trim()}
            id="task-submit-btn"
          >
            <Plus size={15} />
          </button>
          <button type="button" className="task-form__close-btn" onClick={handleClose} aria-label="Cancel">
            <X size={15} />
          </button>
        </div>

        {/* Secondary row: quick meta fields */}
        <div className="task-form__meta-row">
          {/* Deadline */}
          <label className="task-form__meta-pill task-form__meta-pill--date" title={t('tasks.fieldDeadline')}>
            <Calendar size={13} />
            <input
              type="date"
              className="task-form__meta-input"
              value={form.deadline}
              onChange={e => handleChange('deadline', e.target.value)}
              id="task-deadline-input"
            />
            <span className="task-form__meta-placeholder">{form.deadline || t('tasks.fieldDeadline')}</span>
          </label>

          {/* Hours */}
          <label className="task-form__meta-pill task-form__meta-pill--number" title={t('tasks.fieldHours')}>
            <Clock size={13} />
            <input
              type="number"
              className="task-form__meta-input"
              min="0.5" max="100" step="0.5"
              placeholder="e.g. 2"
              value={form.estimatedHours}
              onChange={e => handleChange('estimatedHours', e.target.value)}
              id="task-hours-input"
            />
            <span>{t('common.hoursCapitalized')}</span>
          </label>

          {/* Energy selector pill */}
          <div className="task-form__energy-picker">
            {ENERGY_LEVELS.map(e => (
              <button
                key={e.level}
                type="button"
                className={`task-form__energy-dot ${form.energyRequired === e.level ? 'selected' : ''}`}
                onClick={() => handleChange('energyRequired', e.level)}
                title={t(`energy.${e.level}.label`)}
                style={form.energyRequired === e.level ? { '--dot-shadow': `0 0 8px ${e.vividColorA}` } : {}}
              >
                <GradientOrb color={e.vividColorA} size="16px" />
              </button>
            ))}
            <span className="task-form__energy-label" style={{ color: selectedEnergy?.vividColorA }}>
              {t(`energy.${form.energyRequired}.label`)}
            </span>
          </div>

          {/* Category picker */}
          <div className="task-form__category-wrapper">
            <button
              type="button"
              className="task-form__meta-pill task-form__meta-pill--category"
              onClick={() => setShowCategoryPicker(v => !v)}
              title={t('tasks.fieldCategory')}
              style={{
                background: getCategoryDef(form.category).colorBg,
                borderColor: getCategoryDef(form.category).colorBorder,
                color: getCategoryDef(form.category).color,
              }}
            >
              <Tag size={12} />
              <span>{getCategoryDef(form.category).icon} {t(`categories.${form.category}`) || getCategoryDef(form.category).labels.en}</span>
              <ChevronDown size={11} style={{ opacity: 0.7 }} />
            </button>

            {showCategoryPicker && (
              <div className="task-form__category-dropdown">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`task-form__category-option ${form.category === cat.id ? 'selected' : ''}`}
                    onClick={() => { handleChange('category', cat.id); setShowCategoryPicker(false); }}
                    style={form.category === cat.id ? {
                      background: cat.colorBg,
                      color: cat.color,
                      borderColor: cat.colorBorder,
                    } : {}}
                  >
                    <span className="task-form__category-option-icon">{cat.icon}</span>
                    <span>{t(`categories.${cat.id}`) || cat.labels.en}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toggle more */}  
          <button
            type="button"
            className="task-form__more-btn"
            onClick={() => setShowMore(v => !v)}
            title={t('tasks.fieldDescription')}
          >
            {showMore ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Optional: description */}
        {showMore && (
          <div className="task-form__extra animate-slide-up">
            <textarea
              className="input task-form__desc"
              placeholder={t('tasks.fieldDescription')}
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              rows={2}
              id="task-desc-input"
            />
          </div>
        )}
      </form>
    </div>
  );
}
