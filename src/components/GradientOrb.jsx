import { useState, useRef, useId } from 'react';
import './GradientOrb.css';

export default function GradientOrb({ color, size = '100%', className = '' }) {
  const gradientId = useId();
  const [focalPoint, setFocalPoint] = useState({ x: 0.5, y: 0.5 });
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - rect.x) / rect.width - 0.5;
    const dy = (e.clientY - rect.y) / rect.height - 0.5;
    
    // Calculate new focal point within bounds
    const m = Math.min(0.49, Math.hypot(dy, dx));
    const a = Math.atan2(dy, dx);
    
    const fx = +(0.5 + m * Math.cos(a)).toFixed(2);
    const fy = +(0.5 + m * Math.sin(a)).toFixed(2);
    
    setFocalPoint({ x: fx, y: fy });
  };

  const handleMouseLeave = () => {
    setFocalPoint({ x: 0.5, y: 0.5 });
  };

  return (
    <div 
      className={`gradient-orb-container ${className}`} 
      style={{ width: size, height: size }}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg viewBox="0 0 100 100" className="gradient-orb-svg">
        <defs>
          <radialGradient 
            id={`grad-${gradientId}`}
            fx={focalPoint.x}
            fy={focalPoint.y}
          >
            <stop offset="0" stopColor={color} />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle 
          cx="50" cy="50" r="45" 
          className="gradient-orb-circle"
          fill={`url(#grad-${gradientId})`} 
        />
      </svg>
    </div>
  );
}
