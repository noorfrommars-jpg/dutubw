import api from './api';

export const adsService = {
  getConfig: async () => {
    const res = await api.get('/ads/config');
    return res.data;
  },

  getActiveAds: async () => {
    const res = await api.get('/ads/active');
    return res.data.items || [];
  },

  trackImpression: async (adId) => {
    try {
      await api.post(`/ads/${adId}/impression`);
    } catch {
      // non-blocking
    }
  },

  trackClick: async (adId) => {
    try {
      await api.post(`/ads/${adId}/click`);
    } catch {
      // non-blocking
    }
  },
};
