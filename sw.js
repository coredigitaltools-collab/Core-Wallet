// Core Wallet — Service Worker v7 (offline caching only)
// Works at the domain root (wallet.coredigitaltools.com) or in a sub-folder (github.io/Core-Wallet/).
// The manifest and icons are real static files (manifest.json, icon-192.png, icon-512.png),
// because Android builds the installed app by downloading them directly, never through this worker.

const CACHE = 'cw-v7';
// Folder this worker controls: '' on the custom domain, '/Core-Wallet' on github.io
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, '');
const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/icon-192.png'
];

// ── Install: cache the app shell (a missing file never blocks installing) ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(ASSETS.map(a => c.add(a).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches (including the old icon-name cache) ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ──
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) {
    // fonts etc.: cache first, then network
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        if (res && (res.status === 200 || res.type === 'opaque')) { const c = res.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); }
        return res;
      }))
    );
    return;
  }
  // Our own files: network first so a new deploy shows on the next open; cached copy when offline
  const isPage = e.request.mode === 'navigate' || url.pathname === BASE + '/' || url.pathname === BASE + '/index.html';
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200) {
          const c = res.clone();
          caches.open(CACHE).then(x => x.put(isPage ? BASE + '/index.html' : e.request, c));
        }
        return res;
      })
      .catch(() => caches.match(isPage ? BASE + '/index.html' : e.request)
        .then(r => r || (isPage ? caches.match(BASE + '/') : undefined))
        .then(r => r || new Response('', { status: 504 })))
  );
});
