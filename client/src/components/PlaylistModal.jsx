import React, { useState, useEffect } from 'react';
import { X, Plus, Check, FolderPlus, ListMusic } from 'lucide-react';
import { libraryService } from '../services/libraryService';

const PlaylistModal = ({ video, onClose }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const list = await libraryService.getPlaylists();
      setPlaylists(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    try {
      await libraryService.addToPlaylist(playlistId, video);
      setSuccessMsg('Saved to playlist!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1000);
    } catch (err) {
      // ignore
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await libraryService.createPlaylist(newTitle.trim());
      await libraryService.addToPlaylist(created.id, video);
      setSuccessMsg('Playlist created & video added!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } catch {
      // ignore
    }
  };

  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl bg-surface-dark-card border border-surface-dark-border p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-dutube-500" />
            <h3 className="text-sm font-bold text-zinc-100">Save to Playlist</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {successMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Playlists List */}
        <div className="max-h-52 overflow-y-auto space-y-1.5 mb-4 no-scrollbar">
          {playlists.length === 0 && !loading && !showCreate && (
            <p className="text-xs text-zinc-400 py-3 text-center">
              No playlists found. Create your first playlist below!
            </p>
          )}

          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => handleAddToPlaylist(pl.id)}
              className="w-full p-2.5 rounded-xl bg-surface-dark-elevated hover:bg-surface-dark-border border border-white/5 flex items-center justify-between text-left transition-colors active:scale-98"
            >
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">{pl.title}</h4>
                <span className="text-[10px] text-zinc-400">{pl.item_count || 0} videos</span>
              </div>
              <Plus className="w-4 h-4 text-dutube-400" />
            </button>
          ))}
        </div>

        {/* Create Playlist Toggle or Input Form */}
        {showCreate ? (
          <form onSubmit={handleCreatePlaylist} className="space-y-2">
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter playlist title..."
              className="w-full bg-surface-dark-elevated border border-surface-dark-border rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-dutube-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="flex-1 py-2 rounded-xl bg-dutube-500 text-white text-xs font-semibold disabled:opacity-40"
              >
                Create & Save
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-3 py-2 rounded-xl bg-surface-dark-elevated text-zinc-400 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-zinc-700 hover:border-dutube-500 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-surface-dark-elevated transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-dutube-500" />
            <span>New Playlist</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PlaylistModal;
