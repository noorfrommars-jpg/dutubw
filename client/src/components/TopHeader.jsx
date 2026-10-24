import React, { useState } from 'react';
import { Search, Bell, Link2, ShieldCheck, Sun, Moon } from 'lucide-react';
import Logo from './Logo';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const TopHeader = ({ onOpenSearch, onOpenDirectPlay, onOpenNotifications, onOpenAdmin, currentTab }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [hasNewNotifications, setHasNewNotifications] = useState(true);

  return (
    <header className="sticky top-0 z-30 w-full bg-surface-dark/95 backdrop-blur-md border-b border-surface-dark-border/50 px-3.5 pt-3 pb-2.5 flex items-center justify-between transition-colors">
      {/* Brand Logo */}
      <div className="flex items-center gap-2">
        <Logo size="md" />
      </div>

      {/* Action Icons Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Direct YT Video URL / ID Paste Button */}
        <button
          onClick={onOpenDirectPlay}
          title="Play Any YouTube Video by Link/ID"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-dutube-500/10 text-dutube-400 border border-dutube-500/25 text-xs font-semibold hover:bg-dutube-500/20 active:scale-95 transition-all"
        >
          <Link2 className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Any YT Link</span>
        </button>

        {/* Admin Dashboard Pill */}
        <button
          onClick={onOpenAdmin}
          title="DuTube Admin Portal"
          className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-surface-dark-elevated hover:bg-surface-dark-border text-zinc-300 border border-white/5 text-xs font-medium active:scale-95 transition-all"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-dutube-400" />
          <span className="hidden sm:inline">Admin</span>
        </button>

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-surface-dark-elevated transition-colors"
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-700" />}
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => {
            setHasNewNotifications(false);
            onOpenNotifications();
          }}
          className="relative w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-surface-dark-elevated transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {hasNewNotifications && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-dutube-500 ring-2 ring-surface-dark animate-pulse" />
          )}
        </button>

        {/* Prominent Search Button with clean icon & comfortable touch target */}
        <button
          onClick={onOpenSearch}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white bg-surface-dark-elevated hover:bg-surface-dark-border border border-white/10 hover:border-dutube-500/40 active:scale-95 transition-all shadow-sm"
          title="Search Videos"
          aria-label="Search YouTube"
        >
          <Search className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>
    </header>
  );
};

export default TopHeader;
