const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Default initial comments to seed for realistic engagement if none exist
const DEFAULT_COMMENTS = [
  {
    author_name: 'TechGeek_99',
    author_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80',
    text: 'The streaming quality on DuTube is insanely crisp! Zero buffering even at 4K.',
    likes_count: 428
  },
  {
    author_name: 'Elena Rostova',
    author_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80',
    text: 'Loved the visual presentation here. So smooth and clean without intrusive player popups.',
    likes_count: 154
  },
  {
    author_name: 'DevMarcus',
    author_avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=80&auto=format&fit=crop&q=80',
    text: 'Can we appreciate how well thought out this layout is? Great job team!',
    likes_count: 89
  }
];

// Get comments for a video
router.get('/:videoId', (req, res) => {
  try {
    const { videoId } = req.params;
    let comments = db.prepare(`
      SELECT id, video_id, user_id, author_name, author_avatar, text, likes_count, created_at
      FROM comments
      WHERE video_id = ?
      ORDER BY created_at DESC
    `).all(videoId);

    // If no comments yet, seed 2-3 realistic comments so the UI looks active
    if (comments.length === 0) {
      DEFAULT_COMMENTS.forEach(c => {
        const id = 'cmt_' + crypto.randomUUID();
        db.prepare(`
          INSERT INTO comments (id, video_id, user_id, author_name, author_avatar, text, likes_count)
          VALUES (?, ?, NULL, ?, ?, ?, ?)
        `).run(id, videoId, c.author_name, c.author_avatar, c.text, c.likes_count);
      });

      comments = db.prepare(`
        SELECT id, video_id, user_id, author_name, author_avatar, text, likes_count, created_at
        FROM comments
        WHERE video_id = ?
        ORDER BY created_at DESC
      `).all(videoId);
    }

    return res.json({ items: comments, total: comments.length });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load comments' });
  }
});

// Post a new comment
router.post('/:videoId', requireAuth, (req, res) => {
  try {
    const { videoId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text cannot be empty' });
    }

    const id = 'cmt_' + crypto.randomUUID();
    db.prepare(`
      INSERT INTO comments (id, video_id, user_id, author_name, author_avatar, text, likes_count)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(
      id,
      videoId,
      req.user.id,
      req.user.username,
      req.user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80',
      text.trim()
    );

    const newComment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
    return res.status(201).json({ comment: newComment });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to post comment', message: err.message });
  }
});

// Delete comment
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const comment = db.prepare('SELECT user_id FROM comments WHERE id = ?').get(id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only owner or admin can delete
    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
