const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../../dutube.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for high performance concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      username TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- User profiles table
    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      bio TEXT,
      preferences_json TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Subscriptions table
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      channel_title TEXT NOT NULL,
      channel_avatar TEXT,
      subscriber_count TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, channel_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Watch History table
    CREATE TABLE IF NOT EXISTS watch_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      channel_title TEXT,
      channel_avatar TEXT,
      thumbnail_url TEXT,
      duration TEXT,
      duration_seconds INTEGER DEFAULT 0,
      progress_seconds INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, video_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Watch Later table
    CREATE TABLE IF NOT EXISTS watch_later (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      channel_title TEXT,
      channel_avatar TEXT,
      thumbnail_url TEXT,
      duration TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, video_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Liked / Disliked videos
    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      video_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('like', 'dislike')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, video_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Playlists table
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      is_private INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Playlist Items
    CREATE TABLE IF NOT EXISTS playlist_items (
      id TEXT PRIMARY KEY,
      playlist_id TEXT NOT NULL,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      channel_title TEXT,
      thumbnail_url TEXT,
      duration TEXT,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(playlist_id, video_id),
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
    );

    -- Comments
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      user_id TEXT,
      author_name TEXT NOT NULL,
      author_avatar TEXT,
      text TEXT NOT NULL,
      likes_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Search History
    CREATE TABLE IF NOT EXISTS search_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      query TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Native Ads table
    CREATE TABLE IF NOT EXISTS native_ads (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      cta_text TEXT NOT NULL,
      cta_url TEXT NOT NULL,
      sponsor_name TEXT NOT NULL,
      sponsor_logo TEXT,
      creative_url TEXT,
      is_active INTEGER DEFAULT 1,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Ad Settings (Key-Value)
    CREATE TABLE IF NOT EXISTS ad_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- App Settings (Key-Value)
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Analytics Events table
    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      event_type TEXT NOT NULL,
      event_data TEXT,
      session_id TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for high performance
    CREATE INDEX IF NOT EXISTS idx_history_user_updated ON watch_history(user_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_watchlater_user_created ON watch_later(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_comments_video ON comments(video_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type, timestamp DESC);
  `);

  // Seed default settings and sample accounts if empty
  seedInitialData();
}

function seedInitialData() {
  // 1. Seed Ad Settings
  const insertSetting = db.prepare('INSERT OR IGNORE INTO ad_settings (key, value) VALUES (?, ?)');
  insertSetting.run('native_ads_enabled', 'true');
  insertSetting.run('native_ad_frequency', '3'); // Show 1 native ad every 3 videos
  insertSetting.run('min_videos_before_ad', '2');
  insertSetting.run('max_ads_per_session', '20');

  // 2. Seed App Settings
  const insertAppSetting = db.prepare('INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)');
  insertAppSetting.run('app_name', 'DuTube');
  insertAppSetting.run('maintenance_mode', 'false');
  insertAppSetting.run('cache_ttl_seconds', '86400');
  insertAppSetting.run('default_quality', 'auto');
  insertAppSetting.run('allow_guest_playback', 'true');

  // 3. Seed Demo Users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('demo1234', salt);
    const adminPasswordHash = bcrypt.hashSync('admin1234', salt);

    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, username, avatar_url, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Demo Normal User
    insertUser.run(
      'user_demo_1',
      'demo@dutube.app',
      demoPasswordHash,
      'Alex Rivers',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'user'
    );

    // Admin User
    insertUser.run(
      'user_admin_1',
      'admin@dutube.app',
      adminPasswordHash,
      'DuTube Admin',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      'admin'
    );

    // Add profile
    const insertProfile = db.prepare('INSERT INTO profiles (user_id, bio, preferences_json) VALUES (?, ?, ?)');
    insertProfile.run('user_demo_1', 'Video enthusiast & music lover exploring DuTube.', JSON.stringify({ theme: 'dark', autoplay: true }));
    insertProfile.run('user_admin_1', 'Platform Administrator & Content Curator.', JSON.stringify({ theme: 'dark', autoplay: true }));

    // Add sample subscriptions for demo user
    const insertSub = db.prepare(`
      INSERT OR IGNORE INTO subscriptions (id, user_id, channel_id, channel_title, channel_avatar, subscriber_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertSub.run('sub_1', 'user_demo_1', 'veritasium', 'Veritasium', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80', '15.8M');
    insertSub.run('sub_2', 'user_demo_1', 'mkbhd', 'MKBHD Tech', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', '18.4M');
    insertSub.run('sub_3', 'user_demo_1', 'fireship', 'Fireship Coding', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80', '3.1M');
    insertSub.run('sub_4', 'user_demo_1', 'kurzgesagt', 'In a Nutshell', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&auto=format&fit=crop&q=80', '22.1M');

    // Add sample watch history for continue watching
    const insertHistory = db.prepare(`
      INSERT OR IGNORE INTO watch_history (id, user_id, video_id, title, channel_title, channel_avatar, thumbnail_url, duration, duration_seconds, progress_seconds, completed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertHistory.run(
      'hist_1',
      'user_demo_1',
      'dQw4w9WgXcQ',
      'Rick Astley - Never Gonna Give You Up (Official Music Video)',
      'Rick Astley',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80',
      'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      '3:33',
      213,
      142,
      0
    );
    insertHistory.run(
      'hist_2',
      'user_demo_1',
      'L_LUpnjgPso',
      'Building Next-Gen Web Apps with Node & React 2026',
      'Fireship Coding',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
      'https://img.youtube.com/vi/L_LUpnjgPso/hqdefault.jpg',
      '12:45',
      765,
      480,
      0
    );
  }

  // 4. Seed Native Ads
  const adCount = db.prepare('SELECT COUNT(*) as count FROM native_ads').get();
  if (adCount.count === 0) {
    const insertAd = db.prepare(`
      INSERT INTO native_ads (id, title, description, cta_text, cta_url, sponsor_name, sponsor_logo, creative_url, is_active, impressions, clicks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAd.run(
      'ad_1',
      'Next-Gen Cloud GPUs for AI Developers',
      'Deploy ultra-fast Llama 3 & DeepSeek models with zero setup latency. Get \$100 free credits today.',
      'Claim \$100 Credit',
      'https://cloud.google.com',
      'HyperScale AI Cloud',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
      1,
      1420,
      112
    );

    insertAd.run(
      'ad_2',
      'Master Full-Stack & AI Engineering in 12 Weeks',
      'Interactive hands-on projects, 1-on-1 mentor code reviews, and guaranteed portfolio construction.',
      'Start Learning Free',
      'https://github.com',
      'CodeCraft Academy',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
      1,
      980,
      86
    );

    insertAd.run(
      'ad_3',
      'AeroPods Max Ultra - Studio Spatial Audio',
      'Next generation hybrid active noise cancellation with 40-hour lossless battery performance.',
      'Shop Now - 25% Off',
      'https://apple.com',
      'Sonic Sound Labs',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
      1,
      2150,
      194
    );

    insertAd.run(
      'ad_4',
      'NordSec Enterprise VPN & Threat Protection',
      'Encrypt your entire network traffic, block malicious trackers, and stream without throttling worldwide.',
      'Get 70% Discount',
      'https://nordvpn.com',
      'NordSec Global',
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=80&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=600&auto=format&fit=crop&q=80',
      1,
      760,
      52
    );
  }
}

initDatabase();

module.exports = db;
