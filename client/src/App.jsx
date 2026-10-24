import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import TopHeader from './components/TopHeader';
import BottomNav from './components/BottomNav';
import MiniPlayer from './components/MiniPlayer';
import VideoPlayer from './components/VideoPlayer';
import SplashScreen from './components/SplashScreen';
import DirectPlayModal from './components/DirectPlayModal';
import NotificationDrawer from './components/NotificationDrawer';
import ShareModal from './components/ShareModal';
import PlaylistModal from './components/PlaylistModal';
import AuthModal from './components/AuthModal';

import HomePage from './pages/HomePage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import LibraryPage from './pages/LibraryPage';
import MePage from './pages/MePage';
import SearchPage from './pages/SearchPage';
import AdminPage from './pages/AdminPage';

import { Smartphone, Monitor } from 'lucide-react';

const MainAppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentTab, setCurrentTab] = useState('home');
  const [showSearch, setShowSearch] = useState(false);
  const [showDirectPlay, setShowDirectPlay] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [shareVideo, setShareVideo] = useState(null);
  const [playlistVideo, setPlaylistVideo] = useState(null);

  // Responsive frame toggle: 'mobile' shell vs 'responsive'
  const [viewMode, setViewMode] = useState('mobile');

  // Detect physical native mobile device / app
  const isNative = typeof window !== 'undefined' && (
    Boolean(window.Capacitor?.isNativePlatform()) ||
    Boolean(window.AndroidBridge) ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );

  // Listen to browser query params if URL has ?v=...
  const { playVideo, isFullScreen } = usePlayer();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('v');
    if (videoId) {
      playVideo({
        id: videoId,
        title: `DuTube Video (${videoId})`,
        channelTitle: 'YouTube Creator',
        thumbnailUrl: `/api/proxy/thumbnail/${videoId}`
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 flex flex-col items-center justify-start antialiased selection:bg-dutube-500 selection:text-white">
      {/* Animated Splash Screen */}
      {showSplash && <SplashScreen onFinished={() => setShowSplash(false)} />}

      {/* Top Device Frame Toggle Bar (Desktop & Developer Friendly only) */}
      {!isNative && (
        <div className="hidden sm:flex items-center justify-between w-full max-w-5xl px-4 py-2 border-b border-white/5 bg-[#090b0e] text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-zinc-300">DuTube Mobile Streaming Engine v2.0</span>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-zinc-400">60 FPS Optimized</span>
          </div>
          <div className="flex items-center gap-2 bg-surface-dark-elevated p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'mobile' ? 'bg-dutube-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Device Shell</span>
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'full' ? 'bg-dutube-500 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Fluid Responsive</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Container / Mobile Device Mockup or Native Mobile App */}
      <div
        className={`w-full transition-all duration-300 relative bg-surface-dark flex flex-col ${
          isNative
            ? 'w-full min-h-screen'
            : viewMode === 'mobile'
            ? 'max-w-[430px] min-h-screen sm:min-h-[880px] sm:my-6 sm:rounded-[44px] sm:border-[8px] sm:border-[#22252b] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden'
            : 'max-w-2xl min-h-screen border-x border-white/5'
        }`}
      >
        {/* Sleek Mobile Speaker simulation only in desktop preview mode */}
        {!isNative && viewMode === 'mobile' && (
          <div className="hidden sm:flex justify-center pt-2.5 pb-1 relative z-30 bg-surface-dark">
            <div className="w-24 h-4 rounded-full bg-black/90 flex items-center justify-center border border-white/10">
              <div className="w-3 h-3 rounded-full bg-[#111] mr-3" />
              <div className="w-2 h-2 rounded-full bg-[#111]" />
            </div>
          </div>
        )}

        {/* Top Header (Hidden when player is in full landscape) */}
        {!isFullScreen && (
          <TopHeader
            currentTab={currentTab}
            onOpenSearch={() => setShowSearch(true)}
            onOpenDirectPlay={() => setShowDirectPlay(true)}
            onOpenNotifications={() => setShowNotifications(true)}
            onOpenAdmin={() => setShowAdmin(true)}
          />
        )}

        {/* Active Page View */}
        <main className="flex-1 w-full">
          {currentTab === 'home' && (
            <HomePage
              onOpenPlaylistModal={(v) => setPlaylistVideo(v)}
              onOpenShareModal={(v) => setShareVideo(v)}
            />
          )}

          {currentTab === 'subscriptions' && (
            <SubscriptionsPage
              onOpenPlaylistModal={(v) => setPlaylistVideo(v)}
              onOpenShareModal={(v) => setShareVideo(v)}
            />
          )}

          {currentTab === 'library' && (
            <LibraryPage
              onOpenPlaylistModal={(v) => setPlaylistVideo(v)}
            />
          )}

          {currentTab === 'me' && (
            <MePage
              onOpenAuth={() => setShowAuth(true)}
              onOpenAdmin={() => setShowAdmin(true)}
            />
          )}
        </main>

        {/* Docked Mini Player (Handles continuous background playback) */}
        <MiniPlayer />

        {/* Bottom Navigation (Hidden when in Fullscreen) */}
        {!isFullScreen && (
          <BottomNav
            currentTab={currentTab}
            onSelectTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {/* Full / Mini Video Watching Overlay */}
        <VideoPlayer
          onOpenPlaylistModal={(v) => setPlaylistVideo(v)}
          onOpenShareModal={(v) => setShareVideo(v)}
        />

        {/* Modals & Drawers */}
        {showSearch && (
          <SearchPage
            onClose={() => setShowSearch(false)}
            onOpenPlaylistModal={(v) => setPlaylistVideo(v)}
            onOpenShareModal={(v) => setShareVideo(v)}
          />
        )}

        {showDirectPlay && (
          <DirectPlayModal onClose={() => setShowDirectPlay(false)} />
        )}

        {showNotifications && (
          <NotificationDrawer onClose={() => setShowNotifications(false)} />
        )}

        {showAdmin && (
          <AdminPage onClose={() => setShowAdmin(false)} />
        )}

        {showAuth && (
          <AuthModal onClose={() => setShowAuth(false)} />
        )}

        {shareVideo && (
          <ShareModal video={shareVideo} onClose={() => setShareVideo(null)} />
        )}

        {playlistVideo && (
          <PlaylistModal video={playlistVideo} onClose={() => setPlaylistVideo(null)} />
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PlayerProvider>
          <MainAppContent />
        </PlayerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
