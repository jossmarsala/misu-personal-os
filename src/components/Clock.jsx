import { useState, useEffect } from 'react';
import BlurText from './BlurText';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatter = new Intl.DateTimeFormat('es-ES', { // Defaulting Spanish since user prefers it
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
