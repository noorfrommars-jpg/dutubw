const yts = require('yt-search');
const axios = require('axios');

// Rich query matrix for endless variety across categories
const CATEGORY_QUERY_MATRIX = {
  'All': [
    'trending videos today',
    'viral videos popular 2026',
    'top trending youtube',
    'best entertainment clips',
    'must watch videos',
    'recommended popular videos',
    'global trending hits',
    'awesome funny viral videos',
    'trending creators videos',
    'top viewed videos today',
    'new viral trends 2026',
    'popular highlights internet',
    'epic moments videos',
    'trending international videos',
    'top picks youtube recommended',
    'famous viral clips',
    'super popular streams',
    'trending today worldwide'
  ],
  'Trending': [
    'youtube trending now',
    'trending today viral',
    'trending 2026 official',
    'top trending music and comedy',
    'trending viral streams',
    'fastest rising videos',
    'trending news entertainment',
    'viral creators trending',
    'top trending worldwide',
    'breakout viral videos'
  ],
  'Tech': [
    'latest tech reviews gadgets',
    'smartphone unboxing review 2026',
    'new technology future ai',
    'laptop review benchmark',
    'best gadgets to buy',
    'apple vs android comparison',
    'tech news updates today',
    'smart home tech setup',
    'pc build gaming rig 4k',
    'breakthrough technology engineering',
    'camera tech review 4k',
    'wearable devices review'
  ],
  'Coding': [
    'programming web dev tutorial 2026',
    'full stack developer roadmap',
    'learn react node python',
    'system design interview prep',
    'javascript tips tricks coding',
    'build fullstack app tutorial',
    'software engineering career',
    'machine learning ai coding',
    'docker kubernetes devops',
    'cybersecurity ethical hacking',
    'data structures algorithms practice',
    'backend architecture scaling'
  ],
  'Music': [
    'trending music songs top hits',
    'new songs 2026 official video',
    'billboard top hits playlist',
    'bollywood new songs trending',
    'pop music official music video',
    'hip hop rap trending music',
    'lofi chill beats live',
    'acoustic live music performance',
    'global top 50 songs',
    'viral music tracks hits',
    'punjabi hit songs official',
    'electronic dance music mix'
  ],
  'Gaming': [
    'trending gaming gameplay highlights',
    'gta gameplay funny moments',
    'minecraft epic build hardcore',
    'bgmi pubg mobile clutches',
    'ps5 pro gameplay 4k 60fps',
    'warzone epic victory gameplay',
    'valorant best plays pro',
    'roblox funny games moments',
    'esports tournament highlights',
    'new game release gameplay 2026',
    'open world rpg gameplay',
    'fortnite funny moments pro'
  ],
  'Science': [
    'veritasium science documentary',
    'kurzgesagt universe space',
    'james webb telescope discoveries',
    'quantum physics mechanics explained',
    'deep ocean mysteries documentary',
    'solar system mars exploration',
    'neuroscience brain facts',
    'physics thought experiments',
    'evolution history documentary',
    'chemistry experiments visual',
    'astrophysics black holes cosmos',
    'biology microscopic world'
  ],
  'Education': [
    'educational documentary explainers',
    'ted talk inspiration ideas',
    'world history documentary animated',
    'geography economics explained',
    'how things work engineering',
    'finance investing for beginners',
    'psychology documentary lessons',
    'ancient civilization mysteries',
    'philosophy deep dive lessons',
    'critical thinking science guide',
    'productivity habits science',
    'mathematics visualized beauty'
  ],
  'Podcasts': [
    'popular podcast full episodes',
    'joe rogan experience full clip',
    'lex fridman podcast ai science',
    'huberman lab health science',
    'diary of a ceo interviews',
    'comedy podcast funny moments',
    'tech founder interviews podcast',
    'storytelling podcast deep dive',
    'true crime mystery podcast',
    'business entrepreneurship talk',
    'science discussion podcast',
    'deep conversations podcast'
  ],
  'News': [
    'breaking news world headlines today',
    'global economy market news',
    'technology news update live',
    'geopolitics world analysis news',
    'space science news weekly',
    'environmental climate news',
    'international diplomacy updates',
    'top news analysis headlines',
    'investigative report documentary',
    'world events today live',
    'financial markets economic news',
    'daily news bulletin'
  ],
  'Anime': [
    'anime best moments clips',
    'top anime fights 4k 60fps',
    'anime episode highlights',
    'new anime trailer 2026',
    'epic anime scenes emotional',
    'anime sound tracks ost'
  ],
  'AI': [
    'artificial intelligence news developments',
    'gpt 5 llm models test',
    'robotics humanoid ai demo',
    'generative ai tools tutorial',
    'future of artificial intelligence',
    'ai coding agents demo'
  ]
};

