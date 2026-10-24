import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, TrendingUp, History, Play, Filter, Sparkles } from 'lucide-react';
import api from '../services/api';
import VideoCard from '../components/VideoCard';
import SkeletonCard from '../components/SkeletonCard';
import { usePlayer } from '../context/PlayerContext';

const SearchPage = ({ onClose, onOpenPlaylistModal, onOpenShareModal }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const searchInputRef = useRef(null);
  const searchPageRef = useRef(1);
  const isFetchingMoreRef = useRef(false);
  const currentQueryRef = useRef(query);
  currentQueryRef.current = query;

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    loadTrendingAndHistory();
  }, []);

  const loadTrendingAndHistory = async () => {
    try {
      const [trendRes, histRes] = await Promise.all([
        api.get('/search/trending'),
        api.get('/search/history').catch(() => ({ data: { items: [] } }))
      ]);
      setTrendingSearches(trendRes.data.items || []);
      setRecentSearches(histRes.data?.items || ['Sidhu Moose Wala', 'Arijit Singh', 'Full Stack Roadmap 2026', 'M3 Max MacBook Pro', 'Veritasium']);
    } catch {}
  };

  // Fetch suggestions as query changes
  useEffect(() => {
    if (!query.trim() || hasSearched) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/search/suggestions', { params: { q: query } });
        setSuggestions(res.data.suggestions || []);
      } catch {}
    }, 200);

    return () => clearTimeout(timer);
  }, [query, hasSearched]);

  const executeSearch = async (searchTerm) => {
    const q = (searchTerm !== undefined ? searchTerm : query).trim();
    if (!q) return;

    setQuery(q);
    setSuggestions([]);
    setLoading(true);
    setHasSearched(true);
    searchPageRef.current = 1;

    try {
      const res = await api.get('/search', { params: { q, page: 1, limit: 12 } });
      setResults(res.data.items || []);
      searchPageRef.current = 2;
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreSearchResults = async () => {
    if (isFetchingMoreRef.current || !hasSearched || !currentQueryRef.current.trim()) return;
    isFetchingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const res = await api.get('/search', {
        params: {
          q: currentQueryRef.current.trim(),
          page: searchPageRef.current,
          limit: 12
        }
      });

      const newItems = res.data.items || [];
      if (newItems.length > 0) {
        setResults(prev => {
          const ids = new Set(prev.map(v => v.id));
          const unique = newItems.filter(v => !ids.has(v.id));
          return [...prev, ...(unique.length > 0 ? unique : newItems)];
        });
        searchPageRef.current += 1;
      }
    } catch {
      // ignore
    } finally {
      isFetchingMoreRef.current = false;
      setLoadingMore(false);
    }
  };

  // Infinite Scroll Trigger for Search
  const searchObserverRef = useRef();
  const lastSearchResultRef = useCallback((node) => {
    if (loading || !hasSearched) return;
    if (searchObserverRef.current) searchObserverRef.current.disconnect();

    searchObserverRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isFetchingMoreRef.current) {
        loadMoreSearchResults();
      }
    }, {
      rootMargin: '400px'
    });

    if (node) searchObserverRef.current.observe(node);
  }, [loading, hasSearched]);

  const handleClearHistory = async () => {
    try {
      await api.delete('/search/history');
      setRecentSearches([]);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-dark flex flex-col max-w-md mx-auto">
      {/* Search Bar Header */}
      <div className="sticky top-0 z-40 bg-surface-dark/95 backdrop-blur-md border-b border-surface-dark-border/50 px-3 pt-3 pb-2.5 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-dark-elevated border border-surface-dark-border focus-within:border-dutube-500">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHasSearched(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
            placeholder="Search YouTube or paste any link..."
            className="flex-1 bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setHasSearched(false);
                setResults([]);
              }}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="px-2.5 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Main Search Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Real-time suggestions dropdown */}
        {suggestions.length > 0 && !hasSearched && (
          <div className="space-y-1 mb-4">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => executeSearch(s)}
                className="w-full px-3 py-2 rounded-xl flex items-center gap-3 text-left hover:bg-surface-dark-elevated text-xs text-zinc-200 transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-zinc-500" />
                <span className="truncate">{s}</span>
              </button>
            ))}
          </div>
        )}

        {/* Initial Search Hub: Recent & Trending when not yet searched */}
        {!hasSearched && (
          <div className="space-y-5">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <History className="w-3.5 h-3.5" />
                    <span>Recent Searches</span>
                  </div>
                  <button
                    onClick={handleClearHistory}
                    className="text-[11px] text-zinc-500 hover:text-red-400"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => executeSearch(term)}
                      className="w-full px-3 py-2 rounded-xl flex items-center justify-between text-left hover:bg-surface-dark-elevated text-xs text-zinc-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <History className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="truncate">{term}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Topics */}
            {trendingSearches.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-dutube-500" />
                  <span>Trending on YouTube</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => executeSearch(topic)}
                      className="px-3 py-1.5 rounded-full bg-surface-dark-elevated hover:bg-surface-dark-border text-xs text-zinc-300 border border-white/5 active:scale-95 transition-all"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading Initial Results */}
        {loading && (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Search Results Feed with Infinite Scroll */}
        {hasSearched && !loading && (
          <div className="space-y-4">
            {results.map((video, idx) => (
              <VideoCard
                key={`${video.id}-${idx}`}
                video={video}
                onOpenPlaylistModal={onOpenPlaylistModal}
                onOpenShareModal={onOpenShareModal}
              />
            ))}

            {/* Infinite Scroll Anchor for Search */}
            <div ref={lastSearchResultRef} className="h-10 flex items-center justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 py-3 text-xs font-semibold text-zinc-400">
                  <div className="w-4 h-4 border-2 border-dutube-500 border-t-transparent rounded-full animate-spin" />
                  <span>Loading more YouTube results...</span>
                </div>
              )}
            </div>

            {results.length === 0 && (
              <div className="py-16 text-center text-zinc-400 text-xs">
                <Search className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <p className="font-semibold text-zinc-200">No matching videos</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Try searching with different terms or paste a direct YouTube video link.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
