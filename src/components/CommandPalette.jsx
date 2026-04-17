import { useState, useEffect, useCallback } from 'react';
import { Command } from 'cmdk';
import { useTasks } from '../context/TaskContext';
import { useEnergy } from '../context/EnergyContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  Timer, Music, Shield, Calendar, Settings,
  Sun, Moon, Plus, CheckCheck, Trash2, Globe,
  Zap, Battery, BatteryLow, BatteryMedium, BatteryFull,
  Search, X, ArrowRight, ClipboardList, Clock
} from 'lucide-react';
import { getEnergyDef, ENERGY_LEVELS } from '../utils/energy';
import './CommandPalette.css';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const { addTask, tasks, clearAll } = useTasks();
  const { currentEnergy, setCurrentEnergy } = useEnergy();
  const { t, setLanguage, language } = useLanguage();
  const { mode, toggleMode } = useTheme();

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  // Toggle on ⌘K / Ctrl+K
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Reset input on close
  useEffect(() => {
    if (!open) setInputValue('');
  }, [open]);

  // Fire widget toggle events so App.jsx can respond
  const fireCommand = useCallback((action) => {
    window.dispatchEvent(new CustomEvent('misu:command', { detail: { action } }));
    setOpen(false);
  }, []);

  const handleQuickAdd = useCallback(() => {
    if (!inputValue.trim()) return;
    addTask({
      title: inputValue.trim(),
      energyRequired: currentEnergy,
      estimatedHours: 1,
    });
    setInputValue('');
    setOpen(false);
  }, [inputValue, addTask, currentEnergy]);

  const clearCompleted = useCallback(() => {
    // Only remove completed tasks
    window.dispatchEvent(new CustomEvent('misu:command', { detail: { action: 'clear-completed' } }));
    setOpen(false);
  }, []);

  const energyIcons = [BatteryLow, BatteryLow, BatteryMedium, BatteryMedium, BatteryFull, BatteryFull];

  return (
    <>
      {open && (
        <div className="cmdk-overlay" onClick={() => setOpen(false)} aria-hidden="true" />
      )}
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Command Palette"
        className="cmdk-dialog"
        shouldFilter={true}
      >
        {/* Header */}
        <div className="cmdk-header">
          <Search size={18} className="cmdk-search-icon" />
          <Command.Input
            autoFocus
            placeholder="Search commands or type to add a task..."
            value={inputValue}
            onValueChange={setInputValue}
            className="cmdk-input"
          />
          {inputValue && (
            <button className="cmdk-clear-btn" onClick={() => setInputValue('')} tabIndex={-1}>
              <X size={16} />
            </button>
          )}
          <kbd className="cmdk-esc-hint" onClick={() => setOpen(false)}>esc</kbd>
        </div>

        {/* Status bar */}
        <div className="cmdk-status-bar">
          <span className="cmdk-status-pill">
            <Zap size={11} />
            {t(`energy.${currentEnergy}.label`)}
          </span>
          <span className="cmdk-status-pill">
            <ClipboardList size={11} />
            {activeTasks.length} active
          </span>
          {completedTasks.length > 0 && (
            <span className="cmdk-status-pill">
              <CheckCheck size={11} />
              {completedTasks.length} done
            </span>
          )}
        </div>

        <Command.List className="cmdk-list">
          <Command.Empty className="cmdk-empty">
            <div className="cmdk-empty-inner">
              <Plus size={36} strokeWidth={1.5} />
              <div>
                <p>No commands found</p>
                <span>Press ↵ to add "{inputValue}" as a task</span>
              </div>
            </div>
          </Command.Empty>

          {/* Quick add — only when the user has typed something */}
          {inputValue.trim() && (
            <Command.Group heading="New Task" className="cmdk-group">
              <Command.Item
                value={`add-task-${inputValue}`}
                onSelect={handleQuickAdd}
                className="cmdk-item cmdk-item--accent"
              >
                <div className="cmdk-item-icon cmdk-item-icon--accent">
                  <Plus size={18} />
                </div>
                <div className="cmdk-item-content">
                  <span className="cmdk-item-label">Add "{inputValue}"</span>
                  <span className="cmdk-item-hint">Energy: {t(`energy.${currentEnergy}.label`)}</span>
                </div>
                <kbd className="cmdk-kbd">↵</kbd>
              </Command.Item>
            </Command.Group>
          )}

          {/* Widgets */}
          <Command.Group heading="Widgets" className="cmdk-group">
            <Command.Item value="toggle focus timer pomodoro" onSelect={() => fireCommand('toggle-pomodoro')} className="cmdk-item">
              <div className="cmdk-item-icon"><Timer size={18} /></div>
              <div className="cmdk-item-content">
                <span className="cmdk-item-label">Focus Timer</span>
                <span className="cmdk-item-hint">Toggle Pomodoro</span>
              </div>
              <kbd className="cmdk-shortcut">⌘ T</kbd>
            </Command.Item>
            <Command.Item value="toggle music audio player" onSelect={() => fireCommand('toggle-music')} className="cmdk-item">
              <div className="cmdk-item-icon"><Music size={18} /></div>
              <div className="cmdk-item-content">
                <span className="cmdk-item-label">Music Player</span>
                <span className="cmdk-item-hint">Ambient sounds</span>
              </div>
            </Command.Item>
            <Command.Item value="toggle calendar view" onSelect={() => fireCommand('toggle-calendar')} className="cmdk-item">
              <div className="cmdk-item-icon"><Calendar size={18} /></div>
              <div className="cmdk-item-content">
                <span className="cmdk-item-label">Calendar</span>
                <span className="cmdk-item-hint">Monthly overview</span>
              </div>
            </Command.Item>
            <Command.Item value="toggle dnd focus shield mode" onSelect={() => fireCommand('toggle-dnd')} className="cmdk-item">
              <div className="cmdk-item-icon"><Shield size={18} /></div>
              <div className="cmdk-item-content">
                <span className="cmdk-item-label">Focus Shield</span>
                <span className="cmdk-item-hint">Block distractions</span>
              </div>
            </Command.Item>
          </Command.Group>

          {/* Energy Level */}
          <Command.Group heading="Energy Level" className="cmdk-group">
            {ENERGY_LEVELS.map((level) => {
              const isActive = currentEnergy === level.level;
              return (
                <Command.Item
                  key={level.level}
                  value={`energy ${level.level} ${level.name}`}
                  onSelect={() => { setCurrentEnergy(level.level); setOpen(false); }}
                  className={`cmdk-item ${isActive ? 'cmdk-item--active' : ''}`}
                >
                  <div
                    className="cmdk-energy-dot"
                    style={{ background: `linear-gradient(135deg, ${level.colorA}, ${level.colorB})` }}
                  />
                  <div className="cmdk-item-content">
                    <span className="cmdk-item-label">{level.name}</span>
                    <span className="cmdk-item-hint">Level {level.level}</span>
                  </div>
                  {isActive && <span className="cmdk-active-badge">current</span>}
                </Command.Item>
              );
            })}
          </Command.Group>

          {/* Tasks */}
          <Command.Group heading="Tasks" className="cmdk-group">
            {completedTasks.length > 0 && (
              <Command.Item value="clear completed tasks done" onSelect={clearCompleted} className="cmdk-item cmdk-item--danger">
                <div className="cmdk-item-icon"><CheckCheck size={18} /></div>
                <div className="cmdk-item-content">
                  <span className="cmdk-item-label">Clear Completed</span>
                  <span className="cmdk-item-hint">Remove {completedTasks.length} done tasks</span>
                </div>
              </Command.Item>
            )}
            <Command.Item value="open settings preferences" onSelect={() => fireCommand('open-settings')} className="cmdk-item">
              <div className="cmdk-item-icon"><Settings size={18} /></div>
              <div className="cmdk-item-content">
                <span className="cmdk-item-label">Settings</span>
                <span className="cmdk-item-hint">API key, preferences</span>
              </div>
            </Command.Item>
          </Command.Group>

          {/* Appearance */}
          <Command.Group heading="Appearance" className="cmdk-group">
            <Command.Item value="toggle theme dark light mode" onSelect={() => { toggleMode(); setOpen(false); }} className="cmdk-item">
              <div className="cmdk-item-icon">
                {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </div>
              <div className="cmdk-item-content">
                <span className="cmdk-item-label">{mode === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                <span className="cmdk-item-hint">Switch theme</span>
              </div>
            </Command.Item>
            <Command.Item value="language español spanish" onSelect={() => { setLanguage('es'); setOpen(false); }} className={`cmdk-item ${language === 'es' ? 'cmdk-item--active' : ''}`}>
              <div className="cmdk-item-icon"><Globe size={18} /></div>
              <div className="cmdk-item-content">
                <span className="cmdk-item-label">Español</span>
              </div>
              {language === 'es' && <span className="cmdk-active-badge">active</span>}
            </Command.Item>
            <Command.Item value="language english" onSelect={() => { setLanguage('en'); setOpen(false); }} className={`cmdk-item ${language === 'en' ? 'cmdk-item--active' : ''}`}>
              <div className="cmdk-item-icon"><Globe size={18} /></div>
              <div className="cmdk-item-content">
                <span className="cmdk-item-label">English</span>
              </div>
              {language === 'en' && <span className="cmdk-active-badge">active</span>}
            </Command.Item>
            <Command.Item value="language italiano italian" onSelect={() => { setLanguage('it'); setOpen(false); }} className={`cmdk-item ${language === 'it' ? 'cmdk-item--active' : ''}`}>
              <div className="cmdk-item-icon"><Globe size={18} /></div>
              <div className="cmdk-item-content">
                <span className="cmdk-item-label">Italiano</span>
              </div>
              {language === 'it' && <span className="cmdk-active-badge">active</span>}
            </Command.Item>
          </Command.Group>
        </Command.List>

        {/* Footer hint */}
        <div className="cmdk-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </Command.Dialog>
    </>
  );
}
