const axios = require('axios');

// In-memory cache for fast response and zero redundant network overhead
const thumbnailCache = new Map();
const MAX_CACHE_ITEMS = 500;

/**
 * Generate a high quality fallback SVG thumbnail if YouTube thumbnail is unavailable
 */
function generateFallbackSvg(videoId, title = 'DuTube Stream') {
  const safeTitle = (title || 'DuTube Video')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .substring(0, 48);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="50%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#0B0C0E"/>
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF2A4D"/>
          <stop offset="100%" stop-color="#FF5E3A"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FF2A4D" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- Background -->
      <rect width="1280" height="720" fill="url(#bg)"/>
      <circle cx="640" cy="360" r="400" fill="url(#glow)"/>

      <!-- DuTube Decorative grid lines -->
      <path d="M0 180 H1280 M0 360 H1280 M0 540 H1280" stroke="#ffffff" stroke-opacity="0.03" stroke-width="2"/>
      <path d="M320 0 V720 M640 0 V720 M960 0 V720" stroke="#ffffff" stroke-opacity="0.03" stroke-width="2"/>

      <!-- Center Play Icon Card -->
      <g transform="translate(640, 320)">
        <circle r="68" fill="url(#accent)" filter="drop-shadow(0 10px 25px rgba(255,42,77,0.5))"/>
        <polygon points="-16,-28 28,0 -16,28" fill="#ffffff"/>
      </g>

      <!-- DuTube Brand Badge -->
      <g transform="translate(64, 64)">
        <rect width="120" height="42" rx="10" fill="#0B0C0E" fill-opacity="0.8" stroke="#FF2A4D" stroke-width="1.5"/>
        <text x="60" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="#ffffff" text-anchor="middle">
          Du<tspan fill="#FF2A4D">Tube</tspan>
        </text>
      </g>

      <!-- Video Title -->
      <text x="640" y="470" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle">
        ${safeTitle}
      </text>
      <text x="640" y="515" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="500" fill="#94a3b8" text-anchor="middle">
        ID: ${videoId} • High-Definition Stream
      </text>
    </svg>
  `.trim();
}

/**
 * Fetch and stream thumbnail with multi-level fallback
 */
async function getThumbnail(videoId, res, title = '') {
  if (!videoId || typeof videoId !== 'string') {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(generateFallbackSvg('unknown', 'DuTube Video'));
  }

  // Check cache
  const cached = thumbnailCache.get(videoId);
  if (cached) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    return res.send(cached.buffer);
  }

  // Candidate URLs from highest quality to reliable fallback
  const candidates = [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
  ];

  for (const url of candidates) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 4000,
        validateStatus: (status) => status === 200,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DuTubeProxy/2.0'
        }
      });

      const buffer = Buffer.from(response.data);
      const contentType = response.headers['content-type'] || 'image/jpeg';

      // Check if YouTube returned the 120x90 empty placeholder (often ~1097 bytes)
      if (buffer.length > 2000) {
        if (thumbnailCache.size >= MAX_CACHE_ITEMS) {
          const firstKey = thumbnailCache.keys().next().value;
          thumbnailCache.delete(firstKey);
        }
        thumbnailCache.set(videoId, { buffer, contentType });

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
        return res.send(buffer);
      }
    } catch {
      // Continue to next candidate
    }
  }

  // If external CDN fails or unavailable, serve high-res SVG fallback
  const fallbackSvg = Buffer.from(generateFallbackSvg(videoId, title));
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  return res.send(fallbackSvg);
}

module.exports = {
  getThumbnail,
  generateFallbackSvg
};
