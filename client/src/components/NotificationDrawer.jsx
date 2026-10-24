import React from 'react';
import { X, Bell, Sparkles, Video, CheckCircle2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const SAMPLE_NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Fireship uploaded a new video',
    description: 'React 19 in 100 Seconds // Full Overview & Server Actions',
    time: '2 hours ago',
    videoId: 'bMknfKXIFA8',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=80&auto=format&fit=crop&q=80',
    unread: true,
  },
  {
    id: 'n2',
    title: 'Veritasium uploaded a new episode',
    description: 'Why Gravity is Not a Force: General Relativity Visualized',
    time: '1 day ago',
    videoId: 'HeQX2HjkcNo',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=80',
    unread: false,
  },
  {
    id: 'n3',
    title: 'Welcome to DuTube Pro!',
    description: 'Experience 4K 60FPS mobile video streaming with intelligent thumbnail caching.',
    time: '3 days ago',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80',
    unread: false,
  }
];

const NotificationDrawer = ({ onClose }) => {
  const { playVideo } = usePlayer();

  const handleNotificationClick = (n) => {
    if (n.videoId) {
      playVideo({
        id: n.videoId,
        title: n.description,
        channelTitle: n.title,
        thumbnailUrl: `/api/proxy/thumbnail/${n.videoId}`
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl bg-surface-dark-card border border-surface-dark-border p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-dutube-500" />
            <h3 className="text-sm font-bold text-zinc-100">Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto no-scrollbar">
          {SAMPLE_NOTIFICATIONS.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-3 rounded-xl flex items-start gap-3 cursor-pointer transition-colors active:scale-98 ${
                n.unread ? 'bg-surface-dark-elevated border border-dutube-500/20' : 'hover:bg-surface-dark-elevated'
              }`}
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-surface-dark-border">
                <img src={n.avatar} alt="Avatar" className="w-full h-full object-cover" />
                {n.unread && (
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-dutube-500 ring-2 ring-black" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-zinc-200">{n.title}</h4>
                <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">{n.description}</p>
                <span className="text-[10px] text-zinc-500 block mt-1">{n.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
