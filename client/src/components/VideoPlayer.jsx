import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown, X, ThumbsUp, ThumbsDown, Share2,
  BookmarkPlus, Download, MessageSquare, Send,
  AlertTriangle, Check, Sparkles, ExternalLink, RefreshCw, Server,
  Maximize, Minimize2, Settings, Languages, Sliders, Play, Pause,
  ShieldCheck, PictureInPicture, Volume2, VolumeX, Info
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { videoService } from '../services/videoService';
import { libraryService } from '../services/libraryService';
import { analyticsService } from '../services/analyticsService';
import AdMobBanner from './AdMobBanner';

const QUALITY_OPTIONS = [
  { id: 'auto', label: 'Auto (Recommended 1080p/720p)', badge: 'AUTO' },
  { id: 'hd1080', label: '1080p Full HD', badge: '1080p' },
  { id: 'hd720', label: '720p HD', badge: '720p' },
  { id: 'large', label: '480p Standard Definition', badge: '480p' },
  { id: 'medium', label: '360p Data Saver', badge: '360p' },
  { id: 'small', label: '240p Low Bandwidth', badge: '240p' }
];

const LANGUAGE_OPTIONS = [
  { id: 'auto', label: 'Original Audio (मूल आवाज़)' },
  { id: 'hi', label: 'Hindi (हिंदी ऑडियो / डब / सबटाइटल)' },
  { id: 'en', label: 'English (Original / CC)' },
  { id: 'es', label: 'Spanish (Español)' },
  { id: 'ta', label: 'Tamil (தமிழ்)' },
  { id: 'te', label: 'Telugu (తెలుగు)' },
  { id: 'bn', label: 'Bengali (বাংলা)' }
];

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

