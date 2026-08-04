import { useState, useRef, useEffect } from 'react';
import { useEnergy } from '../context/EnergyContext';
import { getEnergyDef } from '../utils/energy';
import { Music, Play, Pause, Volume2, VolumeX, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import YouTube from 'react-youtube';
import DraggableWidget from './DraggableWidget';
import { useLanguage } from '../context/LanguageContext';
import GradientOrb from './GradientOrb';
import PixelWave from './PixelWave';
import './MusicPlayer.css';

// YouTube Audio Tracks mapped to energy levels
const YOUTUBE_TRACKS = {
  "1": [
    { name: "Lofi Girl - chill beats", id: "n61ULEU7CO0" },
    { name: "Forest sounds", id: "xNN7iTA57jM" },
    { name: "Cafe with music ambience", id: "Syuj5aMpiFs" },
    { name: "Relaxing affirmations playlist", id: "JYdfoZReAW8" }
  ],
  "2": [
    { name: "Coffee Shop Jazz", id: "pfx4r7_WdP8" },
    { name: "Chill playlist", id: "4QXVSfCI7m0" },
    { name: "Soft vintage oldies", id: "7xBdtvLx9UE" },
    { name: "Minecraft songs", id: "ANkxRGvl1VY" }
  ],
  "3": [
    { name: "Cozy oldies night", id: "iWuNnm-VUzY" }
  ],
  "4": [
    { name: "Peaceful shiny morning",  id: "T9dp6PAsNJs" },
    { name: "Sunshine jazz", id: "OtpBe_HqL0A" }
  ]
};

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
  
  const [videoId,        setVideoId]        = useState(null);
  const playerRef = useRef(null);

  /** Load a track by index from `tracks`, optionally auto-playing once ready. */
  const loadTrack = (tracks, idx, autoPlay = false) => {
    if (!tracks[idx]) return;

    setIsLoading(true);
    setTrackName(tracks[idx].name);
    setVideoId(tracks[idx].id);
    
    // Autoplay will be handled by onPlayerReady if isPlaying is true
  };

  // Re-load playlist whenever the energy level changes
  useEffect(() => {
    const tracks = YOUTUBE_TRACKS[String(currentEnergy)] || [];
    setPlaylist(tracks);
    setTrackIndex(0);

    if (tracks.length > 0) {
      loadTrack(tracks, 0, isPlaying);
    } else {
      setTrackName(t('music.noTracksFolder') + ' /' + currentEnergy);
      setIsPlaying(false);
      setVideoId(null);
    }
  }, [currentEnergy]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = () => {
    if (playlist.length === 0) return;
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      player.pauseVideo();
      setIsPlaying(false);
    } else {
      player.playVideo();
      setIsPlaying(true);
    }
  };

  const nextTrack = () => {
    if (playlist.length <= 1) return;
    const next = (trackIndex + 1) % playlist.length;
    setTrackIndex(next);
    loadTrack(playlist, next, isPlaying);
  };

  const jumpToTrack = (idx) => {
    if (idx === trackIndex) return;
    setTrackIndex(idx);
    loadTrack(playlist, idx, isPlaying);
  };

  // Sync volume / mute — and smooth-fade on Shield activate / deactivate
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (dndActive) {
      // Smooth fade down to near-zero over ~400ms (20 steps × 20ms)
      let current = isMuted ? 0 : volume * 100;
      const target = 5; // whisper level — not fully silent so it can recover
      const steps = 20;
      const delta = (current - target) / steps;
      let step = 0;
      const fade = setInterval(() => {
        step++;
        current = Math.max(target, current - delta);
        try { player.setVolume(current); } catch (_) {}
        if (step >= steps) clearInterval(fade);
      }, 20);
    } else {
      // Fade back up to the user's volume
      const target = isMuted ? 0 : volume * 100;
      let current = 5;
      const steps = 20;
      const delta = (target - current) / steps;
      let step = 0;
      const fade = setInterval(() => {
        step++;
        current = Math.min(target, current + delta);
        try { player.setVolume(current); } catch (_) {}
        if (step >= steps) clearInterval(fade);
      }, 20);
    }
  }, [dndActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync volume / mute when user changes them manually (shield-unrelated)
  useEffect(() => {
    const player = playerRef.current;
    if (player && !dndActive) {
      player.setVolume(isMuted ? 0 : volume * 100);
    }
  }, [volume, isMuted]); // eslint-disable-line react-hooks/exhaustive-deps


  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    // When shield is active, start at whisper level; fade logic will handle the rest
    const vol = isMuted ? 0 : dndActive ? 5 : volume * 100;
    event.target.setVolume(vol);
    setIsLoading(false);
    
    if (isPlaying) {
      event.target.playVideo();
    }
  };


  const onPlayerStateChange = (event) => {
    // 1 is playing, 2 is paused, 0 is ended, 3 is buffering
    if (event.data === 1) {
      setIsPlaying(true);
      setIsLoading(false);
    } else if (event.data === 2) {
      setIsPlaying(false);
    } else if (event.data === 0) {
      nextTrack();
    } else if (event.data === 3) {
      setIsLoading(true);
    }
  };

  const youtubeOpts = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
    },
  };

  if (!visible) return null;

  return (
    <DraggableWidget
      id="music"
      title={t('music.title')}
      icon={<Music size={14} />}
      defaultPosition={{ x: Math.max(20, window.innerWidth - 470), y: 120 }}
      customWidth={450}
    >
      <div className="music-player-layout">

        {/* ── Existing player (untouched) ── */}
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
          </div>

          {/* Hidden YouTube player — key forces remount on track change so onReady fires */}
          {videoId && (
            <div style={{ display: 'none' }}>
              <YouTube
                key={videoId}
                videoId={videoId}
                opts={youtubeOpts}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
              />
            </div>
          )}

          {/* Sound wave visualizer */}
          <div className="music-player__aurora-wrap">
            <PixelWave isPlaying={isPlaying} />
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

        {/* ── Compact track-list panel ── */}
        {playlist.length > 0 && (
          <div className="music-tracklist">
            <div className="music-tracklist__header">
              <span className="music-tracklist__label">QUEUE</span>
              <span className="music-tracklist__count">{playlist.length}</span>
            </div>
            <ul className="music-tracklist__list">
              {playlist.map((track, idx) => (
                <motion.li
                  key={track.id}
                  className={`music-tracklist__item${
                    idx === trackIndex ? ' music-tracklist__item--active' : ''
                  }`}
                  onClick={() => jumpToTrack(idx)}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.12 }}
                  title={track.name}
                >
                  <span className="music-tracklist__num">
                    {idx === trackIndex
                      ? <span className="music-tracklist__playing-dot" />
                      : idx + 1
                    }
                  </span>
                  <span className="music-tracklist__name">{track.name}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </DraggableWidget>
  );
}
