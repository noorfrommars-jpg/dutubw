const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

// Get all liked videos for current user
router.get('/', requireAuth, (req, res) => {
  try {
    const list = db.prepare(`
      SELECT video_id, action, created_at
      FROM likes
      WHERE user_id = ? AND action = 'like'
      ORDER BY created_at DESC
    `).all(req.user.id);

    return res.json({ items: list });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load liked videos' });
  }
});

// Toggle Like / Dislike
router.post('/toggle', requireAuth, (req, res) => {
  try {
    const { videoId, action } = req.body; // 'like' or 'dislike'
    if (!videoId || !['like', 'dislike'].includes(action)) {
      return res.status(400).json({ error: 'videoId and valid action (like/dislike) are required' });
    }

    const existing = db.prepare('SELECT id, action FROM likes WHERE user_id = ? AND video_id = ?').get(req.user.id, videoId);

    if (existing) {
      if (existing.action === action) {
        // Toggle off
        db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
        return res.json({ activeAction: null });
      } else {
        // Switch action
        db.prepare('UPDATE likes SET action = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?').run(action, existing.id);
        return res.json({ activeAction: action });
      }
    }

    const id = 'like_' + crypto.randomUUID();
    db.prepare('INSERT INTO likes (id, user_id, video_id, action) VALUES (?, ?, ?, ?)').run(id, req.user.id, videoId, action);
    return res.json({ activeAction: action });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update like status', message: err.message });
  }
});

module.exports = router;
