import { useState, useRef, useEffect } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { getEnergyDef } from '../utils/energy';
import { Music, Play, Pause, Volume2, VolumeX, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DraggableWidget from './DraggableWidget';
import { useLanguage } from '../context/LanguageContext';
import GradientOrb from './GradientOrb';
import Aurora from './Aurora';
import './MusicPlayer.css';

// Google Drive Audio Tracks — stored as file IDs only (URLs are built at load time)
const GOOGLE_DRIVE_TRACKS = {
  "1": [
    { name: "Rainy library ambience", id: "1O1cknsyr0u6n6DLO83VsYjc50W2Q_wwN" }
  ],
  "2": [
    { name: "Rain & light piano", id: "1l3qiCh1yZ5xW4v9vaIUW0wJLVPST_NL6" }
  ],
  "3": [
    { name: "Cozy oldies night", id: "1mC0Mjb6yGIpEc-GO4rKALv0lKSPtGf4I" }
  ],
  "4": [
    { name: "Happy lo-fi beats",       id: "1wM6MgNlJ6je40SlG8VhFEExWJ7f_Ey3y" },
    { name: "Peaceful shiny morning",  id: "1z9N8Gz-zXD9Ahv4upWeI8JvptaU6Uoql" }
  ]
};

/**
 * Fetches a Google Drive audio file as a Blob and returns an objectURL.
 *
 * Why Blob URL instead of direct Drive src?
 *  - Google Drive does NOT include CORS headers on uc?export=download responses,
 *    so browsers refuse to load them as <audio src>.
 *  - By fetching through a proxy (Vite dev server proxy in dev, allorigins in prod)
 *    and converting to a Blob URL we sidestep CORS entirely — the browser treats
 *    the blob:// URL as a same-origin resource.
 */
async function fetchDriveBlob(fileId) {
  const path = `/uc?id=${fileId}&export=download&confirm=t`;

  // Vite injects import.meta.env.DEV as true in dev mode
  const fetchUrl = import.meta.env.DEV
    ? `/gdrive-proxy${path}`                                                          // Vite proxy → drive.google.com (no CORS)
    : `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://drive.google.com${path}`)}`; // production fallback

  const res = await fetch(fetchUrl, { cache: 'force-cache' });

  if (!res.ok) throw new Error(`Drive fetch failed: HTTP ${res.status}`);

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export default function MusicPlayer({ visible }) {
  const { currentEnergy, dndActive } = useEnergy();
  const { t } = useLanguage();
  const energyDef = getEnergyDef(currentEnergy);

  const [isPlaying,      setIsPlaying]      = useState(false);
  const [volume,         setVolume]         = useState(0.5);
  const [isMuted,        setIsMuted]        = useState(false);
  const [isLoading,      setIsLoading]      = useState(false);
  const [playlist,       setPlaylist]       = useState([]);
  const [trackIndex,     setTrackIndex]     = useState(0);
  const [trackName,      setTrackName]      = useState(t('music.noTracks'));
  const [blobUrl,        setBlobUrl]        = useState(null);

  const audioRef    = useRef(null);
  const prevBlob    = useRef(null); // reference to the previous blob URL so we can revoke it

  /** Load a track by index from `tracks`, optionally auto-playing once ready. */
  const loadTrack = async (tracks, idx, autoPlay = false) => {
    if (!tracks[idx]) return;

    // Revoke the old blob URL to free memory
    if (prevBlob.current) {
      URL.revokeObjectURL(prevBlob.current);
      prevBlob.current = null;
    }

    setBlobUrl(null);
    setIsLoading(true);
    setTrackName(tracks[idx].name);

    try {
      const url = await fetchDriveBlob(tracks[idx].id);
      prevBlob.current = url;
      setBlobUrl(url);

      if (autoPlay) {
        // audio element won't have the new src yet — wait for canplaythrough
        setTimeout(() => {
          const el = audioRef.current;
          if (!el) return;
          const tryPlay = () => {
            el.play().catch(e => console.error('Autoplay blocked:', e));
            el.removeEventListener('canplaythrough', tryPlay);
          };
          el.addEventListener('canplaythrough', tryPlay, { once: true });
        }, 0);
      }
    } catch (err) {
      console.error('Failed to load Drive track:', err);
      setTrackName(`${tracks[idx].name} — load error`);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-load playlist whenever the energy level changes
  useEffect(() => {
    const tracks = GOOGLE_DRIVE_TRACKS[String(currentEnergy)] || [];
    setPlaylist(tracks);
    setTrackIndex(0);

    if (tracks.length > 0) {
      loadTrack(tracks, 0, /* autoPlay= */ isPlaying);
    } else {
      setTrackName(t('music.noTracksFolder') + ' /' + currentEnergy);
      setIsPlaying(false);
      setBlobUrl(null);
    }

    return () => {
      if (prevBlob.current) {
        URL.revokeObjectURL(prevBlob.current);
        prevBlob.current = null;
      }
    };
  }, [currentEnergy]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = () => {
    if (playlist.length === 0 || isLoading) return;

    if (!blobUrl) {
      // Blob not yet fetched — trigger load with autoPlay
      loadTrack(playlist, trackIndex, true);
      setIsPlaying(true);
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play().catch(e => console.error('Play blocked:', e));
      setIsPlaying(true);
    }
  };

  const nextTrack = () => {
    if (playlist.length <= 1) return;
    const next = (trackIndex + 1) % playlist.length;
    setTrackIndex(next);
    loadTrack(playlist, next, isPlaying);
  };

  // Sync volume / mute
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
      defaultPosition={{ x: Math.max(20, window.innerWidth - 340), y: 120 }}
    >
      <div className="music-player">

        {/* Header: mode name + track name + orb */}
        <div className="music-player__header">
          <div className="music-player__now-playing">
            <span className="music-player__mode-name">{energyDef.name}</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={trackName}
                className="music-player__track-name"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
                title={trackName}
              >
                {isLoading ? '⏳ Loading…' : trackName}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="music-player__orb-container">
            <GradientOrb color={energyDef.vividColorA} size="100%" />
          </div>
        </div>

        {/* Hidden audio element — src is a local blob:// URL, no CORS issues */}
        {blobUrl && (
          <audio
            ref={audioRef}
            src={blobUrl}
            onEnded={nextTrack}
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
            className={`music-player__play-btn ${isPlaying ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
            onClick={togglePlay}
            disabled={playlist.length === 0 || isLoading}
          >
            {isLoading
              ? <span className="music-player__spinner" />
              : isPlaying
                ? <Pause size={18} fill="currentColor" />
                : <Play  size={18} fill="currentColor" style={{ marginLeft: '2px' }} />
            }
          </motion.button>

          <div className="music-player__side-controls">
            <div className="music-player__btn-row">
              <button
                className="btn-ghost btn-icon btn-sm"
                onClick={nextTrack}
                disabled={playlist.length <= 1 || isLoading}
                title={t('music.next')}
              >
                <SkipForward size={14} />
              </button>

              <button className="btn-ghost btn-icon btn-sm" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>

              <input
                type="range"
                min="0" max="1" step="0.05"
                value={isMuted ? 0 : volume}
                onChange={e => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                className="music-player__volume"
              />
            </div>
          </div>
        </div>

      </div>
    </DraggableWidget>
  );
}
