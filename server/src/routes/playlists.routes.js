const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

// Get all playlists for user
router.get('/', requireAuth, (req, res) => {
  try {
    const playlists = db.prepare(`
      SELECT p.id, p.title, p.description, p.is_private, p.created_at,
             COUNT(pi.id) as item_count,
             (SELECT pi2.thumbnail_url FROM playlist_items pi2 WHERE pi2.playlist_id = p.id ORDER BY pi2.added_at DESC LIMIT 1) as cover_url
      FROM playlists p
      LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
      WHERE p.user_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all(req.user.id);

    return res.json({ items: playlists });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load playlists' });
  }
});

// Create new playlist
router.post('/', requireAuth, (req, res) => {
  try {
    const { title, description = '', isPrivate = false } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Playlist title is required' });
    }

    const id = 'pl_' + crypto.randomUUID();
    db.prepare(`
      INSERT INTO playlists (id, user_id, title, description, is_private)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.user.id, title.trim(), description.trim(), isPrivate ? 1 : 0);

    return res.status(201).json({
      playlist: {
        id,
        title: title.trim(),
        description: description.trim(),
        item_count: 0,
        cover_url: null
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// Get playlist details and items
router.get('/:id', requireAuth, (req, res) => {
  try {
    const playlist = db.prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const items = db.prepare(`
      SELECT id, video_id, title, channel_title, thumbnail_url, duration, added_at
      FROM playlist_items
      WHERE playlist_id = ?
      ORDER BY added_at DESC
    `).all(playlist.id);

    return res.json({
      playlist,
      items
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load playlist' });
  }
});

// Add video to playlist
router.post('/:id/items', requireAuth, (req, res) => {
  try {
    const { videoId, title, channelTitle, thumbnailUrl, duration } = req.body;
    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    const playlist = db.prepare('SELECT id FROM playlists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    const itemId = 'pli_' + crypto.randomUUID();
    db.prepare(`
      INSERT INTO playlist_items (id, playlist_id, video_id, title, channel_title, thumbnail_url, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(playlist_id, video_id) DO NOTHING
    `).run(
      itemId,
      playlist.id,
      videoId,
      title || 'DuTube Video',
      channelTitle || '',
      thumbnailUrl || `/api/proxy/thumbnail/${videoId}`,
      duration || ''
    );

    return res.json({ success: true, message: 'Video added to playlist' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add video to playlist', message: err.message });
  }
});

// Remove video from playlist
router.delete('/:id/items/:videoId', requireAuth, (req, res) => {
  try {
    const playlist = db.prepare('SELECT id FROM playlists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    db.prepare('DELETE FROM playlist_items WHERE playlist_id = ? AND video_id = ?').run(playlist.id, req.params.videoId);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to remove video from playlist' });
  }
});

// Delete playlist
router.delete('/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM playlists WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    return res.json({ success: true, message: 'Playlist deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

module.exports = router;
