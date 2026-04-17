import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import BlurText from './BlurText';

export default function Clock() {
  const [time, setTime] = useState(new Date());
  const { language } = useLanguage(); // U1: Use app language instead of hardcoded es-ES

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const localeMap = { en: 'en-US', es: 'es-ES', it: 'it-IT' };
  const formatter = new Intl.DateTimeFormat(localeMap[language] || 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div style={{
      fontSize: '0.85rem',
      fontWeight: '500',
      color: 'var(--text-secondary)',
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    }}>
      <BlurText text={formatter.format(time).replace(',', '')} delay={50} />
    </div>
  );
}
