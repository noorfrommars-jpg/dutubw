import React, { useState } from 'react';
import { MoreVertical, Clock, BookmarkPlus, Share2, EyeOff, Check } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { libraryService } from '../services/libraryService';

const VideoCard = ({ video, onOpenPlaylistModal, onOpenShareModal }) => {
  const { playVideo } = usePlayer();
  const [menuOpen, setMenuOpen] = useState(false);
  const [savedLater, setSavedLater] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleCardClick = () => {
    playVideo(video);
  };

  const handleToggleWatchLater = async (e) => {
    e.stopPropagation();
    try {
      const res = await libraryService.toggleWatchLater(video);
      setSavedLater(res.saved);
      setMenuOpen(false);
    } catch {
      // ignore
    }
  };

  const handleOpenPlaylists = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (onOpenPlaylistModal) onOpenPlaylistModal(video);
  };

  const handleOpenShare = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (onOpenShareModal) onOpenShareModal(video);
  };

  // High-performance direct YouTube thumbnail source with fallback
  const thumbSrc = imgError
    ? (video.originalThumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`)
    : (video.originalThumbnail || video.thumbnailUrl || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`);

  return (
    <div className="group relative flex flex-col w-full pb-3 border-b border-surface-dark-border/40 last:border-b-0 cursor-pointer">
      {/* Thumbnail Container */}
      <div
        onClick={handleCardClick}
        className="relative w-full aspect-video rounded-2xl overflow-hidden bg-surface-dark-elevated transition-transform group-active:scale-[0.99]"
      >
        <img
          src={thumbSrc}
          alt={video.title}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Video Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[11px] font-semibold text-white tracking-wide border border-white/10">
            {video.duration}
          </div>
        )}

        {/* Progress Bar (if continuing from previous watch) */}
        {video.progressSeconds > 0 && video.durationSeconds > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-dutube-500"
              style={{
                width: `${Math.min(100, (video.progressSeconds / video.durationSeconds) * 100)}%`
              }}
            />
          </div>
        )}
      </div>

      {/* Video Metadata Row */}
      <div className="flex items-start gap-3 mt-3 px-1">
        {/* Channel Avatar */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            // Could navigate to channel or play video
            handleCardClick();
          }}
          className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-surface-dark-elevated border border-white/10 hover:ring-2 hover:ring-dutube-500 transition-all"
        >
          <img
            src={video.channelAvatar || `/api/proxy/avatar/${encodeURIComponent(video.channelTitle)}`}
            alt={video.channelTitle}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(video.channelTitle)}`;
            }}
          />
        </div>

        {/* Title & Stats */}
        <div onClick={handleCardClick} className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug group-hover:text-dutube-400 transition-colors">
            {video.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
            <span className="font-medium hover:text-zinc-200 transition-colors truncate max-w-[120px]">
              {video.channelTitle}
            </span>
            <span>•</span>
            <span>{video.views}</span>
            <span>•</span>
            <span>{video.uploadTime}</span>
          </div>
        </div>

        {/* 3-Dots Menu Trigger */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(prev => !prev);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-surface-dark-elevated transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Popover Menu */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div className="absolute right-0 top-9 z-50 w-52 py-1.5 rounded-xl bg-surface-dark-card border border-surface-dark-border shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={handleToggleWatchLater}
                  className="w-full px-3.5 py-2 flex items-center gap-3 text-xs text-zinc-200 hover:bg-surface-dark-elevated transition-colors text-left"
                >
                  {savedLater ? <Check className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-zinc-400" />}
                  <span>{savedLater ? 'Saved to Watch Later' : 'Save to Watch Later'}</span>
                </button>

                <button
                  onClick={handleOpenPlaylists}
                  className="w-full px-3.5 py-2 flex items-center gap-3 text-xs text-zinc-200 hover:bg-surface-dark-elevated transition-colors text-left"
                >
                  <BookmarkPlus className="w-4 h-4 text-zinc-400" />
                  <span>Save to Playlist</span>
                </button>

                <button
                  onClick={handleOpenShare}
                  className="w-full px-3.5 py-2 flex items-center gap-3 text-xs text-zinc-200 hover:bg-surface-dark-elevated transition-colors text-left"
                >
                  <Share2 className="w-4 h-4 text-zinc-400" />
                  <span>Share</span>
                </button>

                <div className="my-1 border-t border-white/5" />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-3 text-xs text-zinc-400 hover:text-red-400 hover:bg-surface-dark-elevated transition-colors text-left"
                >
                  <EyeOff className="w-4 h-4" />
                  <span>Not interested</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
