import { useState, useRef, useEffect } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { getEnergyDef } from '../utils/energy';
import { Music, Play, Pause, Volume2, VolumeX, SkipForward } from 'lucide-react';
import DraggableWidget from './DraggableWidget';
import { useLanguage } from '../context/LanguageContext';
import './MusicPlayer.css';

// Discover all mp3 files at compile time.
const moodTracksImport = import.meta.glob('/public/audio/moods/**/*.mp3', { query: '?url', import: 'default', eager: true });

import { motion, AnimatePresence } from 'framer-motion';

import GradientOrb from './GradientOrb';

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
    const tracks = Object.keys(moodTracksImport).filter(path => {
      return path.includes(`/audio/moods/${levelParam}/`);
    }).map(path => {
      const url = moodTracksImport[path];
      return url.startsWith('/public/') ? url.replace('/public', '') : url;
    });
    
    setPlaylist(tracks);
    setCurrentTrackIndex(0);
    
    if (tracks.length > 0) {
      const firstPath = tracks[0] || '';
      const filename = firstPath.split('/').pop()?.replace('.mp3', '').replaceAll('_', ' ').replaceAll('-', ' ') || '';
      setCurrentTrackName(decodeURIComponent(filename));
      
      if (isPlaying && audioRef.current) {
        setTimeout(() => {
          audioRef.current.play().catch(e => console.error(e));
        }, 50);
      }
    } else {
      setCurrentTrackName(t('music.noTracksFolder') + ' /' + currentEnergy);
      setIsPlaying(false);
    }
  }, [currentEnergy, t]); // Removed isPlaying from deps to avoid loop

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
    
    const urlStr = playlist[nextIdx] || '';
    const filename = urlStr.split('/').pop()?.replace('.mp3', '').replaceAll('_', ' ').replaceAll('-', ' ') || '';
    setCurrentTrackName(decodeURIComponent(filename));
    
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
      defaultPosition={{ x: window.innerWidth - 320, y: 120 }}
    >
      <div className="music-player">
        <div className="music-player__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div className="music-player__now-playing">
            <span className="music-player__mode-name">{energyDef.name}</span>
            <AnimatePresence mode="wait">
              <motion.span 
                key={currentTrackName}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 0.6, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                style={{ 
                  fontSize: '11px', 
                  display: 'block',
                  color: 'var(--text-secondary)', 
                  maxWidth: '160px', 
                  textOverflow: 'ellipsis', 
                  overflow: 'hidden', 
                  whiteSpace: 'nowrap',
                  fontWeight: 500,
                  marginTop: '2px'
                }} 
                title={currentTrackName}
              >
                {currentTrackName}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="music-player__orb-container" style={{ width: '48px', height: '48px' }}>
            <GradientOrb color={energyDef.vividColorA} size="100%" />
          </div>
        </div>

        {playlist.length > 0 && (
          <audio 
            ref={audioRef} 
            src={playlist[currentTrackIndex]} 
            onEnded={() => nextTrack()} 
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}

        <div className={`music-player__eq ${isPlaying ? 'playing' : ''}`}>
          {[...Array(10)].map((_, i) => (
            <div 
              key={i} 
              className="music-player__bar" 
              style={{ 
                animationDelay: `${i * 0.1}s`,
                height: isPlaying ? undefined : `${4 + Math.random() * 8}px`
              }} 
            />
          ))}
        </div>

        <div className="music-player__controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`music-player__play-btn ${isPlaying ? 'active' : ''}`} 
            onClick={togglePlay}
            disabled={playlist.length === 0}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />}
          </motion.button>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
