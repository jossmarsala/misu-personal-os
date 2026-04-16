import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useTasks } from '../context/TaskContext';
import { useEnergy } from '../context/EnergyContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Sun, Moon, Plus, CheckCircle, Search, Earth } from 'lucide-react';
import { getEnergyDef } from '../utils/energy';
import GradientOrb from './GradientOrb';
import './CommandPalette.css';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  const { addTask } = useTasks();
  const { setCurrentEnergy } = useEnergy();
  const { t, setLanguage } = useLanguage();
  const { mode, toggleMode } = useTheme();

  const e1 = getEnergyDef(1);
  const e3 = getEnergyDef(3);
  const e5 = getEnergyDef(5);

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleQuickAdd = () => {
    if (inputValue) {
      addTask({
        title: inputValue,
        energyRequired: 3, // Default to moderate
        estimatedHours: 1,
      });
      setInputValue('');
      setOpen(false);
    }
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="cmdk-dialog"
    >
      <div className="cmdk-header">
        <Search size={16} />
        <Command.Input 
          autoFocus 
          placeholder={t('hero.title') + '...'} 
          value={inputValue}
          onValueChange={setInputValue}
        />
      </div>

      <Command.List className="cmdk-list">
        <Command.Empty>{t('tasks.emptyState')}</Command.Empty>

        {inputValue && (
          <Command.Group heading="Quick Add">
            <Command.Item onSelect={handleQuickAdd} className="cmdk-item item-add">
              <Plus size={14} /> Add "{inputValue}"
            </Command.Item>
          </Command.Group>
        )}

        <Command.Group heading="Energy Level">
          <Command.Item onSelect={() => { setCurrentEnergy(1); setOpen(false); }} className="cmdk-item">
            <div style={{ width: '14px', height: '14px', marginRight: '8px', display: 'flex', alignItems: 'center' }}>
              <GradientOrb color={e1.vividColorA} size="100%" />
            </div>
            {t('energy.1.label')}
          </Command.Item>
          <Command.Item onSelect={() => { setCurrentEnergy(3); setOpen(false); }} className="cmdk-item">
            <div style={{ width: '14px', height: '14px', marginRight: '8px', display: 'flex', alignItems: 'center' }}>
              <GradientOrb color={e3.vividColorA} size="100%" />
            </div>
            {t('energy.3.label')}
          </Command.Item>
          <Command.Item onSelect={() => { setCurrentEnergy(5); setOpen(false); }} className="cmdk-item">
            <div style={{ width: '14px', height: '14px', marginRight: '8px', display: 'flex', alignItems: 'center' }}>
              <GradientOrb color={e5.vividColorA} size="100%" />
            </div>
            {t('energy.5.label')} (Focus)
          </Command.Item>
        </Command.Group>

        <Command.Group heading="System">
          <Command.Item onSelect={() => { toggleMode(); setOpen(false); }}>
            {mode === 'dark' ? <Sun size={14} /> : <Moon size={14} />} 
            Toggle Theme
          </Command.Item>
          <Command.Item onSelect={() => { setLanguage('es'); setOpen(false); }}>
            <Earth size={14} /> Español
          </Command.Item>
          <Command.Item onSelect={() => { setLanguage('en'); setOpen(false); }}>
            <Earth size={14} /> English
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
