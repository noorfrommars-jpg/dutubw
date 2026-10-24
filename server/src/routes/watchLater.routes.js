const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

// Get Watch Later items
router.get('/', requireAuth, (req, res) => {
  try {
    const list = db.prepare(`
      SELECT id, video_id, title, channel_title, channel_avatar, thumbnail_url, duration, created_at
      FROM watch_later
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    return res.json({ items: list });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load Watch Later' });
  }
});

// Toggle Add/Remove Watch Later
router.post('/toggle', requireAuth, (req, res) => {
  try {
    const { videoId, title, channelTitle, channelAvatar, thumbnailUrl, duration } = req.body;
    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    const existing = db.prepare('SELECT id FROM watch_later WHERE user_id = ? AND video_id = ?').get(req.user.id, videoId);
    if (existing) {
      db.prepare('DELETE FROM watch_later WHERE id = ?').run(existing.id);
      return res.json({ saved: false, message: 'Removed from Watch Later' });
    }

    const id = 'wl_' + crypto.randomUUID();
    db.prepare(`
      INSERT INTO watch_later (id, user_id, video_id, title, channel_title, channel_avatar, thumbnail_url, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.user.id,
      videoId,
      title || 'DuTube Video',
      channelTitle || '',
      channelAvatar || '',
      thumbnailUrl || `/api/proxy/thumbnail/${videoId}`,
      duration || ''
    );

    return res.json({ saved: true, message: 'Saved to Watch Later' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update Watch Later', message: err.message });
  }
});

// Delete specific video from Watch Later
router.delete('/:videoId', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM watch_later WHERE user_id = ? AND video_id = ?').run(req.user.id, req.params.videoId);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to remove from Watch Later' });
  }
});

module.exports = router;
