import { useRef, useEffect, useCallback } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { getEnergyDef } from '../utils/energy';
import './PixelLoader.css';

// ─── Math helpers ───────────────────────────────────────
const rand = (min, max) => Math.random() * (max - min) + min;

class Pixel {
  constructor(x, y, color, speed, delay, delayHide, step, boundSize) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = rand(0.1, 0.9) * speed;
    this.size = 0;
    this.sizeStep = rand(0, 0.5);
    this.minSize = 0.5;
    this.maxSizeAvailable = boundSize || 2;
    this.maxSize = rand(this.minSize, this.maxSizeAvailable);
    this.sizeDirection = 1;
    this.delay = delay;
    this.delayHide = delayHide;
    this.counter = 0;
    this.counterHide = 0;
    this.counterStep = step;
    this.isHidden = false;
    this.isFlicking = false;
  }

  draw(ctx) {
    const centerOffset = this.maxSizeAvailable * 0.5 - this.size * 0.5;
    ctx.fillStyle = this.color;
    ctx.fillRect(
      this.x + centerOffset,
      this.y + centerOffset,
      this.size,
      this.size
    );
  }

  show() {
    this.isHidden = false;
    this.counterHide = 0;
    if (this.counter <= this.delay) {
      this.counter += this.counterStep;
      return;
    }
    if (this.size >= this.maxSize) this.isFlicking = true;
    if (this.isFlicking) this.flicking();
    else this.size += this.sizeStep;
  }

  hide() {
    this.counter = 0;
    if (this.counterHide <= this.delayHide) {
      this.counterHide += this.counterStep;
      if (this.isFlicking) this.flicking();
      return;
    }
    this.isFlicking = false;
    if (this.size <= 0) {
      this.size = 0;
      this.isHidden = true;
    } else {
      this.size -= 0.05;
    }
  }

  flicking() {
    if (this.size >= this.maxSize) this.sizeDirection = -1;
    else if (this.size <= this.minSize) this.sizeDirection = 1;
    this.size += this.sizeDirection * this.speed;
  }
}

// ─── Shared canvas logic ────────────────────────────────
function usePixelCanvas({ canvasRef, colors, gap, maxTicker = 360 }) {
  const stateRef = useRef({
    pixels: [],
    ticker: 0,
    animationDirection: 1,
    request: null,
    lastTime: 0,
  });

  const getDelay = useCallback((x, y, width, height, direction) => {
    let dx = x - width * 0.5;
    let dy = direction ? y : y - height;
    return Math.sqrt(dx ** 2 + dy ** 2);
  }, []);

  const init = useCallback((canvas, colorsArr) => {
    if (!canvas) return;
    const width = canvas.width;
    const height = canvas.height;
    const step = (width + height) * 0.005;
    const speed = rand(0.008, 0.25);
    const maxSize = Math.floor(gap * 0.5);
    const pixels = [];

    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        if (x + maxSize > width || y + maxSize > height) continue;
        const color = colorsArr[Math.floor(Math.random() * colorsArr.length)];
        const delay = getDelay(x, y, width, height);
        const delayHide = getDelay(x, y, width, height);
        pixels.push(new Pixel(x, y, color, speed, delay, delayHide, step, maxSize));
      }
    }
    return pixels;
  }, [gap, getDelay]);

  const startAnimation = useCallback((canvas, colorsArr) => {
    const state = stateRef.current;
    const ctx = canvas.getContext('2d');
    const interval = 1000 / 60;

    cancelAnimationFrame(state.request);
    state.pixels = init(canvas, colorsArr) || [];
    state.ticker = 0;
    state.animationDirection = 1;
    state.lastTime = 0;

    const animate = () => {
      state.request = requestAnimationFrame(animate);
      const now = performance.now();
      const diff = now - (state.lastTime || 0);
      if (diff < interval) return;
      state.lastTime = now - (diff % interval);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (state.ticker >= maxTicker) state.animationDirection = -1;
      else if (state.ticker <= 0) state.animationDirection = 1;

      let allHidden = true;
      state.pixels.forEach((pixel) => {
        if (state.animationDirection > 0) {
          pixel.show();
        } else {
          pixel.hide();
          allHidden = allHidden && pixel.isHidden;
        }
        pixel.draw(ctx);
      });

      state.ticker += state.animationDirection;

      if (state.animationDirection < 0 && allHidden) {
        // Regenerate colors on each cycle for variety
        state.pixels = init(canvas, colorsArr) || [];
        state.ticker = 0;
      }
    };

    animate();
  }, [init, maxTicker]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !colors.length) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = Math.floor(parent.clientWidth);
      canvas.height = Math.floor(parent.clientHeight);
      startAnimation(canvas, colors);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement);
    resize();

    return () => {
      cancelAnimationFrame(stateRef.current.request);
      observer.disconnect();
    };
  }, [canvasRef, colors, startAnimation]);
}

