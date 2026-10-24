import React, { useState, useEffect, useRef, useCallback } from 'react';
import CategoryChips from '../components/CategoryChips';
import VideoCard from '../components/VideoCard';
import NativeAdCard from '../components/NativeAdCard';
import SkeletonCard from '../components/SkeletonCard';
import { videoService } from '../services/videoService';
import { adsService } from '../services/adsService';
import { RefreshCw, AlertCircle, WifiOff } from 'lucide-react';

const HomePage = ({ onOpenPlaylistModal, onOpenShareModal }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [videos, setVideos] = useState([]);
  const [ads, setAds] = useState([]);
  const [adConfig, setAdConfig] = useState({
    native_ads_enabled: true,
    native_ad_frequency: 3,
  });

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Use refs to avoid stale closures during infinite scroll
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);
  const activeCategoryRef = useRef(activeCategory);
  activeCategoryRef.current = activeCategory;

  // Load Ad configuration once
  useEffect(() => {
    const fetchAdsData = async () => {
      try {
        const config = await adsService.getConfig();
        setAdConfig(config);
        if (config.native_ads_enabled) {
          const activeAds = await adsService.getActiveAds();
          setAds(activeAds);
        }
      } catch (err) {
        console.warn('Failed to load native ads config:', err);
      }
    };
    fetchAdsData();
  }, []);

  // Fetch feed items
  const fetchFeedPage = async (cat, pageNum, isReset = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isReset) {
      setLoading(true);
      setError(null);
      pageRef.current = 1;
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await videoService.getFeed({
        category: cat,
        page: pageNum,
        limit: 12,
      });

      const newItems = res.items || [];

      if (isReset) {
        setVideos(newItems);
        pageRef.current = 2;
      } else {
        setVideos(prev => {
          const existingIds = new Set(prev.map(v => v.id));
          const uniqueItems = newItems.filter(v => !existingIds.has(v.id));
          return [...prev, ...(uniqueItems.length > 0 ? uniqueItems : newItems)];
        });
        pageRef.current += 1;
      }
    } catch (err) {
      if (isReset) {
        setError('Unable to load video feed. Please check connection and try again.');
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Trigger reset on category change
  useEffect(() => {
    fetchFeedPage(activeCategory, 1, true);
  }, [activeCategory]);

  // Pull to refresh simulation
  const handleRefresh = () => {
    setRefreshing(true);
    fetchFeedPage(activeCategory, 1, true);
  };

  // Intersection Observer for continuous endless scroll (400px rootMargin for pre-fetching)
  const observerRef = useRef();
  const lastElementRef = useCallback((node) => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isFetchingRef.current) {
        fetchFeedPage(activeCategoryRef.current, pageRef.current, false);
      }
    }, {
      rootMargin: '400px'
    });

    if (node) observerRef.current.observe(node);
  }, [loading]);

  /**
   * Build the interleaved feed:
   * Pattern: After every `frequency` (default: 3) videos, insert 1 native ad!
   */
  const renderFeedItems = () => {
    const frequency = adConfig.native_ad_frequency || 3;
    const adsEnabled = adConfig.native_ads_enabled && ads.length > 0;
    const elements = [];

    videos.forEach((video, index) => {
      elements.push(
        <VideoCard
          key={`video-${video.id}-${index}`}
          video={video}
          onOpenPlaylistModal={onOpenPlaylistModal}
          onOpenShareModal={onOpenShareModal}
        />
      );

      // Check if we should insert native ad after this card
      if (adsEnabled && (index + 1) % frequency === 0) {
        const adIndex = Math.floor(index / frequency) % ads.length;
        const currentAd = ads[adIndex];
        if (currentAd) {
          elements.push(
            <NativeAdCard
              key={`ad-${currentAd.id}-${index}`}
              ad={currentAd}
            />
          );
        }
      }
    });

    return elements;
  };

  return (
    <div className="flex flex-col w-full pb-20">
      {/* Category Chips Bar */}
      <CategoryChips
        activeCategory={activeCategory}
        onSelectCategory={(cat) => setActiveCategory(cat)}
      />

      {/* Main Feed Container */}
      <div className="p-3 space-y-4">
        {/* Error State with Retry Button */}
        {error && (
          <div className="p-5 rounded-2xl bg-surface-dark-card border border-red-500/20 text-center my-6">
            <WifiOff className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-zinc-100 mb-1">Feed Unavailable</h4>
            <p className="text-xs text-zinc-400 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 rounded-xl bg-dutube-500 text-white text-xs font-semibold hover:bg-dutube-600 transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Loaded Endless Feed */}
        {!loading && !error && videos.length > 0 && (
          <>
            {renderFeedItems()}

            {/* Continuous Infinite Scroll Trigger Anchor */}
            <div ref={lastElementRef} className="h-10 flex items-center justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 py-4 text-xs font-semibold text-zinc-400">
                  <div className="w-5 h-5 border-2 border-dutube-500 border-t-transparent rounded-full animate-spin" />
                  <span>Loading more videos from YouTube...</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && !error && videos.length === 0 && (
          <div className="py-16 text-center text-zinc-400 text-xs">
            <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
            <span>Connecting to YouTube live servers...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