// Rich curated fallback videos in case of offline/network dropouts
const CURATED_FALLBACK = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
    channelId: 'rickastley',
    channelTitle: 'Rick Astley',
    channelAvatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80',
    subscriberCount: '4.8M',
    duration: '3:33',
    durationSeconds: 213,
    views: '1.5B views',
    viewsCount: 1540000000,
    likesCount: 17000000,
    uploadTime: '14 years ago',
    category: 'Music',
    description: 'The official video for “Never Gonna Give You Up” by Rick Astley.'
  },
  {
    id: 'L_LUpnjgPso',
    title: 'Full Stack Web Development in 2026: The Complete Roadmap',
    channelId: 'fireship',
    channelTitle: 'Fireship',
    channelAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    subscriberCount: '3.1M',
    duration: '11:20',
    durationSeconds: 680,
    views: '1.4M views',
    viewsCount: 1400000,
    likesCount: 94000,
    uploadTime: '3 weeks ago',
    category: 'Coding',
    description: 'A comprehensive modern guide to full-stack engineering.'
  },
  {
    id: '3JZ_D3ELwOQ',
    title: 'How The Most Radioactive Place on Earth Was Made',
    channelId: 'veritasium',
    channelTitle: 'Veritasium',
    channelAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    subscriberCount: '15.8M',
    duration: '22:15',
    durationSeconds: 1335,
    views: '28.4M views',
    viewsCount: 28400000,
    likesCount: 820000,
    uploadTime: '1 year ago',
    category: 'Science',
    description: 'A deep-dive investigation into Chernobyl and radiation levels.'
  }
];

class VideoProvider {
  constructor() {
    this.memoryCache = new Map();
    this.feedCache = new Map();
    // Cache to prevent duplicate video IDs across consecutive infinite scroll pages
    this.seenVideoIds = new Set();
  }

  /**
   * Format number of views (e.g. 1542000 -> "1.5M views")
   */
  formatViews(views) {
    if (!views && views !== 0) return '1.2M views';
    if (typeof views === 'string') return views.includes('view') ? views : `${views} views`;
    const num = Number(views);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B views`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K views`;
    return `${num} views`;
  }

