import { useEffect, useRef, useState } from 'react';

// ── Leer idioma sin necesitar el contexto de React ──────────────────────────
// Devuelve [antes, después] para colocar el icono en el centro de la frase
function getWelcomeParts() {
  const lang = localStorage.getItem('misu-language') || 'en';
  const map = {
    en: ['Welcome', 'back!'],
    es: ['\u00a1Hola', 'de nuevo!'],
    it: ['Bentornato', '!'],
    fr: ['Bon', 'retour\u00a0!'],
    de: ['Willkommen', 'zur\u00fcck!'],
    pt: ['Bem-vindo', 'de volta!'],
  };
  return map[lang] ?? ['Welcome', 'back!'];
}

/**
 * SplashScreen
 *
 * Props:
 *   onDone   — callback disparado cuando el loader termina
 *   appReady — booleano que indica si la app ya terminó de cargar
 */
export default function SplashScreen({ appReady, onDone }) {
  const [phase, setPhase] = useState('visible'); // 'visible' | 'fading' | 'gone'
  const minTimerFired = useRef(false);
  const appReadyRef = useRef(appReady);

  useEffect(() => { appReadyRef.current = appReady; }, [appReady]);

  const tryExit = () => {
    if (minTimerFired.current && appReadyRef.current) {
      setPhase('fading');
      setTimeout(() => {
        setPhase('gone');
        onDone?.();
      }, 520);
    }
  };

  // Duración mínima 2500 ms
  useEffect(() => {
    const id = setTimeout(() => {
      minTimerFired.current = true;
      tryExit();
    }, 2500);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (appReady) tryExit();
  }, [appReady]); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'gone') return null;

  return (
    <div
      className={`splash ${phase === 'fading' ? 'splash--fade' : ''}`}
      aria-hidden="true"
    >
      <div className="splash__center">

        {/* ── Texto con icono en el centro ── */}
        <p className="splash__phrase">
          <span className="splash__word">{getWelcomeParts()[0]}</span>
          <span className="splash__icon-inline" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1277.69 1533.23"
              className="splash__svg"
            >
              <defs>
                {/* Glow diagonal constante estilo cristal/glossy */}
                <linearGradient id="splash-glow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                  <stop offset="40%" stopColor="#ffffff" stopOpacity="0.05" />
                  <stop offset="50%" stopColor="transparent" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>

                {/* Barrido de brillo que viaja de izquierda a derecha — recortado por clipPath */}
                <linearGradient id="splash-sweep" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="transparent">
                    <animate attributeName="offset" values="-0.6;1.4" dur="2s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="50%" stopColor="#ffffff" stopOpacity="0.5">
                    <animate attributeName="offset" values="-0.1;1.9" dur="2s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" stopColor="transparent">
                    <animate attributeName="offset" values="0.4;2.4" dur="2s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
              </defs>

              {/* Cada tile tiene su propio color plano, mapado a la imagen de referencia */}
              <g id="misu-tiles">
                {/* col x=0 — deep red */}
                <rect fill="#c02a42" x="0"       y="511.08"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '0ms'   }} />
                <rect fill="#b82035" x="0"       y="638.85"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '30ms'  }} />
                <rect fill="#c52d40" x="0"       y="766.62"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '60ms'  }} />
                <rect fill="#ce3048" x="0"       y="894.39"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '90ms'  }} />
                {/* col x=127.77 — crimson */}
                <rect fill="#cc3850" x="127.77"  y="383.31"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '50ms'  }} />
                <rect fill="#d03555" x="127.77"  y="511.08"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '70ms'  }} />
                <rect fill="#c04070" x="127.77"  y="638.85"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '90ms'  }} />
                <rect fill="#b82038" x="127.77"  y="766.62"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '110ms' }} />
                <rect fill="#cc3550" x="127.77"  y="894.39"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '130ms' }} />
                <rect fill="#c02840" x="127.77"  y="1022.16" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '150ms' }} />
                <rect fill="#b82035" x="127.77"  y="1149.93" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '170ms' }} />
                {/* col x=255.54 — dark rose */}
                <rect fill="#cc3345" x="255.54"  y="383.31"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '100ms' }} />
                <rect fill="#d44880" x="255.54"  y="511.08"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '115ms' }} />
                <rect fill="#c84580" x="255.54"  y="638.85"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '130ms' }} />
                <rect fill="#c44070" x="255.54"  y="766.62"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '145ms' }} />
                <rect fill="#d23350" x="255.54"  y="894.39"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '160ms' }} />
                <rect fill="#cc3550" x="255.54"  y="1022.16" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '175ms' }} />
                <rect fill="#c93143" x="255.54"  y="1149.93" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '190ms' }} />
                <rect fill="#c02a42" x="255.54"  y="1277.7"  width="127.77" height="127.76" className="splash__tile" style={{ '--d': '205ms' }} />
                {/* col x=383.31 — magenta rose */}
                <rect fill="#c84070" x="383.31"  y="383.31"  width="127.76" height="127.77" className="splash__tile" style={{ '--d': '130ms' }} />
                <rect fill="#d75598" x="383.31"  y="511.08"  width="127.76" height="127.77" className="splash__tile" style={{ '--d': '143ms' }} />
                <rect fill="#cf4d88" x="383.31"  y="638.85"  width="127.76" height="127.77" className="splash__tile" style={{ '--d': '156ms' }} />
                <rect fill="#c84578" x="383.31"  y="766.62"  width="127.76" height="127.77" className="splash__tile" style={{ '--d': '169ms' }} />
                <rect fill="#c44070" x="383.31"  y="894.39"  width="127.76" height="127.77" className="splash__tile" style={{ '--d': '182ms' }} />
                <rect fill="#d03555" x="383.31"  y="1022.16" width="127.76" height="127.77" className="splash__tile" style={{ '--d': '195ms' }} />
                <rect fill="#c82d45" x="383.31"  y="1149.93" width="127.76" height="127.77" className="splash__tile" style={{ '--d': '208ms' }} />
                <rect fill="#c02840" x="383.31"  y="1277.7"  width="127.76" height="127.76" className="splash__tile" style={{ '--d': '221ms' }} />
                <rect fill="#b82035" x="383.31"  y="1405.46" width="127.76" height="127.77" className="splash__tile" style={{ '--d': '234ms' }} />
                {/* col x=511.07 — pink magenta (includes stem) */}
                <rect fill="#df88be" x="511.07"  y="127.77"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '60ms'  }} />
                <rect fill="#d758a2" x="511.07"  y="383.31"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '160ms' }} />
                <rect fill="#d460a0" x="511.07"  y="511.08"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '172ms' }} />
                <rect fill="#d878b4" x="511.07"  y="638.85"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '184ms' }} />
                <rect fill="#cf4d88" x="511.07"  y="766.62"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '196ms' }} />
                <rect fill="#c84578" x="511.07"  y="894.39"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '208ms' }} />
                <rect fill="#cc3d68" x="511.07"  y="1022.16" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '220ms' }} />
                <rect fill="#c93143" x="511.07"  y="1149.93" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '232ms' }} />
                <rect fill="#c02840" x="511.07"  y="1277.7"  width="127.77" height="127.76" className="splash__tile" style={{ '--d': '244ms' }} />
                <rect fill="#c93245" x="511.07"  y="1405.46" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '256ms' }} />
                {/* col x=638.84 — medium pink (includes stem) */}
                <rect fill="#e898c8" x="638.84"  y="127.77"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '80ms'  }} />
                <rect fill="#e090c0" x="638.84"  y="511.08"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '188ms' }} />
                <rect fill="#d878b4" x="638.84"  y="638.85"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '199ms' }} />
                <rect fill="#d860a8" x="638.84"  y="766.62"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '210ms' }} />
                <rect fill="#d460a0" x="638.84"  y="894.39"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '221ms' }} />
                <rect fill="#cc6898" x="638.84"  y="1022.16" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '232ms' }} />
                <rect fill="#c84888" x="638.84"  y="1149.93" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '243ms' }} />
                <rect fill="#c44070" x="638.84"  y="1277.7"  width="127.77" height="127.76" className="splash__tile" style={{ '--d': '254ms' }} />
                {/* col x=766.61 — light-medium pink (includes top leaf) */}
                <rect fill="#d04578" x="766.61"  y="0"       width="127.77" height="127.77" className="splash__tile" style={{ '--d': '55ms'  }} />
                <rect fill="#dc80b8" x="766.61"  y="383.31"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '200ms' }} />
                <rect fill="#e090c0" x="766.61"  y="511.08"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '211ms' }} />
                <rect fill="#e8a0c8" x="766.61"  y="638.85"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '222ms' }} />
                <rect fill="#e090c0" x="766.61"  y="766.62"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '233ms' }} />
                <rect fill="#d878b4" x="766.61"  y="894.39"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '244ms' }} />
                <rect fill="#d860a8" x="766.61"  y="1022.16" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '255ms' }} />
                <rect fill="#cc6898" x="766.61"  y="1149.93" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '266ms' }} />
                <rect fill="#c84888" x="766.61"  y="1277.7"  width="127.77" height="127.76" className="splash__tile" style={{ '--d': '277ms' }} />
                <rect fill="#c93143" x="766.61"  y="1405.46" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '288ms' }} />
                {/* col x=894.38 — light pink */}
                <rect fill="#e8a0c8" x="894.38"  y="383.31"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '210ms' }} />
                <rect fill="#e4b0d4" x="894.38"  y="511.08"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '221ms' }} />
                <rect fill="#f0a8cc" x="894.38"  y="638.85"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '232ms' }} />
                <rect fill="#e8a0c8" x="894.38"  y="766.62"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '243ms' }} />
                <rect fill="#e090c0" x="894.38"  y="894.39"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '254ms' }} />
                <rect fill="#dc80b8" x="894.38"  y="1022.16" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '265ms' }} />
                <rect fill="#d878b4" x="894.38"  y="1149.93" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '276ms' }} />
                <rect fill="#d460a0" x="894.38"  y="1277.7"  width="127.77" height="127.76" className="splash__tile" style={{ '--d': '287ms' }} />
                <rect fill="#cc3d60" x="894.38"  y="1405.46" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '298ms' }} />
                {/* col x=1022.15 — very light pink (bite cutout gap in rows 5-7) */}
                <rect fill="#f0a8cc" x="1022.15" y="383.31"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '220ms' }} />
                <rect fill="#e4b0d4" x="1022.15" y="511.08"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '231ms' }} />
                <rect fill="#e090c0" x="1022.15" y="894.39"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '264ms' }} />
                <rect fill="#e8a0c8" x="1022.15" y="1022.16" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '275ms' }} />
                <rect fill="#dc80b8" x="1022.15" y="1149.93" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '286ms' }} />
                <rect fill="#d878b4" x="1022.15" y="1277.7"  width="127.77" height="127.76" className="splash__tile" style={{ '--d': '297ms' }} />
                {/* col x=1149.92 — palest pink / mauve (rightmost - bite edge) */}
                <rect fill="#e8b4d8" x="1149.92" y="383.31"  width="127.77" height="127.77" className="splash__tile" style={{ '--d': '230ms' }} />
                <rect fill="#dc80b8" x="1149.92" y="1022.16" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '275ms' }} />
                <rect fill="#e090c0" x="1149.92" y="1149.93" width="127.77" height="127.77" className="splash__tile" style={{ '--d': '288ms' }} />
              </g>

              {/* clipPath = forma exacta del logo, para contener el barrido */}
              <clipPath id="misu-clip">
                <use href="#misu-tiles" />
              </clipPath>

              {/* Glow diagonal constante */}
              <rect
                fill="url(#splash-glow)"
                x="0" y="0"
                width="1277.69" height="1533.23"
                clipPath="url(#misu-clip)"
              />

              {/* Barrido de brillo animado, restringido a la forma del logo */}
              <rect
                fill="url(#splash-sweep)"
                x="0" y="0"
                width="1277.69" height="1533.23"
                clipPath="url(#misu-clip)"
              />
            </svg>
          </span>
          <span className="splash__word">{getWelcomeParts()[1]}</span>
        </p>
      </div>
    </div>
  );
}
