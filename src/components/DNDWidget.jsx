import { useState, useEffect, useRef } from 'react';
import { Shield, Volume2, VolumeX, Moon, Zap, Timer } from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';
import DraggableWidget from './DraggableWidget';
import './DNDWidget.css';
import { useLanguage } from '../context/LanguageContext';
import { getAudioContext } from '../utils/audio';

// Pomodoro focus duration in seconds (matches PomodoroWidget MODES.focus)
const POMODORO_FOCUS_DURATION = 25 * 60;

export default function DNDWidget({ visible }) {
  const { dndActive, setDndActive } = useEnergy();
  const { t } = useLanguage();
  const [noiseType, setNoiseType] = useState('white'); // white, pink, brown
  const [volume, setVolume] = useState(0.009);
  const [isPlaying, setIsPlaying] = useState(false);

  // ── Countdown ring ──────────────────────────────────────────
  // timeLeft: seconds remaining (null = no active session)
  // pomodoroTimeLeft: mirrors Pomodoro's remaining time when synced
  const [timeLeft, setTimeLeft] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(null); // total seconds of current session
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const countdownRef = useRef(null);

  const noiseNodeRef = useRef(null);
  const gainNodeRef = useRef(null);

  // ── Ring geometry ─────────────────────────────────────────
  const RING_R = 26;
  const RING_CIRC = 2 * Math.PI * RING_R;
  const ringProgress = (timeLeft != null && sessionDuration)
    ? timeLeft / sessionDuration
    : 1;
  const ringOffset = RING_CIRC * (1 - ringProgress);

  // ─── Listen to Pomodoro events ─────────────────────────────
  useEffect(() => {
    const onStart = () => {
      setPomodoroRunning(true);
      if (dndActive) {
        // Sync shield countdown to pomodoro focus duration
        setSessionDuration(POMODORO_FOCUS_DURATION);
        setTimeLeft(POMODORO_FOCUS_DURATION);
      }
    };

    const onEnd = () => {
      setPomodoroRunning(false);
      // Pomodoro focus ended — auto-deactivate shield gracefully
      if (dndActive) {
        setDndActive(false);
        setTimeLeft(null);
        setSessionDuration(null);
      }
    };

    const onBreakEnd = () => {
      setPomodoroRunning(false);
    };

    window.addEventListener('misu:pomodoro-start', onStart);
    window.addEventListener('misu:pomodoro-focus-end', onEnd);
    window.addEventListener('misu:pomodoro-break-end', onBreakEnd);
    window.addEventListener('misu:pomodoro-long-break-end', onBreakEnd);

    return () => {
      window.removeEventListener('misu:pomodoro-start', onStart);
      window.removeEventListener('misu:pomodoro-focus-end', onEnd);
      window.removeEventListener('misu:pomodoro-break-end', onBreakEnd);
      window.removeEventListener('misu:pomodoro-long-break-end', onBreakEnd);
    };
  }, [dndActive, setDndActive]);

  // ─── Countdown tick ────────────────────────────────────────
  useEffect(() => {
    if (timeLeft == null || timeLeft <= 0) {
      clearInterval(countdownRef.current);
      if (timeLeft === 0 && dndActive) {
        setDndActive(false);
        setTimeLeft(null);
        setSessionDuration(null);
      }
      return;
    }

    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => prev != null ? prev - 1 : null);
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, [timeLeft, dndActive, setDndActive]);

  // Clear countdown when shield is manually turned off
  useEffect(() => {
    if (!dndActive) {
      clearInterval(countdownRef.current);
      setTimeLeft(null);
      setSessionDuration(null);
    }
  }, [dndActive]);

  // ── Noise helpers ──────────────────────────────────────────
  const initAudio = () => {
    const ctx = getAudioContext();
    if (!ctx) return null;
    
    if (!gainNodeRef.current) {
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.gain.value = volume;
      gainNodeRef.current.connect(ctx.destination);
    }
    return ctx;
  };

  const createNoise = (type) => {
    const ctx = initAudio();
    if (!ctx) return;
    
    if (noiseNodeRef.current) {
      try {
        noiseNodeRef.current.stop();
        noiseNodeRef.current.disconnect();
      } catch (e) {}
    }

    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.3;
      }
    } else if (type === 'brown') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 4.5;
      }
    } else { // pink noise
      let b0, b1, b2, b3, b4, b5, b6;
      b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;
    source.connect(gainNodeRef.current);
    noiseNodeRef.current = source;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => { source.start(); });
    } else {
      source.start();
    }
  };

  const startNoise = (type = noiseType) => {
    initAudio();
    createNoise(type);
    setIsPlaying(true);
  };

  const stopNoise = () => {
    if (noiseNodeRef.current) {
      try {
        noiseNodeRef.current.stop();
        noiseNodeRef.current.disconnect();
      } catch (e) {}
      noiseNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const toggleNoise = () => {
    if (isPlaying) stopNoise();
    else startNoise();
  };

  useEffect(() => {
    if (gainNodeRef.current) {
      const ctx = getAudioContext();
      gainNodeRef.current.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
    }
  }, [volume]);

  const handleNoiseChange = (type) => {
    setNoiseType(type);
    startNoise(type);
  };

  useEffect(() => {
    return () => {
      if (noiseNodeRef.current) {
        try { noiseNodeRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // ── Activate shield — auto-sync with Pomodoro if running ───
  const handleToggleShield = () => {
    const next = !dndActive;
    setDndActive(next);
    if (next && pomodoroRunning) {
      // Pomodoro is running — mirror its countdown
      setSessionDuration(POMODORO_FOCUS_DURATION);
      setTimeLeft(POMODORO_FOCUS_DURATION);
    }
  };

  // ── Time display ───────────────────────────────────────────
  const formatTime = (secs) => {
    if (secs == null) return null;
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!visible) return null;

  return (
    <DraggableWidget 
      id="dnd" 
      title={t('settings.shield')} 
      icon={<Shield size={14} />}
      defaultPosition={{ x: 20, y: 480 }}
    >
      <div className="dnd-widget">

        {/* Master toggle with countdown ring */}
        <div className="dnd-widget__toggle-section">
          <button 
            className={`dnd-master-toggle ${dndActive ? 'active' : ''}`}
            onClick={handleToggleShield}
          >
            {/* SVG countdown ring — only visible when active with a session */}
            <div className="dnd-ring-wrap">
              {dndActive && timeLeft != null ? (
                <svg className="dnd-countdown-ring" viewBox="0 0 68 68" width="36" height="36">
                  <circle cx="34" cy="34" r={RING_R} className="dnd-ring-bg" />
                  <circle
                    cx="34" cy="34" r={RING_R}
                    className="dnd-ring-progress"
                    style={{
                      strokeDasharray: RING_CIRC,
                      strokeDashoffset: ringOffset,
                    }}
                  />
                  {/* Shield icon center */}
                  <foreignObject x="10" y="10" width="48" height="48">
                    <div xmlns="http://www.w3.org/1999/xhtml" className="dnd-ring-icon">
                      <Shield size={18} />
                    </div>
                  </foreignObject>
                </svg>
              ) : (
                <Shield size={20} />
              )}
            </div>

            <div className="dnd-toggle-text">
              <span className="dnd-toggle-label">
                {dndActive ? t('dnd.shieldActive') : t('dnd.enableShield')}
              </span>
              {dndActive && timeLeft != null && (
                <span className="dnd-countdown-text">
                  <Timer size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                  {formatTime(timeLeft)}
                </span>
              )}
              {dndActive && pomodoroRunning && timeLeft == null && (
                <span className="dnd-countdown-text">
                  synced with Pomodoro
                </span>
              )}
            </div>
          </button>
        </div>

        <div className="dnd-widget__controls">
          <div className="dnd-control-group">
            <span className="dnd-label">{t('dnd.backgroundNoise')}</span>
            <div className="dnd-btn-row">
              <button 
                className={`dnd-btn ${isPlaying && noiseType === 'white' ? 'active' : ''}`}
                onClick={() => handleNoiseChange('white')}
              >{t('dnd.white')}</button>
              <button 
                className={`dnd-btn ${isPlaying && noiseType === 'pink' ? 'active' : ''}`}
                onClick={() => handleNoiseChange('pink')}
              >{t('dnd.pink')}</button>
              <button 
                className={`dnd-btn ${isPlaying && noiseType === 'brown' ? 'active' : ''}`}
                onClick={() => handleNoiseChange('brown')}
              >{t('dnd.brown')}</button>
            </div>
          </div>

          <div className="dnd-actions">
            <button className={`noise-toggle-btn ${isPlaying ? 'playing' : ''}`} onClick={toggleNoise}>
              {isPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {isPlaying ? t('dnd.muteNoise') : t('dnd.startNoise')}
            </button>
            
            <input 
              type="range" 
              className="dnd-volume-slider" 
              min="0" max="1" step="0.05" 
              value={volume} 
              onChange={(e) => setVolume(parseFloat(e.target.value))} 
            />
          </div>
        </div>

        {dndActive && (
          <div className="dnd-status-badges">
            <span className="dnd-badge"><VolumeX size={10} /> {t('dnd.musicMuted')}</span>
            <span className="dnd-badge"><Moon size={10} /> {t('dnd.distractionsHidden')}</span>
            {pomodoroRunning && (
              <span className="dnd-badge dnd-badge--pomodoro">
                <Timer size={10} /> Pomodoro synced
              </span>
            )}
          </div>
        )}
      </div>
    </DraggableWidget>
  );
}
