const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get active configuration for native ad insertion in client feed
router.get('/config', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM ad_settings').all();
    const config = {
      native_ads_enabled: true,
      native_ad_frequency: 3,
      min_videos_before_ad: 2,
      max_ads_per_session: 20
    };

    rows.forEach(r => {
      if (r.key === 'native_ads_enabled') config.native_ads_enabled = r.value === 'true';
      if (r.key === 'native_ad_frequency') config.native_ad_frequency = parseInt(r.value, 10) || 3;
      if (r.key === 'min_videos_before_ad') config.min_videos_before_ad = parseInt(r.value, 10) || 2;
      if (r.key === 'max_ads_per_session') config.max_ads_per_session = parseInt(r.value, 10) || 20;
    });

    return res.json(config);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load ad settings' });
  }
});

// Get active native ads for injection into feed
router.get('/active', (req, res) => {
  try {
    const ads = db.prepare(`
      SELECT id, title, description, cta_text, cta_url, sponsor_name, sponsor_logo, creative_url
      FROM native_ads
      WHERE is_active = 1
      ORDER BY RANDOM()
    `).all();

    return res.json({ items: ads });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch native ads' });
  }
});

// Track Ad Impression
router.post('/:id/impression', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE native_ads SET impressions = impressions + 1 WHERE id = ?').run(id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record impression' });
  }
});

// Track Ad Click
router.post('/:id/click', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE native_ads SET clicks = clicks + 1 WHERE id = ?').run(id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record click' });
  }
});

module.exports = router;
