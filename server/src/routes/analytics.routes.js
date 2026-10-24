const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const { optionalAuth } = require('../middleware/auth');

// Track an analytics event
router.post('/event', optionalAuth, (req, res) => {
  try {
    const { eventType, eventData = {}, sessionId } = req.body;
    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }

    const id = 'evt_' + crypto.randomUUID();
    const userId = req.user ? req.user.id : null;
    const dataString = typeof eventData === 'string' ? eventData : JSON.stringify(eventData);

    db.prepare(`
      INSERT INTO analytics_events (id, user_id, event_type, event_data, session_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, eventType, dataString, sessionId || 'guest_session');

    // If native ad event, also increment counter on native_ads table
    if (eventType === 'native_ad_impression' && eventData.adId) {
      db.prepare('UPDATE native_ads SET impressions = impressions + 1 WHERE id = ?').run(eventData.adId);
    } else if (eventType === 'native_ad_click' && eventData.adId) {
      db.prepare('UPDATE native_ads SET clicks = clicks + 1 WHERE id = ?').run(eventData.adId);
    }

    return res.status(201).json({ success: true });
  } catch (err) {
    // Non-blocking for client
    return res.status(200).json({ success: false });
  }
});

module.exports = router;
