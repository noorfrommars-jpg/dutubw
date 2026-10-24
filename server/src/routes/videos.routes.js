const express = require('express');
const router = express.Router();
const videoProvider = require('../services/videoProvider');
const db = require('../db/database');
const { optionalAuth } = require('../middleware/auth');

// Video Feed
router.get('/feed', async (req, res) => {
  try {
    const { category = 'All', page = 1, limit = 12 } = req.query;
    const result = await videoProvider.getFeed({
      category,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 12
    });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch video feed', message: err.message });
  }
});

// Single Video Details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const videoId = req.params.id;
    const video = await videoProvider.getVideoById(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Add user interaction state if logged in
    let isLiked = false;
    let isDisliked = false;
    let isSubscribed = false;
    let isSaved = false;

    if (req.user) {
      const likeRecord = db.prepare('SELECT action FROM likes WHERE user_id = ? AND video_id = ?').get(req.user.id, video.id);
      if (likeRecord) {
        isLiked = likeRecord.action === 'like';
        isDisliked = likeRecord.action === 'dislike';
      }

      const subRecord = db.prepare('SELECT id FROM subscriptions WHERE user_id = ? AND channel_id = ?').get(req.user.id, video.channelId);
      isSubscribed = Boolean(subRecord);

      const savedRecord = db.prepare('SELECT id FROM watch_later WHERE user_id = ? AND video_id = ?').get(req.user.id, video.id);
      isSaved = Boolean(savedRecord);
    }

    return res.json({
      ...video,
      userState: {
        isLiked,
        isDisliked,
        isSubscribed,
        isSaved
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load video details', message: err.message });
  }
});

// Related Videos
router.get('/:id/related', async (req, res) => {
  try {
    const videoId = req.params.id;
    const related = await videoProvider.getRelatedVideos(videoId, 10);
    return res.json({ items: related });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load related videos', message: err.message });
  }
});

// Resolve arbitrary YouTube video or URL
router.post('/resolve', async (req, res) => {
  try {
    const { urlOrId } = req.body;
    if (!urlOrId) {
      return res.status(400).json({ error: 'URL or Video ID is required' });
    }
    const extractedId = videoProvider.extractYouTubeId(urlOrId) || urlOrId.trim();
    const video = await videoProvider.getVideoById(extractedId);
    if (!video) {
      return res.status(404).json({ error: 'Could not resolve video' });
    }
    return res.json({ video });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to resolve video', message: err.message });
  }
});

module.exports = router;
