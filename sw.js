// Core Wallet — Service Worker v2
// Hosted at: https://coredigitaltools-collab.github.io/Core-Wallet/

const CACHE = 'cw-v2';
const BASE = '/Core-Wallet';
const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json'
];

// ── Install: cache shell ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE && k !== 'cw_meta_v1')
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Draw icon using OffscreenCanvas ──
async function drawIcon(label, size) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const r = size * 0.22;
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#534AB7');
  grad.addColorStop(1, '#E8735A');
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fs = Math.round(size * (label.length > 5 ? 0.17 : label.length > 3 ? 0.22 : 0.30));
  ctx.font = `700 ${fs}px sans-serif`;
  ctx.fillText(label, size / 2, size / 2);
  return canvas.convertToBlob({ type: 'image/png' });
}

// ── Get stored app name ──
async function getAppName() {
  try {
    const cache = await caches.open('cw_meta_v1');
    const res = await cache.match('cw_app_name');
    return res ? await res.text() : 'CW';
  } catch { return 'CW'; }
}

// ── Fetch handler ──
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const path = url.pathname;

  // Dynamic manifest
  if (path === BASE + '/manifest.json') {
    e.respondWith((async () => {
      const name = await getAppName();
      const manifest = {
        name,
        short_name: name,
        description: 'Your personal wallet — ' + name,
        start_url: BASE + '/',
        scope: BASE + '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#534AB7',
        theme_color: '#534AB7',
        icons: [
          { src: BASE + '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: BASE + '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: BASE + '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      };
      return new Response(JSON.stringify(manifest), {
        headers: {
          'Content-Type': 'application/manifest+json',
          'Cache-Control': 'no-cache'
        }
      });
    })());
    return;
  }

  // Dynamic icons
  if (path === BASE + '/icon-192.png' || path === BASE + '/icon-512.png') {
    e.respondWith((async () => {
      const size = path.includes('512') ? 512 : 192;
      const name = await getAppName();
      const blob = await drawIcon(name, size);
      return new Response(blob, {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' }
      });
    })());
    return;
  }

  // Store app name (called from main app after setup)
  if (path === BASE + '/sw-set-name') {
    e.respondWith((async () => {
      const name = url.searchParams.get('n') || 'CW';
      const cache = await caches.open('cw_meta_v1');
      await cache.put('cw_app_name', new Response(name));
      return new Response('ok', { headers: { 'Content-Type': 'text/plain' } });
    })());
    return;
  }

  // Everything else: cache-first, network fallback, then index
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request)
        .then(res => {
          if (res && res.status === 200 && e.request.method === 'GET') {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(BASE + '/index.html'));
    })
  );
});
