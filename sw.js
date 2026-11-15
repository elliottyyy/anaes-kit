/* Anaes Kit service worker — offline app shell. Bump VERSION on every deploy. */
const VERSION = 'ak-20261111101012';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch GitHub API calls
  // Stale-while-revalidate: instant offline load, refresh cache in background
  e.respondWith(caches.open(VERSION).then(async cache => {
    const cached = await cache.match(req, {ignoreSearch: true}) || (req.mode === 'navigate' ? await cache.match('./index.html') : null);
    const net = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    return cached || (await net) || new Response('Offline', {status: 503});
  }));
});
