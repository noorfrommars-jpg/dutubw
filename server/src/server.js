require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Initialize database
require('./db/database');

const authRoutes = require('./routes/auth.routes');
const videoRoutes = require('./routes/videos.routes');
const adsRoutes = require('./routes/ads.routes');
const historyRoutes = require('./routes/history.routes');
const watchLaterRoutes = require('./routes/watchLater.routes');
const likesRoutes = require('./routes/likes.routes');
const subscriptionsRoutes = require('./routes/subscriptions.routes');
const playlistsRoutes = require('./routes/playlists.routes');
const commentsRoutes = require('./routes/comments.routes');
const searchRoutes = require('./routes/search.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const adminRoutes = require('./routes/admin.routes');
const proxyRoutes = require('./routes/proxy.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: false,
  frameguard: false,
  referrerPolicy: { policy: 'no-referrer-when-downgrade' }
}));

app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'DuTube Mobile Video Streaming Backend',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/watch-later', watchLaterRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/playlists', playlistsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/proxy', proxyRoutes);

// Serve static client build if present
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(clientDistPath, 'index.html');
    return res.sendFile(indexPath, (err) => {
      if (err) next();
    });
  }
  next();
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` DuTube Backend Engine running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(` Ready for high-concurrency video streaming`);
  console.log(`===============================================`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  server.close(() => {
    console.log('DuTube server terminated safely');
    process.exit(0);
  });
});

module.exports = app;