  /**
   * Helper to format any YouTube search item into standardized DuTube video
   */
  formatYtVideo(item, fallbackCategory = 'All') {
    const videoId = item.videoId || item.id;
    const authorName = item.author?.name || item.channelTitle || 'YouTube Creator';
    const channelId = item.author?.id || item.channelId || `ch_${videoId}`;
    const avatar = item.author?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(authorName)}`;

    return {
      id: videoId,
      title: item.title || `Video ${videoId}`,
      channelId,
      channelTitle: authorName,
      channelAvatar: avatar,
      subscriberCount: item.subscriberCount || '1.5M',
      thumbnailUrl: `/api/proxy/thumbnail/${videoId}`,
      originalThumbnail: item.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      duration: item.timestamp || item.duration?.timestamp || '10:00',
      durationSeconds: item.seconds || (item.duration?.seconds) || 600,
      views: this.formatViews(item.views),
      viewsCount: typeof item.views === 'number' ? item.views : 1200000,
      likesCount: item.likesCount || 35000,
      uploadTime: item.ago || item.uploadTime || 'Recently',
      category: fallbackCategory,
      description: item.description || '',
      isTrending: Boolean(item.isTrending)
    };
  }

  /**
   * Fetch Real-Time YouTube Feed with TRULY ENDLESS scrolling.
   * Every page request (page 1, 2, 3, 4, 5 ... 100+) maps to dynamic YouTube query expansions!
   */
  async getFeed({ category = 'All', page = 1, limit = 12 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const cacheKey = `feed_${category}_${pageNum}`;
    const cached = this.feedCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 120000) {
      return cached.data;
    }

    const queries = CATEGORY_QUERY_MATRIX[category] || [
      `${category} videos`,
      `${category} popular 2026`,
      `${category} trending new`,
      `${category} highlights`
    ];

    // Pick dynamic query seed based on page index
    const queryIndex = (pageNum - 1) % queries.length;
    const cycle = Math.floor((pageNum - 1) / queries.length);
    let currentQuery = queries[queryIndex];

    if (cycle > 0) {
      currentQuery = `${currentQuery} part ${cycle + 1}`;
    }

    try {
      // Connect directly to YouTube server via yt-search
      const searchResult = await yts(currentQuery);

      if (searchResult && searchResult.videos && searchResult.videos.length > 0) {
        // Filter out any duplicates seen previously in this session
        const freshVideos = searchResult.videos.filter(v => !this.seenVideoIds.has(v.videoId));

        // If freshVideos has enough, use them; otherwise take all videos from searchResult
        const videosToUse = freshVideos.length >= 6 ? freshVideos : searchResult.videos;

        // Take up to limit items
        const selected = videosToUse.slice(0, limit);
        selected.forEach(v => this.seenVideoIds.add(v.videoId));

        // Limit seen cache size
        if (this.seenVideoIds.size > 2000) {
          this.seenVideoIds.clear();
        }

        const items = selected.map(v => this.formatYtVideo(v, category));
        const response = {
          items,
          hasMore: true, // ALWAYS true for endless scrolling!
          page: pageNum,
          total: 1000000, // Unlimited
          provider: 'youtube_server_live'
        };

        this.feedCache.set(cacheKey, { timestamp: Date.now(), data: response });
        return response;
      }
    } catch (err) {
      console.warn(`Live YouTube feed query for page ${pageNum} failed:`, err.message);
    }

    // Secondary fallback with query rotation
    try {
      const fallbackSearch = await yts(`${category} youtube`);
      if (fallbackSearch && fallbackSearch.videos && fallbackSearch.videos.length > 0) {
        return {
          items: fallbackSearch.videos.slice(0, limit).map(v => this.formatYtVideo(v, category)),
          hasMore: true,
          page: pageNum,
          total: 1000000,
          provider: 'youtube_server_fallback'
        };
      }
    } catch {}

    // Static fallback if all network requests fail
    return {
      items: CURATED_FALLBACK.map(v => this.formatYtVideo(v, category)),
      hasMore: true,
      page: pageNum,
      total: CURATED_FALLBACK.length,
      provider: 'fallback_catalog'
    };
  }

  /**
   * Search ANY video, query, channel, or sound across YouTube with ENDLESS scrolling support
   */
  async search({ query = '', page = 1, limit = 10, filter = 'all' } = {}) {
    const q = (query || '').trim();
    const pageNum = Math.max(1, parseInt(page, 10) || 1);

    if (!q) {
      return this.getFeed({ page: pageNum, limit });
    }

    // Direct YouTube URL or 11-char ID
    const extractedId = this.extractYouTubeId(q);
    if (extractedId) {
      const directVideo = await this.getVideoById(extractedId);
      if (directVideo) {
        return {
          items: [directVideo],
          hasMore: false,
          page: 1,
          total: 1,
          provider: 'direct_youtube_id'
        };
      }
    }

    // Expand search query dynamically on page > 1 so search is also truly infinite!
    let effectiveQuery = q;
    if (pageNum === 2) effectiveQuery = `${q} new`;
    else if (pageNum === 3) effectiveQuery = `${q} songs hits`;
    else if (pageNum === 4) effectiveQuery = `${q} official video`;
    else if (pageNum === 5) effectiveQuery = `${q} playlist`;
    else if (pageNum > 5) effectiveQuery = `${q} part ${pageNum}`;

    try {
      const searchResult = await yts(effectiveQuery);

      if (searchResult && searchResult.videos && searchResult.videos.length > 0) {
        const startIndex = ((pageNum - 1) % 3) * limit;
        const pageVideos = searchResult.videos.slice(startIndex, startIndex + limit);
        const finalVideos = pageVideos.length > 0 ? pageVideos : searchResult.videos.slice(0, limit);

        const items = finalVideos.map(v => this.formatYtVideo(v, 'Search'));
        return {
          items,
          hasMore: true, // Unlimited search results!
          page: pageNum,
          total: 1000000,
          provider: 'youtube_server_live'
        };
      }
    } catch (err) {
      console.warn('Live YouTube search query failed:', err.message);
    }

    return {
      items: [],
      hasMore: true,
      page: pageNum,
      total: 0,
      provider: 'youtube_search_empty'
    };
  }

  /**
   * Get single video details by ID - fetches live YouTube video info for ANY video
   */
  async getVideoById(videoId) {
    if (!videoId) return null;
    const cleanId = this.extractYouTubeId(videoId) || videoId;

    if (this.memoryCache.has(cleanId)) {
      return this.memoryCache.get(cleanId);
    }

    // 1. Query YouTube directly via yt-search
    try {
      const ytVideo = await yts({ videoId: cleanId });
      if (ytVideo && ytVideo.title) {
        const authorName = ytVideo.author?.name || 'YouTube Creator';
        const formatted = {
          id: cleanId,
          title: ytVideo.title,
          channelId: ytVideo.author?.id || `ch_${cleanId}`,
          channelTitle: authorName,
          channelAvatar: ytVideo.author?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(authorName)}`,
          subscriberCount: ytVideo.author?.subscriberCount || '1.8M',
          thumbnailUrl: `/api/proxy/thumbnail/${cleanId}`,
          originalThumbnail: ytVideo.thumbnail || `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`,
          duration: ytVideo.timestamp || '10:00',
          durationSeconds: ytVideo.seconds || 600,
          views: this.formatViews(ytVideo.views),
          viewsCount: ytVideo.views || 1000000,
          likesCount: ytVideo.likes || 42000,
          uploadTime: ytVideo.ago || 'Recently',
          category: 'Stream',
          description: ytVideo.description || `Watch ${ytVideo.title} on DuTube.`,
          isTrending: false
        };

        this.memoryCache.set(cleanId, formatted);
        return formatted;
      }
    } catch (err) {
      console.warn(`yt-search details failed for ${cleanId}, trying oEmbed fallback:`, err.message);
    }

    // 2. Fallback to YouTube oEmbed API
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${cleanId}&format=json`;
      const res = await axios.get(oembedUrl, { timeout: 3500 });
      if (res.status === 200 && res.data) {
        const formatted = {
          id: cleanId,
          title: res.data.title || `Video ${cleanId}`,
          channelId: `channel_${cleanId}`,
          channelTitle: res.data.author_name || 'YouTube Creator',
          channelAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(res.data.author_name || 'Creator')}`,
          subscriberCount: '1.2M',
          duration: '10:00',
          durationSeconds: 600,
          views: '1.5M views',
          viewsCount: 1500000,
          likesCount: 50000,
          uploadTime: 'Recently',
          category: 'Stream',
          description: `Watch ${res.data.title} on DuTube.\nAuthor: ${res.data.author_name}\n\nHigh-definition YouTube video stream.`,
          isTrending: false
        };

        this.memoryCache.set(cleanId, formatted);
        return formatted;
      }
    } catch {
      // ignore
    }

    // 3. Fallback so NO video ID ever crashes
    const dynamicVideo = {
      id: cleanId,
      title: `YouTube Video (${cleanId})`,
      channelId: 'yt_creator',
      channelTitle: 'Verified Creator',
      channelAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanId}`,
      subscriberCount: '800K',
      duration: '12:00',
      durationSeconds: 720,
      views: '850K views',
      viewsCount: 850000,
      likesCount: 30000,
      uploadTime: '1 week ago',
      category: 'All',
      description: `DuTube stream for video ID ${cleanId}. Official IFrame playback ready.`
    };

    this.memoryCache.set(cleanId, dynamicVideo);
    return dynamicVideo;
  }

  /**
   * Get related / up next videos by searching YouTube for related content
   */
  async getRelatedVideos(videoId, limit = 8) {
    const current = await this.getVideoById(videoId);
    const searchTerms = current ? `${current.channelTitle} ${current.title.split(' ').slice(0, 3).join(' ')}` : 'trending videos';

    try {
      const searchResult = await yts(searchTerms);
      if (searchResult && searchResult.videos && searchResult.videos.length > 0) {
        const filtered = searchResult.videos.filter(v => v.videoId !== videoId);
        return filtered.slice(0, limit).map(v => this.formatYtVideo(v, 'Related'));
      }
    } catch {
      // fallback
    }

    return CURATED_FALLBACK.map(v => this.formatYtVideo(v));
  }

  /**
   * Extract YouTube ID from full URL or return ID if already 11 characters
   */
  extractYouTubeId(str) {
    if (!str || typeof str !== 'string') return null;
    str = str.trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
      return str;
    }

    const matchWatch = str.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (matchWatch) return matchWatch[1];

    const matchShort = str.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (matchShort) return matchShort[1];

    const matchEmbed = str.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (matchEmbed) return matchEmbed[1];

    const matchShorts = str.match(/shorts\/([a-zA-Z0-9_-]{11})/);
    if (matchShorts) return matchShorts[1];

    return null;
  }
}

module.exports = new VideoProvider();
