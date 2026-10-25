import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

const SUPPORTED_LANGUAGES = ['en', 'es', 'it'];

function getDeviceLanguage() {
  if (typeof navigator === 'undefined') return 'en';
  // Check navigator.languages list or navigator.language
  const candidates = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language,
    navigator.userLanguage,
  ].filter(Boolean);

  for (const lang of candidates) {
    const code = lang.toLowerCase().split(/[-_]/)[0];
    if (SUPPORTED_LANGUAGES.includes(code)) {
      return code;
    }
  }
  return 'en';
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('misu-language') || getDeviceLanguage();
  });

  useEffect(() => {
    localStorage.setItem('misu-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (path) => {
    if (typeof path !== 'string') return path;
    const keys = path.split('.');
    let result = translations[language];
    for (const key of keys) {
      // Guard: if result is null/primitive mid-path, avoid crash and return the key
      if (result == null || typeof result !== 'object') return path;
      if (result[key] === undefined) return path;
      result = result[key];
    }
    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
