import { useRef, useEffect, useCallback } from 'react';

// ─── Math helpers ───
// Normalized trig: input 0-1, output 0-1
const TAU = Math.PI * 2;
const sin  = x => (Math.sin(x * TAU) + 1) / 2;
const isin = x => (-Math.sin(x * TAU) + 1) / 2;
const cos  = x => (Math.cos(x * TAU) + 1) / 2;
const icos = x => (-Math.cos(x * TAU) + 1) / 2;

/**
 * Parse a hex color string to [r, g, b] in 0-1 range.
 */
function hexToRgb01(hex) {
  hex = hex.replace('#', '');
  return [
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255,
  ];
}

/**
 * MosaicBackground
 *
 * A canvas-rendered tile mosaic with slow-moving color waves,
 * tinted by the current energy theme colors.
 *
 * Props:
 *   colorA  – hex string, primary energy vivid color
 *   colorB  – hex string, secondary energy vivid color
 *   tileSize – pixel size of each tile (default 20)
 *   speed   – animation speed multiplier (default 0.35 = very slow)
 */
export default function MosaicBackground({
  colorA = '#4F67FF',
  colorB = '#FF99E2',
  colorC,
  tileSize = 20,
  speed = 0.35,
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(Math.random() * 60000);
  const lastFrameRef = useRef(performance.now());

  // Parse theme colors into 0-1 RGB
  const cA = hexToRgb01(colorA);
  const cB = hexToRgb01(colorB);
  const cC_custom = colorC ? hexToRgb01(colorC) : null;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    const { width, height } = canvas;

    // Update time (slow)
    const now = performance.now();
    const dt = now - lastFrameRef.current;
    lastFrameRef.current = now;
    timeRef.current += dt * speed;
    const time = timeRef.current;

    // Fill black
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const tileCountX = Math.ceil(width / tileSize);
    const tileCountY = Math.ceil(height / tileSize);

    // Slow rotation — full cycle every ~4 minutes
    const angle1 = (time / 240000) * TAU;
    const angle2 = angle1 + 0.5;
    const angle3 = angle1 + Math.PI / 2;
    const rotXOffset1 = Math.sin(angle1);
    const rotXOffset2 = Math.sin(angle2);
    const rotXOffset3 = Math.sin(angle3);
    const rotYOffset1 = Math.cos(angle1);
    const rotYOffset2 = Math.cos(angle2);
    const rotYOffset3 = Math.cos(angle3);
    const g1FreqMult = Math.sin((time / 48000) * TAU);

    for (let xI = 0; xI < tileCountX; xI++) {
      for (let yI = 0; yI < tileCountY; yI++) {
        const x = xI / tileCountX;
        const y = yI / tileCountY;

        const xRot1 = x * rotXOffset1;
        const xRot2 = x * rotXOffset2;
        const xRot3 = x * rotXOffset3;
        const yRot1 = y * rotYOffset1;
        const yRot2 = y * rotYOffset2;
        const yRot3 = y * rotYOffset3;

        // Wave functions for each channel
        const r1 = cos(xRot1 + yRot1 * rotXOffset3 * 2 + time / 16000);
        const r2 = cos(xRot3 + yRot3 * rotXOffset3 + time / 16000);
        const r3 = sin(x * 0.4 - time / 32000);

        const g1 = icos((xRot1 + yRot1) * (g1FreqMult + 2) + time / 8000);
        const g2 = icos(xRot2 + yRot2 * 0.8 - time / 8800);
        const g3 = sin(x * 0.5 + time / 40000);

        const b1 = icos(x * rotXOffset1 * 1.65 - time / 4000);
        const b2 = icos(x * 0.8 + time / 8000);
        const b3 = sin(y * 0.4 + time / 48000 + 0.75);

        // Push contrast brutally via Math.pow(x, 4) to force sharp separations
        let w1 = Math.pow((r1 * 0.6 + r2) / 1.6 * (r3 * 0.5 + 0.5), 4);
        let w2 = Math.pow((g1 * 0.6 + g2) / 1.6 * (g3 * 0.5 + 0.5), 4);
        let w3 = Math.pow((b1 * 0.6 + b2) / 1.6 * (b3 * 0.5 + 0.5), 4);

        // Normalize weights so they always add up to exactly 1
        // This makes sure we are only ever blending between our 3 target colors
        let sum = w1 + w2 + w3 + 0.0001;
        w1 /= sum;
        w2 /= sum;
        w3 /= sum;

        // Our 3 target colors:
        // 1. Pure Vivid Color A
        // 2. Pure Vivid Color B
        // 3. Custom Color C OR a deep darkened shade of the theme
        const cC = cC_custom || [
          (cA[0] + cB[0]) * 0.15,
          (cA[1] + cB[1]) * 0.15,
          (cA[2] + cB[2]) * 0.15
        ];

        // Calculate final constrained RGB
        const finalR = cA[0] * w1 + cB[0] * w2 + cC[0] * w3;
        const finalG = cA[1] * w1 + cB[1] * w2 + cC[1] * w3;
        const finalB = cA[2] * w1 + cB[2] * w2 + cC[2] * w3;

        ctx.fillStyle = `rgb(${finalR * 255 | 0},${finalG * 255 | 0},${finalB * 255 | 0})`;
        // Tiles flush — no gaps
        ctx.fillRect(xI * tileSize, yI * tileSize, tileSize, tileSize);
      }
    }

    animRef.current = requestAnimationFrame(draw);
  }, [cA, cB, cC_custom, tileSize, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement);

    lastFrameRef.current = performance.now();
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      observer.disconnect();
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
      }}
    />
  );
}
