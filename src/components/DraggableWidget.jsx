import { useState, useRef, useCallback, useEffect } from 'react';
import { Minus, Maximize2 } from 'lucide-react';
import './DraggableWidget.css';

const STORAGE_PREFIX = 'misu-widget-pos-';

export default function DraggableWidget({ id, title, icon, children, defaultPosition = { x: 20, y: 80 } }) {
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + id);
      return saved ? JSON.parse(saved) : defaultPosition;
    } catch { return defaultPosition; }
  });
  const [collapsed, setCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [zIndex, setZIndex] = useState(10);
  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Save position to localStorage
  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(position));
    }
  }, [position, isDragging, id]);

  const handlePointerDown = useCallback((e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
    
    const rect = dragRef.current.getBoundingClientRect();
    offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsDragging(true);
    setZIndex(Date.now() % 10000 + 100); // Bring to front
    e.preventDefault();
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    const newX = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - offsetRef.current.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 50, e.clientY - offsetRef.current.y));
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  return (
    <div
      ref={dragRef}
      className={`draggable-widget ${isDragging ? 'dragging' : ''} ${collapsed ? 'collapsed' : ''}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex,
      }}
    >
      <div className="draggable-widget__header" onPointerDown={handlePointerDown}>
        <div className="draggable-widget__title">
          {icon}
          <span>{title}</span>
        </div>
        <button
          className="draggable-widget__toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <Maximize2 size={12} /> : <Minus size={12} />}
        </button>
      </div>
      {!collapsed && (
        <div className="draggable-widget__body">
          {children}
        </div>
      )}
    </div>
  );
}
