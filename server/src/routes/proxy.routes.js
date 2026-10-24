const express = require('express');
const router = express.Router();
const { getThumbnail, generateFallbackSvg } = require('../services/thumbnailService');

// Bulletproof YouTube Thumbnail Proxy
router.get('/thumbnail/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const { title } = req.query;
    await getThumbnail(videoId, res, title);
  } catch (err) {
    // Ultimate fallback: SVG generated dynamically, never 500/crash!
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(generateFallbackSvg(req.params.videoId || 'dutube', 'DuTube Video'));
  }
});

// Fallback channel avatar
router.get('/avatar/:name', (req, res) => {
  const name = req.params.name || 'User';
  const initial = name.charAt(0).toUpperCase();
  const colors = ['#FF2A4D', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];
  const color = colors[Math.abs(name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length];

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <circle cx="64" cy="64" r="64" fill="${color}"/>
      <text x="64" y="76" font-family="system-ui, sans-serif" font-size="52" font-weight="700" fill="#ffffff" text-anchor="middle">
        ${initial}
      </text>
    </svg>
  `.trim();

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=604800');
  res.send(svg);
});

// Dedicated Local Player Frame Proxy - Guarantees valid referrers and zero Error 153
router.get('/player/:videoId', (req, res) => {
  const { videoId } = req.params;
  const cleanId = encodeURIComponent(videoId.replace(/[^a-zA-Z0-9_-]/g, ''));
  const { quality, lang, cc } = req.query;

  const queryParams = ['autoplay=1', 'playsinline=1', 'rel=0', 'modestbranding=1', 'enablejsapi=1'];
  if (quality && quality !== 'auto') {
    queryParams.push(`vq=${encodeURIComponent(quality)}`);
  }
  if (lang) {
    queryParams.push(`hl=${encodeURIComponent(lang)}`);
    queryParams.push(`cc_lang_pref=${encodeURIComponent(lang)}`);
  }
  if (cc === '1' || lang) {
    queryParams.push('cc_load_policy=1');
  }

  const origin = encodeURIComponent(req.protocol + '://' + req.get('host'));
  queryParams.push(`origin=${origin}`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="referrer" content="no-referrer-when-downgrade">
  <title>DuTube Player Frame</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000000; overflow: hidden; }
    iframe { width: 100%; height: 100%; border: none; display: block; }
  </style>
</head>
<body>
  <iframe
    id="yt-embed"
    src="https://www.youtube-nocookie.com/embed/${cleanId}?${queryParams.join('&')}"
    title="DuTube Stream"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
    referrerpolicy="no-referrer-when-downgrade"
  ></iframe>
  <script>
    window.addEventListener('message', function(e) {
      if (!e.data) return;
      var iframe = document.getElementById('yt-embed');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(e.data, '*');
      }
    });
  </script>
</body>
</html>`;

  res.send(html);
});

module.exports = router;
