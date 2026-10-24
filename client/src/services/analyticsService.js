import api from './api';

let sessionId = null;
function getSessionId() {
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 12);
  }
  return sessionId;
}

export const analyticsService = {
  track: async (eventType, eventData = {}) => {
    try {
      await api.post('/analytics/event', {
        eventType,
        eventData,
        sessionId: getSessionId(),
      });
    } catch {
      // Analytics should never break user experience
    }
  },
};
