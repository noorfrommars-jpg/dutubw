const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const videoProvider = require('../services/videoProvider');
const { requireAuth } = require('../middleware/auth');

// Get list of subscribed channels
router.get('/', requireAuth, (req, res) => {
  try {
    const list = db.prepare(`
      SELECT id, channel_id, channel_title, channel_avatar, subscriber_count, created_at
      FROM subscriptions
      WHERE user_id = ?
      ORDER BY channel_title ASC
    `).all(req.user.id);

    return res.json({ items: list });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load subscriptions' });
  }
});

// Toggle subscribe / unsubscribe
router.post('/toggle', requireAuth, (req, res) => {
  try {
    const { channelId, channelTitle, channelAvatar, subscriberCount } = req.body;
    if (!channelId) {
      return res.status(400).json({ error: 'channelId is required' });
    }

    const existing = db.prepare('SELECT id FROM subscriptions WHERE user_id = ? AND channel_id = ?').get(req.user.id, channelId);

    if (existing) {
      db.prepare('DELETE FROM subscriptions WHERE id = ?').run(existing.id);
      return res.json({ isSubscribed: false, message: 'Unsubscribed' });
    }

    const id = 'sub_' + crypto.randomUUID();
    db.prepare(`
      INSERT INTO subscriptions (id, user_id, channel_id, channel_title, channel_avatar, subscriber_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.user.id,
      channelId,
      channelTitle || 'DuTube Creator',
      channelAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      subscriberCount || '1M'
    );

    return res.json({ isSubscribed: true, message: 'Subscribed!' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update subscription', message: err.message });
  }
});

// Get videos from subscribed channels - Live YouTube feed
router.get('/feed', requireAuth, async (req, res) => {
  try {
    const subs = db.prepare('SELECT channel_id, channel_title FROM subscriptions WHERE user_id = ?').all(req.user.id);

    if (subs.length === 0) {
      const trendingFeed = await videoProvider.getFeed({ category: 'All', limit: 12 });
      return res.json({ items: trendingFeed.items });
    }

    // Query live YouTube for latest uploads from subscribed channels
    const promises = subs.slice(0, 4).map(s =>
      videoProvider.search({ query: `${s.channel_title} new video`, limit: 4 })
        .then(r => r.items)
        .catch(() => [])
    );

    const results = await Promise.all(promises);
    const flattened = results.flat();

    // If empty or small, supplement with trending
    if (flattened.length < 4) {
      const fallback = await videoProvider.getFeed({ category: 'Trending', limit: 8 });
      return res.json({ items: [...flattened, ...fallback.items] });
    }

    return res.json({ items: flattened });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load subscription feed' });
  }
});

module.exports = router;
