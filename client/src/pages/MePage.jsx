import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  User, Settings, Moon, Sun, ShieldCheck, LogOut,
  Sparkles, History, Bookmark, Tv2, Info, ChevronRight, Check
} from 'lucide-react';

const MePage = ({ onOpenAuth, onOpenAdmin }) => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const [quality, setQuality] = useState('Auto (1080p)');
  const [autoplay, setAutoplay] = useState(true);
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleClearCache = () => {
    localStorage.removeItem('dutube_temp_cache');
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };

  return (
    <div className="flex flex-col w-full pb-24 p-4 space-y-5">
      {/* Profile Card */}
      {isAuthenticated && user ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-surface-dark-card to-surface-dark-elevated border border-surface-dark-border shadow-xl">
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-surface-dark-border border border-white/10 ring-2 ring-dutube-500/30">
              <img
                src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100 truncate">{user.username}</h2>
                {isAdmin && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 truncate">{user.email}</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-center">
            <div className="p-2 rounded-xl bg-surface-dark/50">
              <span className="text-sm font-extrabold text-zinc-100 block">
                {user.stats?.history ?? 12}
              </span>
              <span className="text-[10px] text-zinc-400">Watched</span>
            </div>
            <div className="p-2 rounded-xl bg-surface-dark/50">
              <span className="text-sm font-extrabold text-zinc-100 block">
                {user.stats?.subscriptions ?? 4}
              </span>
              <span className="text-[10px] text-zinc-400">Subscribed</span>
            </div>
            <div className="p-2 rounded-xl bg-surface-dark/50">
              <span className="text-sm font-extrabold text-zinc-100 block">
                {user.stats?.playlists ?? 2}
              </span>
              <span className="text-[10px] text-zinc-400">Playlists</span>
            </div>
          </div>
        </div>
      ) : (
        /* Guest Banner with Sign In / Sign Up Trigger */
        <div className="p-5 rounded-2xl bg-gradient-to-r from-surface-dark-card to-surface-dark-elevated border border-dutube-500/20 text-center shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-dutube-500/10 border border-dutube-500/30 text-dutube-400 flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-100 mb-1">Sign in to DuTube</h3>
          <p className="text-xs text-zinc-400 mb-4 max-w-xs mx-auto">
            Sync your watch history, subscribe to channels, and create custom playlists across all devices.
          </p>
          <button
            onClick={onOpenAuth}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-dutube-500 to-dutube-600 text-white text-xs font-bold shadow-md shadow-dutube-500/25 active:scale-98 transition-all"
          >
            Sign In or Create Account
          </button>
        </div>
      )}

      {/* Admin Panel Quick Access */}
      <div className="p-3.5 rounded-2xl bg-surface-dark-card border border-surface-dark-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-dutube-500/10 text-dutube-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-200">Admin Control Center</h4>
              <p className="text-[11px] text-zinc-400">Configure native ads frequency & manage users</p>
            </div>
          </div>
          <button
            onClick={onOpenAdmin}
            className="px-3 py-1.5 rounded-xl bg-dutube-500/20 hover:bg-dutube-500/30 text-dutube-300 text-xs font-bold border border-dutube-500/30"
          >
            Open
          </button>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-1">
          Preferences & Playback
        </span>

        <div className="rounded-2xl bg-surface-dark-card border border-surface-dark-border divide-y divide-white/5 overflow-hidden">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="w-4 h-4 text-dutube-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">App Appearance</h4>
                <p className="text-[11px] text-zinc-400">{isDark ? 'Obsidian Dark' : 'Clean Light'}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-3 py-1 rounded-full bg-surface-dark-elevated text-xs font-semibold text-zinc-300 border border-white/5"
            >
              Toggle
            </button>
          </div>

          {/* Video Streaming Quality */}
          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-dutube-400" />
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">Streaming Quality</h4>
                <p className="text-[11px] text-zinc-400">Default playback resolution</p>
              </div>
            </div>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="bg-surface-dark-elevated text-xs font-semibold text-zinc-300 rounded-lg px-2.5 py-1 border border-white/5 focus:outline-none"
            >
              <option>Auto (1080p)</option>
              <option>1080p FHD</option>
              <option>720p HD</option>
              <option>480p SD</option>
            </select>
          </div>

          {/* Autoplay Toggle */}
          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
              <Tv2 className="w-4 h-4 text-dutube-400" />
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">Autoplay Next Video</h4>
                <p className="text-[11px] text-zinc-400">Continuous playback</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoplay}
              onChange={(e) => setAutoplay(e.target.checked)}
              className="w-4 h-4 rounded accent-dutube-500 cursor-pointer"
            />
          </div>

          {/* Clear Cache */}
          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
              <History className="w-4 h-4 text-dutube-400" />
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">Thumbnail & Memory Cache</h4>
                <p className="text-[11px] text-zinc-400">
                  {cacheCleared ? 'Cache cleared successfully' : 'Free local storage buffer'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClearCache}
              className="px-3 py-1 rounded-full bg-surface-dark-elevated hover:bg-surface-dark-border text-xs font-semibold text-zinc-300 border border-white/5"
            >
              {cacheCleared ? <Check className="w-3.5 h-3.5 text-emerald-400 inline" /> : 'Clear'}
            </button>
          </div>
        </div>
      </div>

      {/* About & Legal */}
      <div className="rounded-2xl bg-surface-dark-card border border-surface-dark-border p-3.5 text-xs text-zinc-400 space-y-1">
        <div className="flex items-center gap-2 font-bold text-zinc-200 mb-1">
          <Info className="w-4 h-4 text-dutube-500" />
          <span>About DuTube</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          DuTube version 2.0.0 Pro. Built with high-efficiency thumbnail proxy engine and official YouTube player integration. All rights and advertisements of content creators are strictly respected.
        </p>
      </div>

      {/* Logout */}
      {isAuthenticated && (
        <button
          onClick={logout}
          className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      )}
    </div>
  );
};

export default MePage;
