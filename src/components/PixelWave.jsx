import { useRef, useEffect, useCallback } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { getEnergyDef } from '../utils/energy';
import { buildEnergyColors } from './PixelLoader';

// ─── Constants ──────────────────────────────────────────
const PIXEL_SIZE  = 3;   // px square per pixel block
const GAP         = 1;   // gap between pixel blocks
const CELL        = PIXEL_SIZE + GAP;
const BAR_GAP     = .5;   // gap between bars (in cells)
const BAR_WIDTH   = 2;   // cells wide per bar

// ─── PixelWave ───────────────────────────────────────────
/**
 * PixelWave — pixel-art EQ bar visualizer for the music player.
 *
 * Props:
 *   isPlaying  – boolean, true = fast animated bars, false = slow idle drift
 *   colorStops – ignored (colors come from the energy context, same as PixelLoader)
 */
export default function PixelWave({ isPlaying = false }) {
  const { currentEnergy } = useEnergy();
  const energyDef = getEnergyDef(currentEnergy);
  const canvasRef = useRef(null);

  // Mutable animation state — never triggers re-renders
  const stateRef = useRef({
    request: null,
    bars: [],
    colors: [],
    lastTime: 0,
  });

  // ── Build / rebuild bars whenever canvas size or energy changes ──
  const initBars = useCallback((canvas, colors) => {
    const cols   = Math.floor(canvas.width  / (CELL * BAR_WIDTH + CELL * BAR_GAP));
    const maxRows = Math.floor(canvas.height / CELL);

    return Array.from({ length: cols }, (_, i) => ({
      col:       i * (BAR_WIDTH + BAR_GAP),          // column index in cell units
      height:    Math.random() * maxRows * 0.5 + 1,  // current rendered height (cells)
      target:    Math.random() * maxRows * 0.6 + 1,  // target height we're easing toward
      maxRows,
      color:     colors[i % colors.length],
      phase:     Math.random() * Math.PI * 2,        // offset for sine wave
      speed:     0.5 + Math.random() * 1.0,          // how fast this bar oscillates
    }));
  }, []);

  // ── Main animation loop ──────────────────────────────────────────
  const startAnimation = useCallback((canvas, colors, playing) => {
    const state = stateRef.current;
    cancelAnimationFrame(state.request);

    const ctx     = canvas.getContext('2d');
    const maxRows = Math.floor(canvas.height / CELL);
    state.colors  = colors;
    state.bars    = initBars(canvas, colors);

    let localTime = 0;

    const animate = (now) => {
      state.request = requestAnimationFrame(animate);

      const delta = Math.min(now - (state.lastTime || now), 64); // cap at ~64ms
      state.lastTime = now;

      const isNowPlaying = stateRef.current.isPlaying;
      const speed = isNowPlaying ? 4.0 : 0.4;
      localTime += delta * 0.001 * speed;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      state.bars.forEach((bar) => {
        // Ease toward a sine-driven target
        const range   = isNowPlaying ? maxRows * 0.75 : maxRows * 0.2;
        const base    = isNowPlaying ? maxRows * 0.15  : maxRows * 0.05;
        bar.target    = base + Math.abs(Math.sin(localTime * bar.speed + bar.phase)) * range;
        // Smooth easing
        bar.height   += (bar.target - bar.height) * 0.18;

        const cellH   = Math.max(1, Math.round(bar.height));
        const startRow = maxRows - cellH; // bars grow from bottom

        for (let row = startRow; row < maxRows; row++) {
          // Fade brightness: top cells are more vivid
          const frac    = 1 - (row - startRow) / cellH; // 0 at base, 1 at top
          const alpha   = 0.35 + frac * 0.65;

          ctx.globalAlpha = alpha;
          ctx.fillStyle   = bar.color;

          const px = bar.col * CELL;
          const py = row   * CELL;

          // Draw BAR_WIDTH-wide pixel blocks
          for (let w = 0; w < BAR_WIDTH; w++) {
            ctx.fillRect(px + w * CELL, py, PIXEL_SIZE, PIXEL_SIZE);
          }
        }
        ctx.globalAlpha = 1;
      });
    };

    animate(performance.now());
  }, [initBars]);

  // ── Mount / energy change → rebuild ─────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const colors = buildEnergyColors(energyDef);

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width  = Math.floor(parent.clientWidth);
      canvas.height = Math.floor(parent.clientHeight);
      startAnimation(canvas, colors, stateRef.current.isPlaying);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement);
    resize();

    return () => {
      cancelAnimationFrame(stateRef.current.request);
      observer.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEnergy]);

  // ── isPlaying changes → update ref (no remount) ─────────────────
  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        imageRendering: 'pixelated',
      }}
    />
  );
}
