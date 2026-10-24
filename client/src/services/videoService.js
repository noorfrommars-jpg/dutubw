import api from './api';

export const videoService = {
  getFeed: async ({ category = 'All', page = 1, limit = 12 } = {}) => {
    const res = await api.get('/videos/feed', { params: { category, page, limit } });
    return res.data;
  },

  getVideoById: async (id) => {
    const res = await api.get(`/videos/${id}`);
    return res.data;
  },

  getRelatedVideos: async (id) => {
    const res = await api.get(`/videos/${id}/related`);
    return res.data;
  },

  resolveUrlOrId: async (urlOrId) => {
    const res = await api.post('/videos/resolve', { urlOrId });
    return res.data.video;
  },

  getComments: async (videoId) => {
    const res = await api.get(`/comments/${videoId}`);
    return res.data;
  },

  postComment: async (videoId, text) => {
    const res = await api.post(`/comments/${videoId}`, { text });
    return res.data;
  },

  deleteComment: async (id) => {
    const res = await api.delete(`/comments/${id}`);
    return res.data;
  },
};
