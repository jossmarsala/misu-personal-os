import { useState, useEffect, useRef } from 'react';
import { Shield, Volume2, VolumeX, Moon, Zap } from 'lucide-react';
import { useEnergy } from '../context/EnergyContext';
import DraggableWidget from './DraggableWidget';
import './DNDWidget.css';
import { useLanguage } from '../context/LanguageContext';

export default function DNDWidget({ visible }) {
  const { dndActive, setDndActive } = useEnergy();
  const { t } = useLanguage();
  const [noiseType, setNoiseType] = useState('white'); // white, pink, brown
  const [volume, setVolume] = useState(0.15);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioCtxRef = useRef(null);
  const noiseNodeRef = useRef(null);
  const gainNodeRef = useRef(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.gain.value = volume;
      gainNodeRef.current.connect(audioCtxRef.current.destination);
    }
  };

  const createNoise = (type) => {
    initAudio();
    const ctx = audioCtxRef.current;
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

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = (Math.random() * 2 - 1) * 0.4; // Soften raw white input
      if (type === 'white') {
        output[i] = white;
      } else if (type === 'brown') {
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 1.5; // Reduced from 3.5
      } else { // pink
        output[i] = (lastOut + (0.1 * white)) / 1.1;
        lastOut = output[i];
        output[i] *= 1.2; // Reduced from 2.5
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;
    source.connect(gainNodeRef.current);
    noiseNodeRef.current = source;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => source.start());
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
      } catch (e) {}
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
      gainNodeRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.05);
    }
  }, [volume]);

  // Handle noise changes via direct user action
  const handleNoiseChange = (type) => {
    setNoiseType(type);
    startNoise(type);
  };

  // Handle DND Muting logic
  useEffect(() => {
    if (dndActive) {
        // We could play a transition sound here if we wanted
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
