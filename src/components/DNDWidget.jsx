import { useState, useEffect, useRef } from 'react';
import { Shield, Volume2, VolumeX, Moon, Zap } from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';
import DraggableWidget from './DraggableWidget';
import './DNDWidget.css';
import { useLanguage } from '../context/LanguageContext';
import { getAudioContext } from '../utils/audio';

export default function DNDWidget({ visible }) {
  const { dndActive, setDndActive } = useEnergy();
  const { t } = useLanguage();
  const [noiseType, setNoiseType] = useState('white'); // white, pink, brown
  const [volume, setVolume] = useState(0.15);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const noiseNodeRef = useRef(null);
  const gainNodeRef = useRef(null);

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
    
    // Stop and cleanup previous node
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
        output[i] *= 4.5; // Gain compensation
      }
    } else { // pink noise - Voss algorithm approximation
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
        output[i] *= 0.11; // Gain compensation
        b6 = white * 0.115926;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;
    source.connect(gainNodeRef.current);
    noiseNodeRef.current = source;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        if (isPlaying || true) source.start(); // Ensure it starts if we just called start
      });
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
    if (isPlaying) {
      stopNoise();
    } else {
      startNoise();
    }
  };

  useEffect(() => {
    if (gainNodeRef.current) {
      const ctx = getAudioContext();
      gainNodeRef.current.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
    }
  }, [volume]);

  // Handle noise changes via direct user action
  const handleNoiseChange = (type) => {
    setNoiseType(type);
    startNoise(type);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (noiseNodeRef.current) {
        try {
          noiseNodeRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Handle DND Muting logic
  useEffect(() => {
    if (dndActive) {
        // Optional: transition logic
    }
  }, [dndActive]);

  if (!visible) return null;

  return (
    <DraggableWidget 
      id="dnd" 
      title={t('settings.shield')} 
      icon={<Shield size={14} />}
      defaultPosition={{ x: 20, y: 480 }}
    >
      <div className="dnd-widget">
        <div className="dnd-widget__toggle-section">
          <button 
            className={`dnd-master-toggle ${dndActive ? 'active' : ''}`}
            onClick={() => setDndActive(!dndActive)}
          >
            <Shield size={20} />
            <span>{dndActive ? t('dnd.shieldActive') : t('dnd.enableShield')}</span>
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
          </div>
        )}
      </div>
    </DraggableWidget>
  );
}
