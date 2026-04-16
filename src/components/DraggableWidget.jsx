import { useState, useRef, useEffect } from 'react';
import { Minus, Maximize2 } from 'lucide-react';
import { motion, useDragControls, useMotionValue } from 'framer-motion';
import './DraggableWidget.css';

const STORAGE_PREFIX = 'misu-widget-pos-';

export default function DraggableWidget({ id, title, icon, children, defaultPosition = { x: 20, y: 80 }, customWidth }) {
  const getInitialPosition = () => {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + id);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof window !== 'undefined') {
           const safeX = Math.max(0, Math.min(window.innerWidth - 100, parsed.x || 0));
           const safeY = Math.max(0, Math.min(window.innerHeight - 50, parsed.y || 0));
           return { x: safeX, y: safeY };
        }
        return parsed;
      }
      return defaultPosition;
    } catch { return defaultPosition; }
  };

  const [collapsed, setCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [zIndex, setZIndex] = useState(10);
  const [windowSize, setWindowSize] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1000, 
    height: typeof window !== 'undefined' ? window.innerHeight : 800 
  });

  const dragControls = useDragControls();
  const initPos = getInitialPosition();
  const x = useMotionValue(initPos.x);
  const y = useMotionValue(initPos.y);
  
  const containerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startDrag = (event) => {
    if (event.target.closest('button') || event.target.closest('input') || event.target.closest('select')) return;
    setZIndex(Date.now() % 10000 + 100);
    setIsDragging(true);
    dragControls.start(event);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify({ x: x.get(), y: y.get() }));
  };

  const widgetWidth = customWidth || 280;
  const maxX = Math.max(0, windowSize.width - widgetWidth);
  const maxY = Math.max(0, windowSize.height - 40); // Allow header to be visible at bottom

  return (
    <motion.div
      ref={containerRef}
      className={`draggable-widget ${collapsed ? 'collapsed' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{ x, y, zIndex, width: customWidth || undefined }}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0.2}
      dragConstraints={{ left: 0, top: 0, right: maxX, bottom: maxY }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.02 }}
    >
      <div 
        className="draggable-widget__header" 
        onPointerDown={startDrag}
        style={{ touchAction: 'none' }}
      >
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
    </motion.div>
  );
}
