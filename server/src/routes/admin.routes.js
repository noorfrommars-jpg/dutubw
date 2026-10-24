const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Apply auth + admin check to all admin routes
router.use(requireAuth, requireAdmin);

// Admin KPI Summary
router.get('/stats', (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalWatchHistory = db.prepare('SELECT COUNT(*) as count FROM watch_history').get().count;
    const totalPlaylists = db.prepare('SELECT COUNT(*) as count FROM playlists').get().count;
    const totalSubs = db.prepare('SELECT COUNT(*) as count FROM subscriptions').get().count;
    const activeAdsCount = db.prepare('SELECT COUNT(*) as count FROM native_ads WHERE is_active = 1').get().count;
    
    const adMetrics = db.prepare(`
      SELECT SUM(impressions) as total_impressions, SUM(clicks) as total_clicks
      FROM native_ads
    `).get();

    const totalImpressions = adMetrics.total_impressions || 0;
    const totalClicks = adMetrics.total_clicks || 0;
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

    return res.json({
      totalUsers,
      totalViews: totalWatchHistory,
      totalPlaylists,
      totalSubscriptions: totalSubs,
      activeAdsCount,
      adImpressions: totalImpressions,
      adClicks: totalClicks,
      adCtr: `${ctr}%`
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compute admin stats' });
  }
});

// User Management: List users
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.email, u.username, u.avatar_url, u.role, u.created_at,
             (SELECT COUNT(*) FROM watch_history wh WHERE wh.user_id = u.id) as watch_count,
             (SELECT COUNT(*) FROM subscriptions s WHERE s.user_id = u.id) as subs_count
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT 100
    `).all();

    return res.json({ items: users });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role (e.g. promote to admin or demote)
router.put('/users/:id/role', (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    return res.json({ success: true, message: `User role updated to ${role}` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Native Ads: List all ads
router.get('/ads', (req, res) => {
  try {
    const ads = db.prepare('SELECT * FROM native_ads ORDER BY created_at DESC').all();
    return res.json({ items: ads });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch ads' });
  }
});

// Native Ads: Create new ad
router.post('/ads', (req, res) => {
  try {
    const { title, description, cta_text, cta_url, sponsor_name, sponsor_logo, creative_url, is_active = 1 } = req.body;
    if (!title || !description || !cta_text || !cta_url || !sponsor_name) {
      return res.status(400).json({ error: 'Missing required ad fields' });
    }

    const id = 'ad_' + crypto.randomUUID();
    db.prepare(`
      INSERT INTO native_ads (id, title, description, cta_text, cta_url, sponsor_name, sponsor_logo, creative_url, is_active, impressions, clicks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
    `).run(
      id,
      title.trim(),
      description.trim(),
      cta_text.trim(),
      cta_url.trim(),
      sponsor_name.trim(),
      sponsor_logo || '',
      creative_url || '',
      is_active ? 1 : 0
    );

    const created = db.prepare('SELECT * FROM native_ads WHERE id = ?').get(id);
    return res.status(201).json({ ad: created });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create ad' });
  }
});

// Native Ads: Update ad
router.put('/ads/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, cta_text, cta_url, sponsor_name, sponsor_logo, creative_url, is_active } = req.body;

    db.prepare(`
      UPDATE native_ads
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          cta_text = COALESCE(?, cta_text),
          cta_url = COALESCE(?, cta_url),
          sponsor_name = COALESCE(?, sponsor_name),
          sponsor_logo = COALESCE(?, sponsor_logo),
          creative_url = COALESCE(?, creative_url),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(title, description, cta_text, cta_url, sponsor_name, sponsor_logo, creative_url, is_active, id);

    const updated = db.prepare('SELECT * FROM native_ads WHERE id = ?').get(id);
    return res.json({ ad: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update ad' });
  }
});

// Native Ads: Delete ad
router.delete('/ads/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM native_ads WHERE id = ?').run(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete ad' });
  }
});

// Native Ad Settings (Frequency, min videos, toggles)
router.get('/ad-settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM ad_settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    return res.json({ settings });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch ad settings' });
  }
});

router.put('/ad-settings', (req, res) => {
  try {
    const { native_ads_enabled, native_ad_frequency, min_videos_before_ad, max_ads_per_session } = req.body;

    const upsert = db.prepare(`
      INSERT INTO ad_settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    if (native_ads_enabled !== undefined) upsert.run('native_ads_enabled', String(native_ads_enabled));
    if (native_ad_frequency !== undefined) upsert.run('native_ad_frequency', String(native_ad_frequency));
    if (min_videos_before_ad !== undefined) upsert.run('min_videos_before_ad', String(min_videos_before_ad));
    if (max_ads_per_session !== undefined) upsert.run('max_ads_per_session', String(max_ads_per_session));

    return res.json({ success: true, message: 'Ad configuration updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update ad settings' });
  }
});

// Analytics Logs
router.get('/analytics', (req, res) => {
  try {
    const events = db.prepare(`
      SELECT e.id, e.user_id, u.username, e.event_type, e.event_data, e.timestamp
      FROM analytics_events e
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY e.timestamp DESC
      LIMIT 100
    `).all();

    return res.json({ items: events });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load analytics log' });
  }
});

// App Settings (Maintenance, quality, etc.)
router.get('/app-settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM app_settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    return res.json({ settings });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load app settings' });
  }
});

router.put('/app-settings', (req, res) => {
  try {
    const upsert = db.prepare(`
      INSERT INTO app_settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    Object.entries(req.body).forEach(([key, val]) => {
      upsert.run(key, String(val));
    });

    return res.json({ success: true, message: 'App settings updated' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update app settings' });
  }
});

module.exports = router;
