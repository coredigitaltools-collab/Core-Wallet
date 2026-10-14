// Core Wallet — Service Worker v5 (Forest ledger theme, Smart Shopping, wallet icon)
// Hosted at: https://coredigitaltools-collab.github.io/Core-Wallet/

const CACHE = 'cw-v5';
const META = 'cw_meta_v1';
const BASE = '/Core-Wallet';
const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json'
];

// Theme colours (flat, no gradients)
const ICON_BG = '#1E3A2F';   // forest
const ICON_FG = '#F4F1EA';   // cream
const SPLASH_BG = '#F4F1EA';

// ── Install: cache shell ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches (keeps the stored app name) ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE && k !== META)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Wallet icon (same drawing as the app) ──
// ── CORE WALLET ICON: emerald leather wallet with cards (shared by index.html and sw.js) ──
// cwDrawWallet(ctx, size, label): label '' = standard brand icon; 'J' or 'K n J' = personalised.
// Flat fills only (no gradients); depth comes from soft shadows, stitching and a fine grain.
function cwDrawWallet(ctx, size, label, compact) {
  // compact = shown small on screen (zoomed, no tile); fine detail depends on actual pixels
  var u = size / 100, small = size < 72, zoom = compact === undefined ? small : !!compact;
  var C = {
    bg: '#123222', tile: '#17402B', tileEdge: 'rgba(255,255,255,0.07)',
    leather: '#1F5236', leatherDk: '#173F2A', strap: '#225A3B',
    stitch: 'rgba(150,178,132,0.5)', cardBlack: '#1B1E1D', cardGold: '#C7A464',
    cardGreen: '#1C4732', gold: '#C9A86A', goldDk: '#8E7040', goldLt: '#E6CF9C'
  };
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }
  function shadow(blur, dy, a) { ctx.shadowColor = 'rgba(0,0,0,' + a + ')'; ctx.shadowBlur = blur * u; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = dy * u; }
  function noShadow() { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }
  function stitch(x, y, w, h, r) {
    if (small) return;
    ctx.save(); rr(x, y, w, h, r); ctx.setLineDash([1.7 * u, 1.3 * u]);
    ctx.lineWidth = 0.55 * u; ctx.strokeStyle = C.stitch; ctx.stroke(); ctx.restore();
  }
  function grain(x, y, w, h, r, n) {
    if (small) return;
    var s = 7;
    function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    ctx.save(); rr(x, y, w, h, r); ctx.clip();
    for (var i = 0; i < n; i++) {
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.045)';
      var d = (0.18 + rnd() * 0.28) * u;
      ctx.beginPath(); ctx.arc(x + rnd() * w, y + rnd() * h, d, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  function card(cx, cy, ang, fill, chip) {
    ctx.save(); ctx.translate(cx * u, cy * u); ctx.rotate(ang * Math.PI / 180);
    shadow(2.5, 1, 0.35); rr(-24 * u, -15 * u, 48 * u, 30 * u, 3 * u); ctx.fillStyle = fill; ctx.fill(); noShadow();
    ctx.lineWidth = 0.5 * u; ctx.strokeStyle = C.goldDk; ctx.stroke();
    if (chip) {
      rr(10 * u, -9 * u, 8 * u, 6.2 * u, 1.3 * u); ctx.fillStyle = C.gold; ctx.fill();
      if (!small) { ctx.lineWidth = 0.35 * u; ctx.strokeStyle = C.goldDk; ctx.beginPath();
        ctx.moveTo(14 * u, -9 * u); ctx.lineTo(14 * u, -2.8 * u); ctx.moveTo(10 * u, -5.9 * u); ctx.lineTo(18 * u, -5.9 * u); ctx.stroke(); }
    }
    ctx.restore();
  }

  ctx.save();
  // background (full bleed, so it also works as a maskable icon)
  ctx.fillStyle = zoom ? C.tile : C.bg; ctx.fillRect(0, 0, size, size);
  if (zoom) {
    // small sizes: skip the raised tile and zoom in so the wallet stays recognisable
    ctx.translate(size / 2, size / 2); ctx.scale(1.22, 1.22); ctx.translate(-size * 0.525, -size * 0.52);
  } else {
    shadow(5, 2, 0.45); rr(8 * u, 8 * u, 84 * u, 84 * u, 19 * u); ctx.fillStyle = C.tile; ctx.fill(); noShadow();
    ctx.lineWidth = 0.6 * u; ctx.strokeStyle = C.tileEdge; ctx.stroke();
  }

  // cards tucked in the wallet (cards only: no cash or currency)
  card(41, 38, -15, C.cardBlack, false);
  card(48, 40, -9, C.cardGold, false);
  card(55, 43, -4, C.cardGreen, true);

  // gold page edges peeking out on the right
  rr(21 * u, 41 * u, 59.5 * u, 40 * u, 6 * u); ctx.fillStyle = C.goldDk; ctx.fill();

  // wallet body
  shadow(4, 2.2, 0.5); rr(18 * u, 42 * u, 60 * u, 39 * u, 6 * u); ctx.fillStyle = C.leather; ctx.fill(); noShadow();
  grain(18 * u, 42 * u, 60 * u, 39 * u, 6 * u, 2600);
  ctx.fillStyle = C.leatherDk; rr(18 * u, 42 * u, 60 * u, 3.2 * u, 3 * u); ctx.fill();  // top lip
  ctx.fillStyle = 'rgba(255,255,255,0.05)'; rr(19.5 * u, 45.2 * u, 57 * u, 1 * u, 0.5 * u); ctx.fill(); // soft light on the fold
  stitch(20.6 * u, 46.2 * u, 54.8 * u, 32.2 * u, 4.2 * u);

  // strap with champagne-gold press stud
  shadow(2.5, 1.2, 0.45); rr(63 * u, 53 * u, 24 * u, 15 * u, 7.5 * u); ctx.fillStyle = C.strap; ctx.fill(); noShadow();
  grain(63 * u, 53 * u, 24 * u, 15 * u, 7.5 * u, 420);
  stitch(64.8 * u, 54.8 * u, 20.4 * u, 11.4 * u, 5.7 * u);
  shadow(1.2, 0.6, 0.5); ctx.beginPath(); ctx.arc(79 * u, 60.5 * u, 3.6 * u, 0, Math.PI * 2); ctx.fillStyle = C.gold; ctx.fill(); noShadow();
  ctx.lineWidth = 0.5 * u; ctx.strokeStyle = C.goldDk; ctx.stroke();
  ctx.beginPath(); ctx.arc(78 * u, 59.4 * u, 1.1 * u, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,245,215,0.45)'; ctx.fill();

  // embossed champagne-gold initial(s)
  label = String(label || '').trim();
  if (label) {
    var parts = label.split(/\s+n\s+/i), cx = 42 * u, cy = 62.5 * u;
    var serif = "'DM Serif Display', Georgia, 'Times New Roman', serif";
    function emboss(txt, x, y, px, italic) {
      ctx.font = (italic ? 'italic ' : '') + Math.round(px) + 'px ' + serif;
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillText(txt, x + 0.45 * u, y + 0.6 * u);
      ctx.fillStyle = 'rgba(255,240,205,0.28)'; ctx.fillText(txt, x - 0.25 * u, y - 0.3 * u);
      ctx.fillStyle = C.gold; ctx.fillText(txt, x, y);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (parts.length === 2 && parts[0] && parts[1]) {
      var big = 17 * u, gap = 11.5 * u;
      emboss(parts[0].charAt(0).toUpperCase(), cx - gap, cy, big, false);
      emboss('n', cx, cy + 1.2 * u, big * 0.55, true);
      emboss(parts[1].charAt(0).toUpperCase(), cx + gap, cy, big, false);
    } else {
      var t = label.length > 2 ? label.charAt(0).toUpperCase() : label.toUpperCase();
      emboss(t, cx, cy + 0.5 * u, (t.length > 1 ? 16 : 26) * u, false);
    }
  }
  ctx.restore();
}

async function drawIcon(label, size) {
  const canvas = new OffscreenCanvas(size, size);
  cwDrawWallet(canvas.getContext('2d'), size, label);
  return canvas.convertToBlob({ type: 'image/png' });
}

// ── Get stored app name ──
async function getAppName() {
  try {
    const cache = await caches.open(META);
    const res = await cache.match('cw_app_name');
    return res ? await res.text() : '';
  } catch { return ''; }
}

// ── Fetch handler ──
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const path = url.pathname;

  // Dynamic manifest
  if (path === BASE + '/manifest.json') {
    e.respondWith((async () => {
      const initials = await getAppName();
      const manifest = {
        name: 'Core Wallet',
        short_name: 'Core Wallet',
        description: initials ? 'Your personal wallet — ' + initials : 'Your personal household wallet',
        start_url: BASE + '/',
        scope: BASE + '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: SPLASH_BG,
        theme_color: ICON_BG,
        icons: [
          { src: BASE + '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: BASE + '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: BASE + '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      };
      return new Response(JSON.stringify(manifest), {
        headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'no-cache' }
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
      const name = url.searchParams.get('n') || '';
      const cache = await caches.open(META);
      await cache.put('cw_app_name', new Response(name));
      return new Response('ok', { headers: { 'Content-Type': 'text/plain' } });
    })());
    return;
  }

  if (e.request.method !== 'GET') return;

  // The app page itself: network first, so a new deploy shows up on the next open;
  // falls back to the cached copy when offline.
  const isPage = e.request.mode === 'navigate' || path === BASE + '/' || path === BASE + '/index.html';
  if (isPage) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(BASE + '/index.html', clone));
          }
          return res;
        })
        .catch(() => caches.match(BASE + '/index.html').then(r => r || caches.match(BASE + '/')))
    );
    return;
  }

  // Everything else (fonts etc.): cache first, then network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(BASE + '/index.html'));
    })
  );
});
