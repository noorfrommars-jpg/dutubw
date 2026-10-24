const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/database');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

// Register
router.post('/register', (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'Account with this email already exists' });
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);
  const id = 'user_' + crypto.randomUUID();
  const avatar_url = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;

  try {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, username, avatar_url, role)
      VALUES (?, ?, ?, ?, ?, 'user')
    `).run(id, email.toLowerCase().trim(), password_hash, username.trim(), avatar_url);

    db.prepare(`
      INSERT INTO profiles (user_id, bio, preferences_json)
      VALUES (?, '', ?)
    `).run(id, JSON.stringify({ theme: 'dark', autoplay: true }));

    const token = jwt.sign({ id, email, role: 'user' }, JWT_SECRET, { expiresIn: '30d' });

    return res.status(201).json({
      token,
      user: { id, email, username, avatar_url, role: 'user' }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create user account' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar_url: user.avatar_url,
      role: user.role
    }
  });
});

// 1-Click Google Sign-In Demo
router.post('/google-demo', (req, res) => {
  const demoEmail = 'alex.google@dutube.app';
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(demoEmail);

  if (!user) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('google_demo_pass', salt);
    const id = 'user_google_' + crypto.randomUUID().slice(0, 8);
    const avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    db.prepare(`
      INSERT INTO users (id, email, password_hash, username, avatar_url, role)
      VALUES (?, ?, ?, 'Alex G.', ?, 'user')
    `).run(id, demoEmail, hash, avatar);

    db.prepare('INSERT INTO profiles (user_id, bio, preferences_json) VALUES (?, ?, ?)')
      .run(id, 'Signed in with Google', JSON.stringify({ theme: 'dark', autoplay: true }));

    user = { id, email: demoEmail, username: 'Alex G.', avatar_url: avatar, role: 'user' };
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatar_url: user.avatar_url,
      role: user.role
    }
  });
});

// Current User Profile & Stats
router.get('/me', requireAuth, (req, res) => {
  const user = req.user;
  const profile = db.prepare('SELECT bio, preferences_json, updated_at FROM profiles WHERE user_id = ?').get(user.id);
  const subCount = db.prepare('SELECT COUNT(*) as count FROM subscriptions WHERE user_id = ?').get(user.id)?.count || 0;
  const historyCount = db.prepare('SELECT COUNT(*) as count FROM watch_history WHERE user_id = ?').get(user.id)?.count || 0;
  const playlistCount = db.prepare('SELECT COUNT(*) as count FROM playlists WHERE user_id = ?').get(user.id)?.count || 0;
  const likedCount = db.prepare('SELECT COUNT(*) as count FROM likes WHERE user_id = ? AND action = ?').get(user.id, 'like')?.count || 0;

  return res.json({
    user: {
      ...user,
      bio: profile?.bio || '',
      preferences: profile?.preferences_json ? JSON.parse(profile.preferences_json) : { theme: 'dark', autoplay: true },
      stats: {
        subscriptions: subCount,
        history: historyCount,
        playlists: playlistCount,
        liked: likedCount
      }
    }
  });
});

// Update Profile
router.put('/profile', requireAuth, (req, res) => {
  const { username, bio, preferences } = req.body;
  if (username) {
    db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username.trim(), req.user.id);
  }
  if (bio !== undefined || preferences !== undefined) {
    const current = db.prepare('SELECT bio, preferences_json FROM profiles WHERE user_id = ?').get(req.user.id);
    const newBio = bio !== undefined ? bio : current?.bio || '';
    const newPrefs = preferences !== undefined ? JSON.stringify(preferences) : current?.preferences_json || '{}';

    db.prepare(`
      INSERT INTO profiles (user_id, bio, preferences_json, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET bio = excluded.bio, preferences_json = excluded.preferences_json, updated_at = CURRENT_TIMESTAMP
    `).run(req.user.id, newBio, newPrefs);
  }

  return res.json({ success: true, message: 'Profile updated successfully' });
});

module.exports = router;
