const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

// Get Watch History with progress for continue watching
router.get('/', requireAuth, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT id, video_id, title, channel_title, channel_avatar, thumbnail_url,
             duration, duration_seconds, progress_seconds, completed, updated_at
      FROM watch_history
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT 50
    `).all(req.user.id);

    return res.json({ items: history });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load watch history' });
  }
});

// Record or update watch progress
router.post('/', requireAuth, (req, res) => {
  try {
    const {
      videoId,
      title,
      channelTitle,
      channelAvatar,
      thumbnailUrl,
      duration,
      durationSeconds = 0,
      progressSeconds = 0
    } = req.body;

    if (!videoId || !title) {
      return res.status(400).json({ error: 'videoId and title are required' });
    }

    const completed = (progressSeconds > 0 && durationSeconds > 0 && progressSeconds / durationSeconds > 0.9) ? 1 : 0;
    const id = 'hist_' + crypto.randomUUID();

    db.prepare(`
      INSERT INTO watch_history (
        id, user_id, video_id, title, channel_title, channel_avatar,
        thumbnail_url, duration, duration_seconds, progress_seconds, completed, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, video_id) DO UPDATE SET
        title = excluded.title,
        channel_title = excluded.channel_title,
        channel_avatar = excluded.channel_avatar,
        thumbnail_url = excluded.thumbnail_url,
        duration = excluded.duration,
        duration_seconds = excluded.duration_seconds,
        progress_seconds = excluded.progress_seconds,
        completed = excluded.completed,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      id,
      req.user.id,
      videoId,
      title,
      channelTitle || '',
      channelAvatar || '',
      thumbnailUrl || `/api/proxy/thumbnail/${videoId}`,
      duration || '',
      parseInt(durationSeconds, 10) || 0,
      parseInt(progressSeconds, 10) || 0,
      completed
    );

    return res.json({ success: true, progressSeconds, completed });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save watch progress', message: err.message });
  }
});

// Clear all watch history
router.delete('/', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM watch_history WHERE user_id = ?').run(req.user.id);
    return res.json({ success: true, message: 'Watch history cleared' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to clear watch history' });
  }
});

// Remove single video from history
router.delete('/:videoId', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM watch_history WHERE user_id = ? AND video_id = ?').run(req.user.id, req.params.videoId);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to remove from history' });
  }
});

module.exports = router;