// ─── Color palette builder from CSS variables ──────────
function buildEnergyColors(energyDef) {
  const { colorA, colorB, vividColorA, vividColorB } = energyDef;
  // Pull 5 hues from the energy palette: two vivid, two soft, one mid blend
  return [vividColorA, vividColorB, colorA, colorB, blendHex(vividColorA, vividColorB, 0.5)];
}

function blendHex(hex1, hex2, t) {
  const parse = h => {
    h = h.replace('#', '');
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  };
  const [r1,g1,b1] = parse(hex1);
  const [r2,g2,b2] = parse(hex2);
  const r = Math.round(r1 + (r2-r1)*t);
  const g = Math.round(g1 + (g2-g1)*t);
  const b = Math.round(b1 + (b2-b1)*t);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// ─── Full-size loader ───────────────────────────────────
/**
 * PixelLoader
 * Full-page pixel particle loader, adapted to Misu's energy design system.
 *
 * Props:
 *   label    – optional text shown below the canvas (defaults to nothing)
 *   style    – optional inline style overrides for the wrapper
 *   className – optional extra class names
 */
export function PixelLoader({ label, style, className = '' }) {
  const { currentEnergy } = useEnergy();
  const energyDef = getEnergyDef(currentEnergy);
  const colors = buildEnergyColors(energyDef);
  const canvasRef = useRef(null);

  usePixelCanvas({ canvasRef, colors, gap: 6, maxTicker: 360 });

  return (
    <div
      className={`pixel-loader ${className}`}
      style={style}
    >
      <div className="pixel-loader__canvas-wrap">
        <canvas ref={canvasRef} className="pixel-loader__canvas" />
      </div>
      {label && (
        <p className="pixel-loader__label">{label}</p>
      )}
    </div>
  );
}

// ─── Compact / inline loader ────────────────────────────
/**
 * PixelLoaderMini
 * Smaller inline version for card-level loading states (e.g. WeeklyPlanner).
 *
 * Props:
 *   label    – optional caption below the animation
 *   height   – pixel height of the canvas area (default 80)
 *   className – optional extra class names
 */
export function PixelLoaderMini({ label, height = 80, className = '' }) {
  const { currentEnergy } = useEnergy();
  const energyDef = getEnergyDef(currentEnergy);
  const colors = buildEnergyColors(energyDef);
  const canvasRef = useRef(null);

  usePixelCanvas({ canvasRef, colors, gap: 4, maxTicker: 240 });

  return (
    <div
      className={`pixel-loader-mini ${className}`}
      style={{ '--plm-height': `${height}px` }}
    >
      <div className="pixel-loader-mini__canvas-wrap">
        <canvas ref={canvasRef} className="pixel-loader-mini__canvas" />
      </div>
      {label && (
        <p className="pixel-loader-mini__label">{label}</p>
      )}
    </div>
  );
}

export default PixelLoader;
