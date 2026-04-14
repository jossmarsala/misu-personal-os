import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Languages } from 'lucide-react';
import './LanguageSwitcher.css';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'it', label: 'IT' },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-switcher" style={{ position: 'relative' }}>
      <select 
        className="btn btn-ghost" 
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        aria-label="Select Language"
        style={{ 
          padding: 'var(--space-2) var(--space-4)', 
          paddingRight: 'var(--space-6)',
          cursor: 'pointer', 
          appearance: 'none', 
          backgroundColor: 'transparent',
          border: '1px solid var(--btn-glass-border)'
        }}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} style={{ color: '#000' }}>
            {lang.label}
          </option>
        ))}
      </select>
      <Languages size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }} />
    </div>
  );
}
