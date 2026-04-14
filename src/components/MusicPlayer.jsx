import { useState, useRef, useEffect } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { getEnergyDef } from '../utils/energy';
import { Music, Play, Pause, Volume2, VolumeX, SkipForward } from 'lucide-react';
import DraggableWidget from './DraggableWidget';
import './MusicPlayer.css';

// Discover all mp3 files at compile time.
const moodTracksImport = import.meta.glob('/public/audio/moods/**/*.mp3', { query: '?url', import: 'default', eager: true });

export default function MusicPlayer({ visible }) {
  const { currentEnergy } = useEnergy();
  const energyDef = getEnergyDef(currentEnergy);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTrackName, setCurrentTrackName] = useState('No tracks');
  
  const audioRef = useRef(null);

  // Build playlist and extract name
  useEffect(() => {
    const levelParam = String(currentEnergy);
    // filter keys based on directory matching e.g. /public/audio/moods/3/
    const tracks = Object.keys(moodTracksImport).filter(path => {
      return path.includes(`/audio/moods/${levelParam}/`);
    }).map(path => {
      const url = moodTracksImport[path];
      // Cleanup typical url prefix if imported statically
      return url.startsWith('/public/') ? url.replace('/public', '') : url;
    });
    
    setPlaylist(tracks);
    setCurrentTrackIndex(0);
    
    if (tracks.length > 0) {
      // Decode the raw path name to show as a readable track name
      let filename = Object.keys(moodTracksImport)
        .find(path => moodTracksImport[path] === (moodTracksImport[Object.keys(moodTracksImport)[0]])) || '';
      
      filename = tracks[0].split('/').pop().replace('.mp3', '').replaceAll('_', ' ').replaceAll('-', ' ');
      setCurrentTrackName(decodeURIComponent(filename));
      
      // Auto-restart if we were already playing
      if (isPlaying && audioRef.current) {
        setTimeout(() => {
          audioRef.current.play().catch(e => console.error(e));
        }, 50);
      }
    } else {
      setCurrentTrackName('No tracks in folder /' + currentEnergy);
      setIsPlaying(false);
    }
  }, [currentEnergy, isPlaying]);

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
    
    const urlStr = playlist[nextIdx];
    const filename = urlStr.split('/').pop().replace('.mp3', '').replaceAll('_', ' ').replaceAll('-', ' ');
    setCurrentTrackName(decodeURIComponent(filename));
    
    if (isPlaying) {
      setTimeout(() => {
        audioRef.current.play().catch(e => console.error('Audio play blocked:', e));
      }, 50);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  if (!visible) return null;

  return (
    <DraggableWidget 
      id="music" 
      title="Music" 
      icon={<Music size={14} />}
      defaultPosition={{ x: window.innerWidth - 310, y: 480 }}
    >
      <div className="music-player">
        <div className="music-player__now-playing" style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span className="music-player__mode-name">{energyDef.name}</span>
            <span className="music-player__mode-emoji">{energyDef.emoji}</span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', maxWidth: '140px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={currentTrackName}>
            {currentTrackName}
          </span>
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
          <div className="music-player__bar" style={{ animationDelay: '0s' }} />
          <div className="music-player__bar" style={{ animationDelay: '0.15s' }} />
          <div className="music-player__bar" style={{ animationDelay: '0.3s' }} />
          <div className="music-player__bar" style={{ animationDelay: '0.1s' }} />
          <div className="music-player__bar" style={{ animationDelay: '0.25s' }} />
        </div>

        <div className="music-player__controls" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            className={`music-player__play-btn ${isPlaying ? 'active' : ''}`} 
            onClick={togglePlay}
            disabled={playlist.length === 0}
            style={{ opacity: playlist.length === 0 ? 0.3 : 1 }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          
          <button 
            onClick={nextTrack}
            disabled={playlist.length <= 1}
            style={{ 
              opacity: playlist.length <= 1 ? 0.3 : 1, 
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: 'none',
              cursor: playlist.length <= 1 ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Next Track"
          >
            <SkipForward size={14} />
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
