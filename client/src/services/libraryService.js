import api from './api';

export const libraryService = {
  // Watch history
  getHistory: async () => {
    const res = await api.get('/history');
    return res.data.items || [];
  },

  saveProgress: async (payload) => {
    const res = await api.post('/history', payload);
    return res.data;
  },

  clearHistory: async () => {
    const res = await api.delete('/history');
    return res.data;
  },

  deleteHistoryItem: async (videoId) => {
    const res = await api.delete(`/history/${videoId}`);
    return res.data;
  },

  // Watch Later
  getWatchLater: async () => {
    const res = await api.get('/watch-later');
    return res.data.items || [];
  },

  toggleWatchLater: async (video) => {
    const res = await api.post('/watch-later/toggle', {
      videoId: video.id,
      title: video.title,
      channelTitle: video.channelTitle,
      channelAvatar: video.channelAvatar,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
    });
    return res.data;
  },

  // Likes
  getLikedVideos: async () => {
    const res = await api.get('/likes');
    return res.data.items || [];
  },

  toggleLike: async (videoId, action) => {
    const res = await api.post('/likes/toggle', { videoId, action });
    return res.data;
  },

  // Subscriptions
  getSubscriptions: async () => {
    const res = await api.get('/subscriptions');
    return res.data.items || [];
  },

  toggleSubscription: async (channel) => {
    const res = await api.post('/subscriptions/toggle', {
      channelId: channel.channelId || channel.id,
      channelTitle: channel.channelTitle || channel.name,
      channelAvatar: channel.channelAvatar || channel.avatar,
      subscriberCount: channel.subscriberCount,
    });
    return res.data;
  },

  getSubscriptionFeed: async () => {
    const res = await api.get('/subscriptions/feed');
    return res.data.items || [];
  },

  // Playlists
  getPlaylists: async () => {
    const res = await api.get('/playlists');
    return res.data.items || [];
  },

  createPlaylist: async (title, description) => {
    const res = await api.post('/playlists', { title, description });
    return res.data.playlist;
  },

  getPlaylistDetails: async (playlistId) => {
    const res = await api.get(`/playlists/${playlistId}`);
    return res.data;
  },

  addToPlaylist: async (playlistId, video) => {
    const res = await api.post(`/playlists/${playlistId}/items`, {
      videoId: video.id,
      title: video.title,
      channelTitle: video.channelTitle,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
    });
    return res.data;
  },

  deletePlaylist: async (playlistId) => {
    const res = await api.delete(`/playlists/${playlistId}`);
    return res.data;
  },
};
