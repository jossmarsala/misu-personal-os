import { useState, useRef, useEffect } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { getEnergyDef } from '../utils/energy';
import { Music, Play, Pause, Volume2, VolumeX, SkipForward } from 'lucide-react';
import DraggableWidget from './DraggableWidget';
import { useLanguage } from '../context/LanguageContext';
import './MusicPlayer.css';

// Google Drive Audio Tracks Configuration
const GOOGLE_DRIVE_TRACKS = {
  "1": [
    { name: "Rainy library ambience", url: "https://drive.google.com/uc?export=download&id=1O1cknsyr0u6n6DLO83VsYjc50W2Q_wwN" }
  ],
  "2": [
    { name: "Rain & light piano", url: "https://drive.google.com/uc?export=download&id=1l3qiCh1yZ5xW4v9vaIUW0wJLVPST_NL6" }
  ],
  "3": [
    { name: "Cozy oldies night", url: "https://drive.google.com/uc?export=download&id=1mC0Mjb6yGIpEc-GO4rKALv0lKSPtGf4I" }
  ],
  "4": [
    { name: "Happy lo-fi beats", url: "https://drive.google.com/uc?export=download&id=1wM6MgNlJ6je40SlG8VhFEExWJ7f_Ey3y" },
    { name: "Peaceful shiny morning", url: "https://drive.google.com/uc?export=download&id=1z9N8Gz-zXD9Ahv4upWeI8JvptaU6Uoql" }
  ]
};

import { motion, AnimatePresence } from 'framer-motion';
import GradientOrb from './GradientOrb';
import Aurora from './Aurora';

export default function MusicPlayer({ visible }) {
  const { currentEnergy, dndActive } = useEnergy();
  const { t } = useLanguage();
  const energyDef = getEnergyDef(currentEnergy);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTrackName, setCurrentTrackName] = useState(t('music.noTracks'));
  
  const audioRef = useRef(null);

  useEffect(() => {
    const levelParam = String(currentEnergy);
    const tracks = GOOGLE_DRIVE_TRACKS[levelParam] || [];
    
    setPlaylist(tracks);
    setCurrentTrackIndex(0);
    
    if (tracks.length > 0) {
      setCurrentTrackName(tracks[0].name);
      
      if (isPlaying && audioRef.current) {
        setTimeout(() => {
          audioRef.current.play().catch(e => console.error(e));
        }, 50);
      }
    } else {
      setCurrentTrackName(t('music.noTracksFolder') + ' /' + currentEnergy);
      setIsPlaying(false);
    }
  }, [currentEnergy, t, isPlaying]); // L4: include isPlaying so closure sees correct state

  const togglePlay = () => {
    if (playlist.length === 0) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.error('Audio play blocked:', e));
      setIsPlaying(true);
    }
  };

  const nextTrack = () => {
    if (playlist.length <= 1) return;
    const nextIdx = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(nextIdx);
    
    setCurrentTrackName(playlist[nextIdx].name);
    
    if (isPlaying) {
      setTimeout(() => {
        audioRef.current.play().catch(e => console.error('Audio play blocked:', e));
      }, 50);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = (isMuted || dndActive) ? 0 : volume;
    }
  }, [volume, isMuted, dndActive]);

  if (!visible) return null;

  return (
    <DraggableWidget 
      id="music" 
      title={t('music.title')} 
      icon={<Music size={14} />}
      defaultPosition={{ x: Math.max(20, window.innerWidth - 340), y: 120 }} // X3: safer positioning
    >
      <div className="music-player">
        {/* Header: mode name + track name + orb */}
        <div className="music-player__header">
          <div className="music-player__now-playing">
            <span className="music-player__mode-name">{energyDef.name}</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={currentTrackName}
                className="music-player__track-name"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
                title={currentTrackName}
              >
                {currentTrackName}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="music-player__orb-container">
            <GradientOrb color={energyDef.vividColorA} size="100%" />
          </div>
        </div>

        {playlist.length > 0 && (
          <audio 
            ref={audioRef} 
            src={playlist[currentTrackIndex]?.url} 
            onEnded={() => nextTrack()} 
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}

        {/* Sound wave visualizer */}
        <div className="music-player__aurora-wrap">
          <Aurora 
            colorStops={[energyDef.colorB, energyDef.vividColorA, energyDef.colorA]}
            blend={0.5}
            amplitude={isPlaying ? 1.2 : 0.1}
            speed={isPlaying ? 8.0 : 0.2}
            isPlaying={isPlaying}
          />
        </div>

        {/* Controls row */}
        <div className="music-player__controls">
          <motion.button 
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className={`music-player__play-btn ${isPlaying ? 'active' : ''}`} 
            onClick={togglePlay}
            disabled={playlist.length === 0}
          >
            {isPlaying
              ? <Pause size={18} fill="currentColor" />
              : <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />
            }
          </motion.button>
          
          <div className="music-player__side-controls">
            <div className="music-player__btn-row">
              <button 
                className="btn-ghost btn-icon btn-sm"
                onClick={nextTrack}
                disabled={playlist.length <= 1}
                title={t('music.next')}
              >
                <SkipForward size={14} />
              </button>

              <button className="btn-ghost btn-icon btn-sm" onClick={() => setIsMuted(!isMuted)}>
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
        </div>
      </div>
    </DraggableWidget>
  );
}
