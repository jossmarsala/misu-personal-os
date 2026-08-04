import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('misu-language') || 'en';
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
