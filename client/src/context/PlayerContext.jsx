import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { libraryService } from '../services/libraryService';
import { analyticsService } from '../services/analyticsService';

const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
  const [activeVideo, setActiveVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [playerError, setPlayerError] = useState(null);

  // Video Options
  const [videoQuality, setVideoQuality] = useState('auto'); // 'auto', 'hd1080', 'hd720', 'large', 'medium', 'small'
  const [audioLanguage, setAudioLanguage] = useState('auto'); // 'auto', 'hi', 'en', 'es', 'ta', 'te', 'bn'
  const [showCaptions, setShowCaptions] = useState(false);

  // Player ref for YouTube IFrame instance
  const ytPlayerRef = useRef(null);
  const progressSaveTimerRef = useRef(null);

  // Play a video
  const playVideo = (video, startTime = 0) => {
    if (!video) return;
    setActiveVideo(video);
    setIsMiniPlayer(false);
    setIsPlaying(true);
    setPlayerError(null);
    if (startTime > 0) {
      setCurrentTime(startTime);
    }

    analyticsService.track('video_open', { videoId: video.id, title: video.title });

    // Initial history save
    libraryService.saveProgress({
      videoId: video.id,
      title: video.title,
      channelTitle: video.channelTitle,
      channelAvatar: video.channelAvatar,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      durationSeconds: video.durationSeconds || 0,
      progressSeconds: startTime
    }).catch(() => {});
  };

  // Sync watch progress periodically
  useEffect(() => {
    if (!activeVideo || !isPlaying) return;

    if (progressSaveTimerRef.current) {
      clearInterval(progressSaveTimerRef.current);
    }

    progressSaveTimerRef.current = setInterval(() => {
      if (currentTime > 2) {
        libraryService.saveProgress({
          videoId: activeVideo.id,
          title: activeVideo.title,
          channelTitle: activeVideo.channelTitle,
          channelAvatar: activeVideo.channelAvatar,
          thumbnailUrl: activeVideo.thumbnailUrl,
          duration: activeVideo.duration,
          durationSeconds: duration || activeVideo.durationSeconds || 0,
          progressSeconds: Math.floor(currentTime)
        }).catch(() => {});
      }
    }, 6000);

    return () => {
      if (progressSaveTimerRef.current) {
        clearInterval(progressSaveTimerRef.current);
      }
    };
  }, [activeVideo, isPlaying, currentTime, duration]);

  const togglePlay = () => {
    if (ytPlayerRef.current) {
      if (isPlaying) {
        try { ytPlayerRef.current.pauseVideo(); } catch {}
        setIsPlaying(false);
      } else {
        try { ytPlayerRef.current.playVideo(); } catch {}
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(prev => !prev);
    }
  };

  const seekTo = (seconds) => {
    const clamped = Math.max(0, Math.min(seconds, duration || 9999));
    setCurrentTime(clamped);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      try {
        ytPlayerRef.current.seekTo(clamped, true);
      } catch {}
    }
  };

  const seekRelative = (deltaSeconds) => {
    seekTo(currentTime + deltaSeconds);
  };

  const minimize = () => {
    if (isFullScreen) {
      toggleFullScreen(false);
    }
    setIsMiniPlayer(true);
  };

  const maximize = () => {
    setIsMiniPlayer(false);
  };

  // Fullscreen Landscape Toggle
  const toggleFullScreen = (forceState) => {
    const nextState = typeof forceState === 'boolean' ? forceState : !isFullScreen;
    setIsFullScreen(nextState);

    // Call Android native bridge or Web ScreenOrientation
    try {
      if (window.AndroidBridge && window.AndroidBridge.setOrientation) {
        window.AndroidBridge.setOrientation(nextState ? 'landscape' : 'portrait');
      } else if (window.screen && window.screen.orientation) {
        if (nextState && window.screen.orientation.lock) {
          window.screen.orientation.lock('landscape').catch(() => {});
        } else if (window.screen.orientation.unlock) {
          window.screen.orientation.unlock();
        }
      }
    } catch (e) {
      // orientation lock fallback
    }

    // HTML5 Fullscreen API fallback
    try {
      if (nextState) {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    } catch (e) {}
  };

  // Picture in Picture (Android Native / Web)
  const enterPip = () => {
    try {
      if (window.AndroidBridge && window.AndroidBridge.enterPip) {
        window.AndroidBridge.enterPip();
        return;
      }
    } catch {}

    try {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
      } else {
        const videoEl = document.querySelector('video');
        if (videoEl && videoEl.requestPictureInPicture) {
          videoEl.requestPictureInPicture().catch(() => {});
        }
      }
    } catch {}
  };

  const closePlayer = () => {
    // If fullscreen, restore portrait first
    if (isFullScreen) {
      toggleFullScreen(false);
    }

    // Save final progress
    if (activeVideo && currentTime > 2) {
      libraryService.saveProgress({
        videoId: activeVideo.id,
        title: activeVideo.title,
        channelTitle: activeVideo.channelTitle,
        channelAvatar: activeVideo.channelAvatar,
        thumbnailUrl: activeVideo.thumbnailUrl,
        duration: activeVideo.duration,
        durationSeconds: duration || activeVideo.durationSeconds || 0,
        progressSeconds: Math.floor(currentTime)
      }).catch(() => {});
    }

    setActiveVideo(null);
    setIsPlaying(false);
    setIsMiniPlayer(false);
    setIsFullScreen(false);
    setCurrentTime(0);
    setDuration(0);
  };

  return (
    <PlayerContext.Provider
      value={{
        activeVideo,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        playbackSpeed,
        isMiniPlayer,
        isFullScreen,
        playerError,
        ytPlayerRef,
        videoQuality,
        audioLanguage,
        showCaptions,
        playVideo,
        togglePlay,
        seekTo,
        seekRelative,
        minimize,
        maximize,
        closePlayer,
        toggleFullScreen,
        enterPip,
        setVideoQuality,
        setAudioLanguage,
        setShowCaptions,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        setVolume,
        setIsMuted,
        setPlaybackSpeed,
        setIsFullScreen,
        setPlayerError,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
