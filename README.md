# DuTube - Production-Quality Mobile Video Streaming App & Backend

**DuTube** is a next-generation mobile video streaming platform with a dark-first UI, native advertising engine, and a resilient backend architecture with automatic thumbnail fallback and authorized video playback mechanisms.

---

## Key Highlights

1. **Brand Identity & Premium Mobile UX**:
   - Modern stylized coral-to-crimson `#FF2A4D` DuTube emblem and typography.
   - Obsidian dark (`#0B0C0E`) and crisp light themes.
   - Smooth animated splash screen.
   - 4-tab mobile navigation: **Home**, **Subscriptions**, **Library**, and **Me**.
   - Top Header with brand logo, notifications drawer, any YouTube link/ID resolver, theme toggle, and Admin Portal button.
   - Responsive Mobile Device Shell (toggleable on desktop between iPhone frame and fluid view).

2. **Live YouTube Server Connection & Never-Crash Thumbnail Engine**:
   - **Direct Real-Time YouTube Server Integration**:
     - Connects directly to YouTube servers in real-time (using YouTube InnerTube & `yt-search` protocols, identical to open-source streaming apps like NewPipe, Piped, and Invidious).
     - Allows users to search and stream **EVERY video across all of YouTube** (any artist, language, region, game, tutorial, or documentary) without API key limitations.
     - Live autocomplete search suggestions powered by YouTube's real-time query suggest engine.
   - **Never-Crash Thumbnail Proxy (`/api/proxy/thumbnail/:videoId`)**:
     - Automatically tries `maxresdefault.jpg` -> `sddefault.jpg` -> `hqdefault.jpg` -> `mqdefault.jpg`.
     - Detects empty 120x90 YouTube stubs and falls back gracefully.
     - Automatically generates dynamic branded vector SVG thumbnails if external networks fail.
     - HTTP caching headers (`Cache-Control: public, max-age=604800`).
   - **Play ANY YouTube Video or URL**:
     - Built-in oEmbed and ID extractor (`https://youtube.com/watch?v=...`, `https://youtu.be/...`, shorts, or 11-char ID).
     - Official YouTube IFrame Player API integration.
     - Custom overlay controls: Play/Pause, interactive Seek bar, elapsed/total time, Double-Tap Seek (left -10s, right +10s with ripple animations), Mute/Volume, and Speed Selector (0.5x to 2x).
     - Docked Floating Mini-Player for background browsing while listening.

3. **DuTube Native Advertising System**:
   - Native ads are placed **strictly outside** the video player directly in the feed.
   - **Default pattern**: 1 native ad after every **3 video cards** (e.g. Video, Video, Video, Native Ad).
   - Dynamic backend configuration:
     - Admin can change frequency (e.g., 2, 3, 5, 7) or toggle ads ON/OFF in real-time without app reloads.
     - Distinct Sponsored card styling with advertiser logo, title, description, banner, and CTA button.
     - Privacy-conscious impression and click analytics tracking.

4. **Web-Based Admin Dashboard**:
   - Real-time KPIs: Total Registered Users, Video Views, Active Native Ads, Impressions, Clicks, CTR %.
   - Native Ad Frequency slider and toggle.
   - Create, edit, and delete native ad campaigns.
   - User role manager (promote to Admin, demote).
   - Real-time event analytics stream.

5. **Full Relational SQLite Database**:
   - High-concurrency WAL mode SQLite database (`dutube.sqlite`).
   - Tables: `users`, `profiles`, `subscriptions`, `watch_history`, `watch_later`, `likes`, `playlists`, `playlist_items`, `comments`, `search_history`, `native_ads`, `ad_settings`, `app_settings`, `analytics_events`.
   - Indexed queries for 60 FPS mobile performance.

---

## Seed Accounts & Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Normal User** | `demo@dutube.app` | `demo1234` |
| **Administrator** | `admin@dutube.app` | `admin1234` |
| **Google Sign-In Demo** | 1-Click "Continue with Google" in login modal | Automatic |

---

## Project Structure

```
radiant-maxwell/
├── client/                     # Vite + React 18 + TailwindCSS Frontend
│   ├── src/
│   │   ├── components/         # VideoCard, NativeAdCard, VideoPlayer, MiniPlayer, TopHeader, BottomNav, etc.
│   │   ├── context/            # AuthContext, PlayerContext, ThemeContext
│   │   ├── pages/              # HomePage, SubscriptionsPage, LibraryPage, MePage, SearchPage, AdminPage
│   │   ├── services/           # api.js, videoService.js, adsService.js, libraryService.js, analyticsService.js
│   │   ├── App.jsx             # Shell & modal managers
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── server/                     # Node.js + Express + SQLite Backend
│   ├── src/
│   │   ├── db/                 # database.js (SQLite WAL schema & seeders)
│   │   ├── middleware/         # auth.js (JWT verify & Admin role guard)
│   │   ├── routes/             # auth, videos, ads, history, watchLater, likes, subscriptions, playlists, comments, search, analytics, admin, proxy
│   │   ├── services/           # videoProvider.js, thumbnailService.js
│   │   └── server.js           # Main Express server entry (Port 5000)
│   └── .env                    # Environment variables
│
├── .env.example
├── package.json
└── README.md
```

---

## Quick Start Instructions

### 1. Start the Full Production Stack
From the project root:
```bash
node server/src/server.js
```
The server will start on `http://localhost:5000`, serving both the REST API and the bundled DuTube mobile application.

### 2. Frontend Development Mode (Hot Reload)
```bash
cd client
npm run dev
```
Open `http://localhost:3000`.

---

## API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check & version |
| `POST` | `/api/auth/login` | Login with email & password |
| `POST` | `/api/auth/register` | Register new account |
| `POST` | `/api/auth/google-demo` | 1-Click Google Sign-in demo |
| `GET` | `/api/videos/feed` | Video feed with category & pagination |
| `GET` | `/api/videos/:id` | Video details and user like/sub state |
| `POST` | `/api/videos/resolve` | Resolve any YouTube URL or 11-char ID |
| `GET` | `/api/proxy/thumbnail/:videoId` | Bulletproof thumbnail proxy with fallback |
| `GET` | `/api/ads/config` | Native ad settings (frequency, enabled) |
| `GET` | `/api/ads/active` | Active native ad creatives |
| `POST` | `/api/ads/:id/click` | Report ad click |
| `GET` | `/api/history` | User watch history with progress |
| `POST` | `/api/history` | Save/update watch progress |
| `GET` | `/api/subscriptions` | User's subscribed channels |
| `POST` | `/api/subscriptions/toggle` | Subscribe / Unsubscribe |
| `GET` | `/api/playlists` | User playlists |
| `POST` | `/api/playlists` | Create custom playlist |
| `GET` | `/api/comments/:videoId` | Video comments list |
| `POST` | `/api/comments/:videoId` | Post new comment |
| `GET` | `/api/search` | Search videos with query |
| `GET` | `/api/admin/stats` | Admin KPI stats (Users, Views, CTR) |
| `PUT` | `/api/admin/ad-settings` | Update native ad frequency & toggles |