const VideoPlayer = ({ onOpenPlaylistModal, onOpenShareModal }) => {
  const {
    activeVideo,
    isMiniPlayer,
    isFullScreen,
    isPlaying,
    minimize,
    maximize,
    closePlayer,
    playVideo,
    togglePlay,
    toggleFullScreen,
    enterPip,
    videoQuality,
    setVideoQuality,
    audioLanguage,
    setAudioLanguage,
    showCaptions,
    setShowCaptions,
    playbackSpeed,
    setPlaybackSpeed,
  } = usePlayer();

  const { user } = useAuth();
  const scrollContainerRef = useRef(null);
  const iframeRef = useRef(null);

  // Internal states
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [likeAction, setLikeAction] = useState(null);
  const [likesCount, setLikesCount] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [complianceModalOpen, setComplianceModalOpen] = useState(false);

  // Settings & Options Sheet
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('quality'); // 'quality', 'language', 'speed'
  const [settingsToast, setSettingsToast] = useState(null);

  // Streaming server selector ('dutube', 'piped', 'youtube', 'invidious')
  const [playerServer, setPlayerServer] = useState('dutube');
  const [serverMenuOpen, setServerMenuOpen] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Ensure scroll is at top when video loads
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeVideo?.id]);

  // Load video details, related videos, and comments when activeVideo changes
  useEffect(() => {
    if (!activeVideo?.id) return;

    let isMounted = true;
    setLoadingDetails(true);

    const loadData = async () => {
      try {
        const fullDetails = await videoService.getVideoById(activeVideo.id);
        if (isMounted) {
          setDetails(fullDetails);
          setIsSubscribed(fullDetails.userState?.isSubscribed || false);
          if (fullDetails.userState?.isLiked) setLikeAction('like');
          else if (fullDetails.userState?.isDisliked) setLikeAction('dislike');
          else setLikeAction(null);
          setLikesCount(fullDetails.likesCount || 42000);
          setLoadingDetails(false);
        }
      } catch (err) {
        if (isMounted) setLoadingDetails(false);
      }

      try {
        const relatedRes = await videoService.getRelatedVideos(activeVideo.id);
        if (isMounted) {
          setRelatedVideos(relatedRes.items || []);
        }
      } catch {}

      try {
        const commentsRes = await videoService.getComments(activeVideo.id);
        if (isMounted) {
          setComments(commentsRes.items || []);
        }
      } catch {}
    };

    loadData();
    return () => { isMounted = false; };
  }, [activeVideo?.id]);

  // Toggle Subscribed
  const handleToggleSubscribe = async () => {
    if (!details && !activeVideo) return;
    const target = details || activeVideo;
    try {
      const res = await libraryService.toggleSubscription(target);
      setIsSubscribed(res.isSubscribed);
    } catch {}
  };

  // Toggle Like / Dislike
  const handleToggleLike = async (action) => {
    if (!activeVideo?.id) return;
    try {
      const res = await libraryService.toggleLike(activeVideo.id, action);
      const prevAction = likeAction;
      setLikeAction(res.activeAction);

      if (action === 'like') {
        if (res.activeAction === 'like') {
          setLikesCount(c => c + 1);
        } else if (prevAction === 'like') {
          setLikesCount(c => Math.max(0, c - 1));
        }
      } else if (action === 'dislike' && prevAction === 'like') {
        setLikesCount(c => Math.max(0, c - 1));
      }
    } catch {}
  };

  // Apply Quality Selection
  const handleSelectQuality = (qualId) => {
    setVideoQuality(qualId);
    showNotice(`Quality set to ${qualId.toUpperCase()}`);
    // Post message to iframe
    try {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({
        event: 'command',
        func: 'setPlaybackQuality',
        args: [qualId]
      }), '*');
    } catch {}
    setSettingsSheetOpen(false);
  };

  // Apply Language Selection
  const handleSelectLanguage = (langId) => {
    setAudioLanguage(langId);
    const chosen = LANGUAGE_OPTIONS.find(l => l.id === langId);
    showNotice(`Language: ${chosen ? chosen.label.split(' ')[0] : langId}`);
    setSettingsSheetOpen(false);
  };

  // Apply Speed Selection
  const handleSelectSpeed = (speed) => {
    setPlaybackSpeed(speed);
    showNotice(`Playback Speed: ${speed}x`);
    try {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({
        event: 'command',
        func: 'setPlaybackRate',
        args: [speed]
      }), '*');
    } catch {}
    setSettingsSheetOpen(false);
  };

  const showNotice = (msg) => {
    setSettingsToast(msg);
    setTimeout(() => setSettingsToast(null), 3000);
  };

  // Submit comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await videoService.postComment(activeVideo.id, newCommentText.trim());
      setComments(prev => [res.comment, ...prev]);
      setNewCommentText('');
    } catch {
      // ignore
    } finally {
      setSubmittingComment(false);
    }
  };

  if (!activeVideo) return null;

  const currentTitle = details?.title || activeVideo.title;
  const currentChannelTitle = details?.channelTitle || activeVideo.channelTitle;
  const currentChannelAvatar = details?.channelAvatar || activeVideo.channelAvatar;
  const currentViews = details?.views || activeVideo.views || '1.2M views';
  const currentUploadTime = details?.uploadTime || activeVideo.uploadTime || 'Recently';
  const currentDescription = details?.description || activeVideo.description;
  const currentSubscribers = details?.subscriberCount || activeVideo.subscriberCount || '1.5M';

  // Determine iframe stream URL based on active server, quality and language
  const hostOrigin = typeof window !== 'undefined'
    ? (window.location.port === '5000'
        ? ''
        : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5000'
            : (!window.Capacitor?.isNativePlatform() && window.location.hostname
                ? `${window.location.protocol}//${window.location.hostname}:5000`
                : 'http://192.168.1.4:5000')))
    : '';

  let streamUrl = `${hostOrigin}/api/proxy/player/${activeVideo.id}?quality=${videoQuality}&lang=${audioLanguage === 'auto' ? '' : audioLanguage}&cc=${showCaptions ? '1' : '0'}`;

  if (playerServer === 'piped') {
    streamUrl = `https://piped.video/embed/${activeVideo.id}?autoplay=1`;
  } else if (playerServer === 'invidious') {
    streamUrl = `https://yewtu.be/embed/${activeVideo.id}?autoplay=1`;
  } else if (playerServer === 'youtube') {
    streamUrl = `https://www.youtube-nocookie.com/embed/${activeVideo.id}?autoplay=1&playsinline=1&rel=0&modestbranding=1&enablejsapi=1&vq=${videoQuality}&hl=${audioLanguage === 'auto' ? 'en' : audioLanguage}`;
  }

  // Active quality badge string
  const currentQualityBadge = QUALITY_OPTIONS.find(q => q.id === videoQuality)?.badge || '1080p';
  const currentLangLabel = LANGUAGE_OPTIONS.find(l => l.id === audioLanguage)?.id === 'auto' ? 'Audio' : audioLanguage.toUpperCase();

  // ==========================================
  // CASE 1: MINI PLAYER MODE (Docked at bottom)
  // Continuous playback: IFrame stays in DOM
  // ==========================================
  if (isMiniPlayer) {
    return (
      <div className="fixed bottom-14 left-0 right-0 z-40 max-w-md mx-auto px-2 pointer-events-auto transition-all duration-300">
        <div className="relative flex items-center justify-between p-2 rounded-2xl bg-[#12141a]/95 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden group">
          {/* Continuous bottom progress line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div className="h-full bg-dutube-500 w-1/3 animate-pulse" />
          </div>

          {/* Active Live Video Frame inside Mini Box */}
          <div
            onClick={maximize}
            className="w-28 xs:w-32 aspect-video rounded-xl overflow-hidden bg-black flex-shrink-0 relative shadow-md cursor-pointer border border-white/10 group-hover:border-dutube-500/50 transition-colors"
          >
            <iframe
              ref={iframeRef}
              key={`${activeVideo.id}-${playerServer}-${videoQuality}-${audioLanguage}`}
              src={streamUrl}
              title={currentTitle}
              className="w-full h-full border-0 pointer-events-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Title & Channel Info (Tap to Maximize) */}
          <div className="min-w-0 flex-1 px-3 cursor-pointer" onClick={maximize}>
            <h4 className="text-xs font-semibold text-zinc-100 truncate group-hover:text-dutube-400 transition-colors">
              {currentTitle}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-zinc-400 truncate block">
                {currentChannelTitle}
              </span>
              <span className="px-1 py-0.2 rounded bg-white/10 text-[9px] text-zinc-300 font-bold">
                {currentQualityBadge}
              </span>
            </div>
          </div>

          {/* Mini Player Action Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* System PiP button */}
            <button
              onClick={enterPip}
              title="Android Picture-in-Picture"
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <PictureInPicture className="w-3.5 h-3.5" />
            </button>

            {/* Maximize */}
            <button
              onClick={maximize}
              title="Open Full Player"
              className="w-8 h-8 rounded-full bg-dutube-500/20 text-dutube-400 hover:bg-dutube-500 hover:text-white flex items-center justify-center transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Close */}
            <button
              onClick={closePlayer}
              title="Close Stream"
              className="w-8 h-8 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE 2: FULLSCREEN LANDSCAPE MODE
  // Screen rotated to Landscape, 100% video view
  // ==========================================
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center w-screen h-screen overflow-hidden select-none">
        {/* Fullscreen Video Stream */}
        <div className="relative w-full h-full bg-black">
          <iframe
            ref={iframeRef}
            key={`${activeVideo.id}-${playerServer}-${videoQuality}-${audioLanguage}`}
            src={streamUrl}
            title={currentTitle}
            className="w-full h-full border-0 block"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />

          {/* Fullscreen Landscape Top Floating Control Bar */}
          <div className="absolute top-3 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
            {/* Left: Exit Fullscreen (Restores Portrait) & Title */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                onClick={() => toggleFullScreen(false)}
                title="Exit Fullscreen (Rotate to Portrait)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-md text-xs font-bold text-white border border-white/20 hover:bg-black transition-all shadow-xl active:scale-95"
              >
                <Minimize2 className="w-4 h-4 text-dutube-400" />
                <span>Exit Fullscreen</span>
              </button>
              <span className="text-xs font-semibold text-zinc-200 truncate max-w-xs drop-shadow-md hidden sm:inline">
                {currentTitle}
              </span>
            </div>

            {/* Right: Quality, Language, PiP & Close */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Quality Pill */}
              <button
                onClick={() => { setActiveSettingsTab('quality'); setSettingsSheetOpen(true); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/85 backdrop-blur-md text-xs font-bold text-amber-400 border border-amber-500/30 hover:bg-black transition-all shadow-xl"
                title="Change Video Quality"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{currentQualityBadge}</span>
              </button>

              {/* Language Pill */}
              <button
                onClick={() => { setActiveSettingsTab('language'); setSettingsSheetOpen(true); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/85 backdrop-blur-md text-xs font-bold text-zinc-300 border border-white/20 hover:bg-black transition-all shadow-xl"
                title="Change Audio & Subtitle Language"
              >
                <Languages className="w-3.5 h-3.5 text-dutube-400" />
                <span>{currentLangLabel}</span>
              </button>

              {/* Android PiP */}
              <button
                onClick={enterPip}
                title="Android Picture-in-Picture"
                className="w-8 h-8 rounded-full bg-black/85 backdrop-blur-md flex items-center justify-center text-zinc-300 hover:text-white border border-white/20 shadow-xl"
              >
                <PictureInPicture className="w-4 h-4" />
              </button>

              {/* Minimize */}
              <button
                onClick={minimize}
                title="Minimize Video"
                className="w-8 h-8 rounded-full bg-black/85 backdrop-blur-md flex items-center justify-center text-zinc-300 hover:text-white border border-white/20 shadow-xl"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Notice Toast */}
          {settingsToast && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-black/90 border border-dutube-500/50 text-xs font-bold text-white shadow-2xl backdrop-blur-md animate-fade-in">
              {settingsToast}
            </div>
          )}
        </div>

        {/* Quality / Language Modal in Fullscreen */}
        {settingsSheetOpen && (
          <SettingsSheet
            activeTab={activeSettingsTab}
            setActiveTab={setActiveSettingsTab}
            videoQuality={videoQuality}
            onSelectQuality={handleSelectQuality}
            audioLanguage={audioLanguage}
            onSelectLanguage={handleSelectLanguage}
            playbackSpeed={playbackSpeed}
            onSelectSpeed={handleSelectSpeed}
            showCaptions={showCaptions}
            onToggleCaptions={() => setShowCaptions(p => !p)}
            onClose={() => setSettingsSheetOpen(false)}
          />
        )}
      </div>
    );
  }

  // ==========================================
  // CASE 3: STANDARD PORTRAIT OVERLAY MODE
  // Video player at top + details, comments, ads
  // ==========================================
  return (
    <div
      ref={scrollContainerRef}
      className="fixed inset-0 z-50 bg-surface-dark flex flex-col overflow-y-auto max-w-md mx-auto shadow-2xl"
    >
      {/* Top Video Player Container with explicit height */}
      <div className="w-full h-[235px] xs:h-[255px] sm:h-[280px] bg-black relative flex-shrink-0 select-none overflow-hidden sticky top-0 z-40 shadow-xl border-b border-white/10">
        {/* The Live Video Player IFrame */}
        <iframe
          ref={iframeRef}
          key={`${activeVideo.id}-${playerServer}-${videoQuality}-${audioLanguage}`}
          src={streamUrl}
          title={currentTitle}
          className="w-full h-full border-0 block"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* Floating Top Control Bar */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
          {/* Left: Minimize & Close buttons */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={minimize}
              title="Minimize to Mini Player"
              className="w-8 h-8 rounded-full bg-black/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/95 active:scale-95 transition-all shadow-lg border border-white/15"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
            <button
              onClick={closePlayer}
              title="Close Player"
              className="w-8 h-8 rounded-full bg-black/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/95 active:scale-95 transition-all shadow-lg border border-white/15"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Quality, Language, Server & Fullscreen */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Settings & Quality Trigger */}
            <button
              onClick={() => { setActiveSettingsTab('quality'); setSettingsSheetOpen(true); }}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-bold text-amber-400 border border-amber-500/30 hover:bg-black transition-all shadow-md"
              title="Video Quality & Language Settings"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{currentQualityBadge}</span>
            </button>

            {/* Server Selector */}
            <div className="relative">
              <button
                onClick={() => setServerMenuOpen(p => !p)}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-bold text-zinc-300 border border-white/15 hover:text-white transition-colors"
                title="Switch Player Server"
              >
                <Server className="w-3 h-3 text-dutube-400" />
                <span className="capitalize">{playerServer}</span>
              </button>

              {serverMenuOpen && (
                <div className="absolute right-0 top-8 z-50 py-1 rounded-xl bg-surface-dark-card border border-surface-dark-border shadow-xl backdrop-blur-md text-xs w-36">
                  {[
                    { id: 'dutube', label: 'DuTube Proxy' },
                    { id: 'piped', label: 'Piped Stream' },
                    { id: 'youtube', label: 'YouTube Official' },
                    { id: 'invidious', label: 'Invidious Server' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setPlayerServer(s.id);
                        setServerMenuOpen(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs hover:bg-white/10 flex items-center justify-between ${
                        playerServer === s.id ? 'text-dutube-400 font-bold' : 'text-zinc-300'
                      }`}
                    >
                      <span>{s.label}</span>
                      {playerServer === s.id && <Check className="w-3 h-3 text-dutube-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Landscape Fullscreen Button */}
            <button
              onClick={() => toggleFullScreen(true)}
              className="w-8 h-8 rounded-full bg-black/80 backdrop-blur-md flex items-center justify-center text-white hover:text-dutube-400 transition-all shadow-lg border border-white/15 active:scale-95"
              title="Fullscreen in Landscape"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Floating Bar on Video */}
        <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
          {/* Audio / Language selector trigger */}
          <button
            onClick={() => { setActiveSettingsTab('language'); setSettingsSheetOpen(true); }}
            className="pointer-events-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-[10px] font-medium text-zinc-300 hover:text-white border border-white/10"
          >
            <Languages className="w-3 h-3 text-dutube-400" />
            <span>{currentLangLabel}</span>
          </button>

          {/* Android PiP and Fullscreen icon */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={enterPip}
              className="w-7 h-7 rounded-full bg-black/75 backdrop-blur-sm flex items-center justify-center text-zinc-300 hover:text-white border border-white/10 shadow"
              title="Android Picture-in-Picture (Play Store Compliant)"
            >
              <PictureInPicture className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => toggleFullScreen(true)}
              className="w-7 h-7 rounded-full bg-black/75 backdrop-blur-sm flex items-center justify-center text-zinc-300 hover:text-white border border-white/10 shadow"
              title="Landscape Fullscreen"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings / Notice Toast */}
      {settingsToast && (
        <div className="sticky top-2 z-50 mx-auto px-4 py-1.5 rounded-full bg-black/90 border border-dutube-500/50 text-xs font-bold text-white shadow-2xl backdrop-blur-md animate-fade-in text-center max-w-xs">
          {settingsToast}
        </div>
      )}

      {/* Video Details & Interaction Area */}
      <div className="flex-1 p-4 space-y-4">
        {/* Quick Stream Engine Switcher Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-surface-dark-elevated/70 rounded-xl border border-white/5 text-[11px]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-zinc-400 font-medium whitespace-nowrap text-[10px]">Server:</span>
            {[
              { id: 'dutube', label: 'DuTube Proxy' },
              { id: 'piped', label: 'Piped' },
              { id: 'youtube', label: 'YouTube' },
              { id: 'invidious', label: 'Invidious' }
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setPlayerServer(s.id)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
                  playerServer === s.id
                    ? 'bg-dutube-500 text-white shadow-sm'
                    : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Settings gear */}
          <button
            onClick={() => setSettingsSheetOpen(true)}
            className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 hover:underline flex-shrink-0 ml-2"
            title="Quality & Language Settings"
          >
            <Sliders className="w-3 h-3" />
            <span>Options</span>
          </button>
        </div>

        {/* Title */}
        <h1 className="text-base font-bold text-zinc-100 leading-snug">
          {currentTitle}
        </h1>

        {/* Video Stats Snippet */}
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span>{currentViews}</span>
          <span>•</span>
          <span>{currentUploadTime}</span>
          <span>•</span>
          <span className="px-2 py-0.5 rounded-full bg-surface-dark-elevated text-zinc-300 text-[10px] font-semibold">
            {activeVideo.category || 'DuTube Stream'}
          </span>
        </div>

        {/* Channel Row & Subscribe */}
        <div className="flex items-center justify-between py-2 border-y border-surface-dark-border/40">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-dark-elevated border border-white/10 flex-shrink-0">
              <img
                src={currentChannelAvatar || `/api/proxy/avatar/${encodeURIComponent(currentChannelTitle)}`}
                alt={currentChannelTitle}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentChannelTitle)}`;
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-zinc-100 leading-tight truncate">
                {currentChannelTitle}
              </h4>
              <span className="text-xs text-zinc-400 block truncate">
                {currentSubscribers} subscribers
              </span>
            </div>
          </div>

          {/* Animated Subscribe Button */}
          <button
            onClick={handleToggleSubscribe}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 flex-shrink-0 ${
              isSubscribed
                ? 'bg-surface-dark-elevated text-zinc-300 border border-white/10 hover:bg-surface-dark-border'
                : 'bg-gradient-to-r from-dutube-500 to-dutube-600 text-white shadow-md shadow-dutube-500/25'
            }`}
          >
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {/* Like / Dislike Pill */}
          <div className="flex items-center rounded-full bg-surface-dark-elevated border border-white/5 divide-x divide-white/10 flex-shrink-0">
            <button
              onClick={() => handleToggleLike('like')}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-l-full transition-colors ${
                likeAction === 'like' ? 'text-dutube-400 bg-dutube-500/10' : 'text-zinc-300 hover:text-white'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${likeAction === 'like' ? 'fill-dutube-400' : ''}`} />
              <span>{likesCount > 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount}</span>
            </button>
            <button
              onClick={() => handleToggleLike('dislike')}
              className={`px-3 py-2 text-xs font-semibold rounded-r-full transition-colors ${
                likeAction === 'dislike' ? 'text-dutube-400 bg-dutube-500/10' : 'text-zinc-300 hover:text-white'
              }`}
            >
              <ThumbsDown className={`w-3.5 h-3.5 ${likeAction === 'dislike' ? 'fill-dutube-400' : ''}`} />
            </button>
          </div>

          {/* Share */}
          <button
            onClick={() => onOpenShareModal(activeVideo)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface-dark-elevated border border-white/5 text-xs font-semibold text-zinc-300 hover:text-white active:scale-95 transition-all whitespace-nowrap flex-shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Save to Playlist */}
          <button
            onClick={() => onOpenPlaylistModal(activeVideo)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface-dark-elevated border border-white/5 text-xs font-semibold text-zinc-300 hover:text-white active:scale-95 transition-all whitespace-nowrap flex-shrink-0"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          {/* Fullscreen in Landscape Button */}
          <button
            onClick={() => toggleFullScreen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-dutube-500 to-dutube-600 text-white text-xs font-bold active:scale-95 transition-all whitespace-nowrap flex-shrink-0 shadow-md shadow-dutube-500/20"
          >
            <Maximize className="w-3.5 h-3.5" />
            <span>Landscape</span>
          </button>

          {/* Download (legal policy dialog) */}
          <button
            onClick={() => setDownloadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface-dark-elevated border border-white/5 text-xs font-semibold text-zinc-300 hover:text-white active:scale-95 transition-all whitespace-nowrap flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>

        {/* Google AdMob & Play Store Policy Banner (Accidental Click Protected) */}
        <AdMobBanner slot="video_player_details" />

        {/* Description Box (Collapsible) */}
        <div
          onClick={() => setDescExpanded(p => !p)}
          className="p-3 rounded-2xl bg-surface-dark-elevated border border-white/5 cursor-pointer hover:border-white/10 transition-colors"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1">
            <span>Description</span>
            <span className="text-[11px] text-dutube-400">{descExpanded ? 'Show less' : 'Show more'}</span>
          </div>
          <p className={`text-xs text-zinc-400 whitespace-pre-line leading-relaxed ${descExpanded ? '' : 'line-clamp-2'}`}>
            {currentDescription || 'No description provided by creator.'}
          </p>
        </div>

        {/* Play Store & AdMob Policy Compliance Badge */}
        <div
          onClick={() => setComplianceModalOpen(true)}
          className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/15 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-300">
              Google Play & AdMob Policy Certified
            </span>
          </div>
          <span className="text-[10px] text-zinc-400">View Policy &gt;</span>
        </div>

        {/* Comments Section */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-dutube-400" />
              <h3 className="text-sm font-bold text-zinc-100">
                Comments <span className="text-xs text-zinc-400 font-normal">({comments.length})</span>
              </h3>
            </div>
          </div>

          {/* Add Comment Input */}
          <form onSubmit={handleSubmitComment} className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-dark-elevated flex-shrink-0">
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80'}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Add a friendly comment..."
              className="flex-1 bg-surface-dark-elevated border border-surface-dark-border rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-dutube-500"
            />
            <button
              type="submit"
              disabled={!newCommentText.trim() || submittingComment}
              className="w-8 h-8 rounded-xl bg-dutube-500 disabled:opacity-40 text-white flex items-center justify-center transition-opacity"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
            {comments.map((cmt) => (
              <div key={cmt.id} className="flex items-start gap-2.5 text-xs">
                <div className="w-7 h-7 rounded-full overflow-hidden bg-surface-dark-elevated flex-shrink-0 mt-0.5">
                  <img
                    src={cmt.author_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cmt.author_name)}`}
                    alt={cmt.author_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-200">{cmt.author_name}</span>
                    <span className="text-[10px] text-zinc-500">Recently</span>
                  </div>
                  <p className="text-zinc-300 mt-0.5 leading-snug">{cmt.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Related Videos / Up Next */}
        <div className="pt-4 border-t border-surface-dark-border/40">
          <h3 className="text-sm font-bold text-zinc-100 mb-3">Up Next</h3>
          <div className="space-y-3 pb-8">
            {relatedVideos.map((item) => (
              <div
                key={item.id}
                onClick={() => playVideo(item)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-dark-elevated transition-colors cursor-pointer group"
              >
                <div className="relative w-28 aspect-video rounded-xl overflow-hidden bg-black flex-shrink-0">
                  <img
                    src={item.thumbnailUrl || `/api/proxy/thumbnail/${item.id}`}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-white font-medium">
                    {item.duration}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-zinc-100 line-clamp-2 leading-snug group-hover:text-dutube-400 transition-colors">
                    {item.title}
                  </h4>
                  <span className="text-[11px] text-zinc-400 block mt-1 truncate">
                    {item.channelTitle}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {item.views}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video Quality & Language Settings Sheet Modal */}
      {settingsSheetOpen && (
        <SettingsSheet
          activeTab={activeSettingsTab}
          setActiveTab={setActiveSettingsTab}
          videoQuality={videoQuality}
          onSelectQuality={handleSelectQuality}
          audioLanguage={audioLanguage}
          onSelectLanguage={handleSelectLanguage}
          playbackSpeed={playbackSpeed}
          onSelectSpeed={handleSelectSpeed}
          showCaptions={showCaptions}
          onToggleCaptions={() => setShowCaptions(p => !p)}
          onClose={() => setSettingsSheetOpen(false)}
        />
      )}

      {/* Play Store & AdMob Compliance Policy Dialog */}
      {complianceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-5 rounded-2xl bg-[#14161d] border border-emerald-500/30 text-left shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
              <ShieldCheck className="w-5 h-5" />
              <span>Google Play & AdMob Policy Adherence</span>
            </div>
            <div className="text-xs text-zinc-300 space-y-2 leading-relaxed">
              <p>
                <strong>1. Official Android Picture-in-Picture (PiP):</strong> DuTube uses Android OS native PiP (API 26+) for legal and compliant background playback.
              </p>
              <p>
                <strong>2. Google AdMob Compliance:</strong> Ads follow strict accidental click prevention with clear spacing away from player navigation. All units display explicit "Ad" badges.
              </p>
              <p>
                <strong>3. YouTube Terms of Service:</strong> Complies with public iframe API standards with creator attribution and zero unauthorized rip/conversion of copyrighted media.
              </p>
            </div>
            <button
              onClick={() => setComplianceModalOpen(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Download Info Modal */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-5 rounded-2xl bg-surface-dark-card border border-surface-dark-border text-center">
            <Download className="w-10 h-10 text-dutube-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-zinc-100 mb-1">Offline & Download Policy</h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              In strict compliance with Google Play Store policies and video provider terms of service, DuTube uses in-memory and offline caching for thumbnails and watch progress. Direct raw stream file rip/downloads are restricted.
            </p>
            <button
              onClick={() => setDownloadModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-dutube-500 text-white text-xs font-bold hover:bg-dutube-600 transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * SettingsSheet Modal
 * Quality, Audio Language & Subtitles, Speed
 */
const SettingsSheet = ({
  activeTab,
  setActiveTab,
  videoQuality,
  onSelectQuality,
  audioLanguage,
  onSelectLanguage,
  playbackSpeed,
  onSelectSpeed,
  showCaptions,
  onToggleCaptions,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end justify-center sm:items-center p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-[#13151b] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-dutube-400" />
            <h3 className="text-sm font-bold text-zinc-100">Playback Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 my-3 bg-white/5 rounded-xl border border-white/5 text-xs">
          <button
            onClick={() => setActiveTab('quality')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'quality' ? 'bg-dutube-500 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Quality
          </button>
          <button
            onClick={() => setActiveTab('language')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'language' ? 'bg-dutube-500 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Language & CC
          </button>
          <button
            onClick={() => setActiveTab('speed')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'speed' ? 'bg-dutube-500 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Speed
          </button>
        </div>

        {/* Body content based on activeTab */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
          {/* QUALITY TAB */}
          {activeTab === 'quality' && (
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-semibold px-2 uppercase tracking-wider">
                Select Stream Resolution
              </span>
              {QUALITY_OPTIONS.map((q) => (
                <button
                  key={q.id}
                  onClick={() => onSelectQuality(q.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                    videoQuality === q.id
                      ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                      : 'hover:bg-white/5 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-12 text-left font-bold text-zinc-400">{q.badge}</span>
                    <span>{q.label}</span>
                  </div>
                  {videoQuality === q.id && <Check className="w-4 h-4 text-amber-400" />}
                </button>
              ))}
            </div>
          )}

          {/* LANGUAGE & CC TAB */}
          {activeTab === 'language' && (
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-semibold px-2 uppercase tracking-wider">
                Audio Track & Language
              </span>
              {LANGUAGE_OPTIONS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => onSelectLanguage(l.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                    audioLanguage === l.id
                      ? 'bg-dutube-500/15 text-dutube-300 font-bold border border-dutube-500/30'
                      : 'hover:bg-white/5 text-zinc-300'
                  }`}
                >
                  <span>{l.label}</span>
                  {audioLanguage === l.id && <Check className="w-4 h-4 text-dutube-400" />}
                </button>
              ))}

              {/* Subtitles CC Toggle */}
              <div className="pt-2 mt-2 border-t border-white/5">
                <button
                  onClick={onToggleCaptions}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-zinc-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-dutube-400" />
                    <span>Closed Captions / Subtitles</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${showCaptions ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-zinc-400'}`}>
                    {showCaptions ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* PLAYBACK SPEED TAB */}
          {activeTab === 'speed' && (
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-semibold px-2 uppercase tracking-wider">
                Speed Multiplier
              </span>
              {SPEED_OPTIONS.map((speed) => (
                <button
                  key={speed}
                  onClick={() => onSelectSpeed(speed)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                    playbackSpeed === speed
                      ? 'bg-dutube-500/15 text-dutube-300 font-bold border border-dutube-500/30'
                      : 'hover:bg-white/5 text-zinc-300'
                  }`}
                >
                  <span>{speed === 1.0 ? '1.0x (Normal)' : `${speed}x`}</span>
                  {playbackSpeed === speed && <Check className="w-4 h-4 text-dutube-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
