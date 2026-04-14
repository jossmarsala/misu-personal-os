import { useState, useRef, useEffect, useCallback } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { getEnergyDef } from '../utils/energy';
import { Music, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import DraggableWidget from './DraggableWidget';
import './MusicPlayer.css';

// Sound profiles per energy level using Web Audio API
const PROFILES = {
  1: { // gentle hum — slow sine pads, pentatonic
    baseFreq: 220, type: 'sine', tempo: 0.3, notes: [1, 1.125, 1.25, 1.5, 1.667],
    attack: 0.8, release: 2.0, gain: 0.06,
  },
  2: { // quiet drift — layered drones, evolving
    baseFreq: 165, type: 'sine', tempo: 0.2, notes: [1, 1.2, 1.5, 1.8, 2.0],
    attack: 1.2, release: 3.0, gain: 0.05,
  },
  3: { // focus flow — lo-fi chords, gentle beat
    baseFreq: 196, type: 'triangle', tempo: 0.5, notes: [1, 1.189, 1.498, 1.782, 2.0],
    attack: 0.3, release: 1.5, gain: 0.07,
  },
  4: { // creative spark — brighter, playful arpeggios
    baseFreq: 262, type: 'triangle', tempo: 0.7, notes: [1, 1.26, 1.498, 1.682, 2.0],
    attack: 0.15, release: 0.8, gain: 0.06,
  },
  5: { // wild rhythm — complex chords, walking patterns
    baseFreq: 220, type: 'sawtooth', tempo: 0.9, notes: [1, 1.26, 1.498, 1.782, 2.245],
    attack: 0.08, release: 0.5, gain: 0.04,
  },
};

export default function MusicPlayer({ visible }) {
  const { currentEnergy } = useEnergy();
  const energyDef = getEnergyDef(currentEnergy);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const intervalRef = useRef(null);
  const activeOscsRef = useRef([]);

  const stopAll = useCallback(() => {
    activeOscsRef.current.forEach(osc => {
      try { osc.stop(); } catch {}
    });
    activeOscsRef.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const playNote = useCallback((ctx, masterGain, profile) => {
    const noteIndex = Math.floor(Math.random() * profile.notes.length);
    const freq = profile.baseFreq * profile.notes[noteIndex];

    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = profile.type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Slight detune for warmth
    osc.detune.setValueAtTime((Math.random() - 0.5) * 10, ctx.currentTime);

    noteGain.gain.setValueAtTime(0, ctx.currentTime);
    noteGain.gain.linearRampToValueAtTime(profile.gain, ctx.currentTime + profile.attack);
    noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + profile.attack + profile.release);

    osc.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start();
    osc.stop(ctx.currentTime + profile.attack + profile.release + 0.1);
    activeOscsRef.current.push(osc);

    osc.onended = () => {
      activeOscsRef.current = activeOscsRef.current.filter(o => o !== osc);
    };
  }, []);

  const startPlayback = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    if (!gainNodeRef.current) {
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.connect(ctx.destination);
    }
    gainNodeRef.current.gain.setValueAtTime(isMuted ? 0 : volume, ctx.currentTime);

    const profile = PROFILES[currentEnergy] || PROFILES[3];

    // Play initial cluster
    for (let i = 0; i < 2; i++) {
      setTimeout(() => playNote(ctx, gainNodeRef.current, profile), i * 200);
    }

    // Schedule ongoing notes
    const intervalMs = Math.max(800, 2500 / profile.tempo);
    intervalRef.current = setInterval(() => {
      if (audioCtxRef.current && gainNodeRef.current) {
        playNote(audioCtxRef.current, gainNodeRef.current, profile);
      }
    }, intervalMs);
  }, [currentEnergy, volume, isMuted, playNote]);

  const togglePlay = () => {
    if (isPlaying) {
      stopAll();
      setIsPlaying(false);
    } else {
      startPlayback();
      setIsPlaying(true);
    }
  };

  // Update volume in real time
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(
        isMuted ? 0 : volume,
        audioCtxRef.current.currentTime
      );
    }
  }, [volume, isMuted]);

  // Restart playback when energy changes (if playing)
  useEffect(() => {
    if (isPlaying) {
      stopAll();
      startPlayback();
    }
  }, [currentEnergy]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, [stopAll]);

  if (!visible) return null;

  return (
    <DraggableWidget 
      id="music" 
      title="Music" 
      icon={<Music size={14} />}
      defaultPosition={{ x: window.innerWidth - 310, y: 480 }}
    >
      <div className="music-player">
        <div className="music-player__now-playing">
          <span className="music-player__mode-name">{energyDef.name}</span>
          <span className="music-player__mode-emoji">{energyDef.emoji}</span>
        </div>

        {/* Equalizer bars */}
        <div className={`music-player__eq ${isPlaying ? 'playing' : ''}`}>
          <div className="music-player__bar" style={{ animationDelay: '0s' }} />
          <div className="music-player__bar" style={{ animationDelay: '0.15s' }} />
          <div className="music-player__bar" style={{ animationDelay: '0.3s' }} />
          <div className="music-player__bar" style={{ animationDelay: '0.1s' }} />
          <div className="music-player__bar" style={{ animationDelay: '0.25s' }} />
        </div>

        {/* Controls */}
        <div className="music-player__controls">
          <button className={`music-player__play-btn ${isPlaying ? 'active' : ''}`} onClick={togglePlay}>
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button className="music-player__mute-btn" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
            className="music-player__volume"
          />
        </div>
      </div>
    </DraggableWidget>
  );
}
