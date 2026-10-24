const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const videoProvider = require('../services/videoProvider');
const { optionalAuth, requireAuth } = require('../middleware/auth');

// Trending topics for instant suggestions
const TRENDING_TOPICS = [
  'Full Stack Roadmap 2026',
  'M3 Max MacBook Pro',
  'Veritasium Radiation',
  'GTA 6 4K Trailer',
  'Rick Astley Remastered',
  'React 19 Server Actions',
  'Quantum Computing Explained',
  'Unreal Engine 5.5 Gameplay',
  'Joe Rogan Sam Altman AGI'
];

// Search videos
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { q = '', page = 1, limit = 10, filter = 'all' } = req.query;
    const query = q.trim();

    // Record to user's search history if logged in and query provided
    if (query && req.user) {
      const id = 'sh_' + crypto.randomUUID();
      try {
        db.prepare('INSERT INTO search_history (id, user_id, query) VALUES (?, ?, ?)').run(id, req.user.id, query);
      } catch {
        // Non-critical if duplicate
      }
    }

    const results = await videoProvider.search({
      query,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      filter
    });

    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: 'Search failed', message: err.message });
  }
});

// Search suggestions as user types - Live YouTube suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { q = '' } = req.query;
    const term = (q || '').trim();

    if (!term) {
      return res.json({ suggestions: TRENDING_TOPICS.slice(0, 6) });
    }

    try {
      const axios = require('axios');
      const ytSuggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(term)}`;
      const suggestRes = await axios.get(ytSuggestUrl, { timeout: 2000 });
      if (Array.isArray(suggestRes.data) && Array.isArray(suggestRes.data[1])) {
        const liveSuggestions = suggestRes.data[1];
        if (liveSuggestions.length > 0) {
          return res.json({ suggestions: liveSuggestions.slice(0, 8) });
        }
      }
    } catch {
      // fallback
    }

    const matches = TRENDING_TOPICS.filter(t => t.toLowerCase().includes(term.toLowerCase()));
    if (matches.length < 5) {
      matches.push(`${term} song`, `${term} full video`, `${term} 4k`, `${term} tutorial`);
    }

    return res.json({ suggestions: matches.slice(0, 6) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Trending searches
router.get('/trending', (req, res) => {
  return res.json({ items: TRENDING_TOPICS });
});

// User's recent search history
router.get('/history', requireAuth, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT DISTINCT query, MAX(created_at) as created_at
      FROM search_history
      WHERE user_id = ?
      GROUP BY query
      ORDER BY created_at DESC
      LIMIT 10
    `).all(req.user.id);

    return res.json({ items: history.map(h => h.query) });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load search history' });
  }
});

// Clear user's search history
router.delete('/history', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM search_history WHERE user_id = ?').run(req.user.id);
    return res.json({ success: true, message: 'Search history cleared' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to clear search history' });
  }
});

module.exports = router;
