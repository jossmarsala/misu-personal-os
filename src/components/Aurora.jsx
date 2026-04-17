import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import { useEffect, useRef } from 'react';
import './Aurora.css';

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                    \
     bool isInBetween = currentColor.position <= factor;    \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);
  
  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);
  
  // Multi-layered noise for softer, broader movement
  float n1 = snoise(vec2(uv.x * 2.5 + uTime * 0.1, uTime * 0.2)) * 0.5;
  float n2 = snoise(vec2(uv.x * 6.0 - uTime * 0.3, uTime * 0.4)) * 0.2;
  float n3 = snoise(vec2(uv.x * 12.0 + uTime * 0.6, uTime * 0.8)) * 0.05;
  
  float combinedNoise = (n1 + n2 + n3) * uAmplitude;
  float height = exp(combinedNoise);
  height = (uv.y * 2.2 - height + 0.4);
  
  float intensity = 0.7 * height;
  
  float midPoint = 0.2;
  // Softer blend for blurrier edges
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.8, midPoint + uBlend * 0.8, intensity);
  
  // Use the ramp color directly without darkening it by intensity
  // This prevents 'dirty' dark edges when blending in light mode
  vec3 auroraColor = rampColor;
  
  // Premultiply the vibrant color by alpha for clean blending
  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

export default function Aurora(props) {
  const { colorStops = ['#5227FF', '#7cff67', '#5227FF'], amplitude = 1.0, blend = 0.5, isPlaying = false } = props;
  const propsRef = useRef(props);
  propsRef.current = props;

  const ctnDom = useRef(null);

  // Track continuous time
  const timeRef = useRef(0);
  const lastUpdateRef = useRef(performance.now());

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.backgroundColor = 'transparent';

    let program;

    function resize() {
      if (!ctn) return;
      const width = ctn.offsetWidth;
      const height = ctn.offsetHeight;
      renderer.setSize(width, height);
      if (program) {
        program.uniforms.uResolution.value = [width, height];
      }
    }
    window.addEventListener('resize', resize);

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const colorStopsArray = colorStops.map(hex => {
      if (!hex || typeof hex !== 'string') return [1, 1, 1];
      let safeHex = hex;
      if (safeHex.startsWith('#') && safeHex.length === 9) safeHex = safeHex.slice(0, 7);
      try {
        const c = new Color(safeHex);
        return [c.r || 0, c.g || 0, c.b || 0];
      } catch(e) {
        return [1, 1, 1];
      }
    });

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: colorStopsArray },
        uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
        uBlend: { value: blend }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });
    ctn.appendChild(gl.canvas);

    let animateId = 0;
    const update = () => {
      animateId = requestAnimationFrame(update);
      const now = performance.now();
      const delta = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      const { speed = 100.0, isPlaying } = propsRef.current;

      // Update time. If playing, move fast. If paused, move very slow (or stop).
      if (isPlaying) {
        timeRef.current += delta * 0.001 * speed;
      } else {
        timeRef.current += delta * 0.0001; // slow drift
      }

      program.uniforms.uTime.value = timeRef.current * 0.1;

      // Smoothly approach target amplitude
      const targetAmplitude = propsRef.current.amplitude ?? 1.0;
      const currentAmp = program.uniforms.uAmplitude.value;
      program.uniforms.uAmplitude.value = currentAmp + (targetAmplitude - currentAmp) * 0.1;

      program.uniforms.uBlend.value = propsRef.current.blend ?? blend;
      const stops = propsRef.current.colorStops ?? colorStops;
      
      program.uniforms.uColorStops.value = stops.map(hex => {
        if (!hex || typeof hex !== 'string') return [1, 1, 1];
        // Safely strip alpha if it's an 8-char hex (like #RRGGBBAA)
        let safeHex = hex;
        if (safeHex.startsWith('#') && safeHex.length === 9) {
          safeHex = safeHex.slice(0, 7);
        }
        try {
          const c = new Color(safeHex);
          return [c.r || 0, c.g || 0, c.b || 0];
        } catch(e) {
          return [1, 1, 1];
        }
      });
      
      renderer.render({ scene: mesh });
    };
    animateId = requestAnimationFrame(update);

    resize();

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener('resize', resize);
      if (ctn && gl.canvas.parentNode === ctn) {
        ctn.removeChild(gl.canvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ctnDom} className="aurora-container" />;
}
