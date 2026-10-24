import React, { useState, useEffect } from 'react';
import { libraryService } from '../services/libraryService';
import { usePlayer } from '../context/PlayerContext';
import { History, Clock, ThumbsUp, ListMusic, Plus, Play, Trash2 } from 'lucide-react';

const LibraryPage = ({ onOpenPlaylistModal }) => {
  const { playVideo } = usePlayer();
  const [history, setHistory] = useState([]);
  const [watchLater, setWatchLater] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLibraryData();
  }, []);

  const loadLibraryData = async () => {
    setLoading(true);
    try {
      const [hist, wl, pl] = await Promise.all([
        libraryService.getHistory(),
        libraryService.getWatchLater(),
        libraryService.getPlaylists()
      ]);
      setHistory(hist);
      setWatchLater(wl);
      setPlaylists(pl);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleResumeHistory = (item) => {
    playVideo({
      id: item.video_id,
      title: item.title,
      channelTitle: item.channel_title,
      channelAvatar: item.channel_avatar,
      thumbnailUrl: item.thumbnail_url,
      duration: item.duration,
      durationSeconds: item.duration_seconds
    }, item.progress_seconds || 0);
  };

  const handleClearHistory = async () => {
    if (window.confirm('Clear all watch history?')) {
      await libraryService.clearHistory();
      setHistory([]);
    }
  };

  return (
    <div className="flex flex-col w-full pb-24 p-4 space-y-6">
      {/* 1. Continue Watching / Recent History Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-dutube-500" />
            <h2 className="text-sm font-bold text-zinc-100">Continue Watching</h2>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-[11px] text-zinc-400 hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {history.map((item) => {
              const progressPct = (item.progress_seconds && item.duration_seconds)
                ? (item.progress_seconds / item.duration_seconds) * 100
                : 35;

              return (
                <div
                  key={item.id}
                  onClick={() => handleResumeHistory(item)}
                  className="w-44 flex-shrink-0 cursor-pointer group"
                >
                  {/* Thumbnail with progress bar */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black mb-1.5">
                    <img
                      src={item.thumbnail_url || `/api/proxy/thumbnail/${item.video_id}`}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />

                    {/* Resume Play Icon */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-dutube-500 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-dutube-500"
                        style={{ width: `${Math.min(100, Math.max(10, progressPct))}%` }}
                      />
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-zinc-100 line-clamp-2 leading-snug group-hover:text-dutube-400 transition-colors">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-zinc-400 block mt-0.5 truncate">
                    {item.channel_title}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 py-2">
            Videos you watch will appear here with saved progress.
          </p>
        )}
      </div>

      {/* 2. Watch Later Section */}
      <div className="border-t border-surface-dark-border/40 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-dutube-400" />
            <h2 className="text-sm font-bold text-zinc-100">Watch Later</h2>
            <span className="text-xs text-zinc-400">({watchLater.length})</span>
          </div>
        </div>

        {watchLater.length > 0 ? (
          <div className="space-y-2">
            {watchLater.slice(0, 4).map((item) => (
              <div
                key={item.id}
                onClick={() => playVideo({
                  id: item.video_id,
                  title: item.title,
                  channelTitle: item.channel_title,
                  channelAvatar: item.channel_avatar,
                  thumbnailUrl: item.thumbnail_url,
                  duration: item.duration
                })}
                className="flex items-center gap-3 p-2 rounded-xl bg-surface-dark-elevated hover:bg-surface-dark-border transition-colors cursor-pointer group"
              >
                <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0">
                  <img
                    src={item.thumbnail_url || `/api/proxy/thumbnail/${item.video_id}`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] text-white">
                    {item.duration || '10:00'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-dutube-400 transition-colors">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-zinc-400 block truncate">{item.channel_title}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 py-1">No videos saved to watch later yet.</p>
        )}
      </div>

      {/* 3. Playlists Section */}
      <div className="border-t border-surface-dark-border/40 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-dutube-500" />
            <h2 className="text-sm font-bold text-zinc-100">Playlists</h2>
          </div>
          <button
            onClick={() => onOpenPlaylistModal && onOpenPlaylistModal(null)}
            className="flex items-center gap-1 text-xs font-semibold text-dutube-400 hover:text-dutube-300"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Playlist</span>
          </button>
        </div>

        {playlists.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                className="p-3 rounded-2xl bg-surface-dark-elevated border border-white/5 hover:border-dutube-500/30 transition-all cursor-pointer group"
              >
                <div className="w-full aspect-video rounded-xl bg-surface-dark-border mb-2 overflow-hidden flex items-center justify-center relative">
                  {pl.cover_url ? (
                    <img src={pl.cover_url} alt={pl.title} className="w-full h-full object-cover" />
                  ) : (
                    <ListMusic className="w-6 h-6 text-zinc-500" />
                  )}
                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-zinc-300 font-semibold">
                    {pl.item_count || 0}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-zinc-200 truncate group-hover:text-dutube-400 transition-colors">
                  {pl.title}
                </h4>
                <span className="text-[10px] text-zinc-400">
                  {pl.is_private ? 'Private' : 'Public'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 py-1">
            Create custom playlists to organize your favorite videos and soundtracks.
          </p>
        )}
      </div>
    </div>
  );
};

export default LibraryPage;
