import React, { useState, useEffect } from 'react';
import { libraryService } from '../services/libraryService';
import VideoCard from '../components/VideoCard';
import SkeletonCard from '../components/SkeletonCard';
import { Tv2, Plus, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SubscriptionsPage = ({ onOpenPlaylistModal, onOpenShareModal }) => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [feedVideos, setFeedVideos] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionsData();
  }, []);

  const loadSubscriptionsData = async () => {
    setLoading(true);
    try {
      const [subs, feed] = await Promise.all([
        libraryService.getSubscriptions(),
        libraryService.getSubscriptionFeed()
      ]);
      setSubscriptions(subs);
      setFeedVideos(feed);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = selectedChannelId === 'all'
    ? feedVideos
    : feedVideos.filter(v => v.channelId === selectedChannelId);

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Top Channels Carousel */}
      <div className="border-b border-surface-dark-border/40 bg-surface-dark/40 py-3">
        <div className="flex items-center gap-4 px-4 overflow-x-auto no-scrollbar">
          {/* 'All' Channel Pill */}
          <button
            onClick={() => setSelectedChannelId('all')}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
              selectedChannelId === 'all'
                ? 'bg-dutube-500 text-white border-dutube-500 shadow-md shadow-dutube-500/30'
                : 'bg-surface-dark-elevated text-zinc-300 border-white/10 group-hover:border-zinc-500'
            }`}>
              All
            </div>
            <span className="text-[11px] font-medium text-zinc-300">Latest</span>
          </button>

          {/* Subscribed Channels */}
          {subscriptions.map((ch) => {
            const isSelected = selectedChannelId === ch.channel_id;

            return (
              <button
                key={ch.id}
                onClick={() => setSelectedChannelId(ch.channel_id)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group relative"
              >
                <div className={`relative w-14 h-14 rounded-full overflow-hidden p-0.5 border-2 transition-all ${
                  isSelected ? 'border-dutube-500 scale-105' : 'border-transparent group-hover:border-zinc-600'
                }`}>
                  <img
                    src={ch.channel_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(ch.channel_title)}`}
                    alt={ch.channel_title}
                    className="w-full h-full object-cover rounded-full"
                  />
                  {/* New video indicator */}
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-dutube-500 ring-2 ring-black" />
                </div>
                <span className="text-[11px] font-medium text-zinc-300 truncate max-w-[64px]">
                  {ch.channel_title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subscription Feed */}
      <div className="p-3 space-y-4">
        {loading && (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!loading && filteredVideos.length > 0 && (
          filteredVideos.map((video, idx) => (
            <VideoCard
              key={`${video.id}-${idx}`}
              video={video}
              onOpenPlaylistModal={onOpenPlaylistModal}
              onOpenShareModal={onOpenShareModal}
            />
          ))
        )}

        {!loading && filteredVideos.length === 0 && (
          <div className="py-16 text-center text-zinc-400 text-xs">
            <Tv2 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="font-semibold text-zinc-200 mb-1">No uploads from this channel</p>
            <p className="text-[11px] text-zinc-500">Subscribe to more creators to see their newest videos here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionsPage;
