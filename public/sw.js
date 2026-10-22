/* Service worker : permet de relire règles, programme et infos de la maison hors ligne.
   Les tirages partagés nécessitent le réseau (sinon tirage local avec avertissement). */
const VERSION = 'sogne-v1';
const SHELL = ['/', '/style.css', '/app.js', '/engine.js', '/rules.js', '/cards.json', '/manifest.webmanifest',
  '/fonts/rozha-one-latin-400-normal.woff2', '/fonts/abril-fatface-latin-400-normal.woff2', '/fonts/mrs-saint-delafield-latin-400-normal.woff2',
  '/fonts/inter-latin-400-normal.woff2', '/fonts/inter-latin-500-normal.woff2', '/fonts/inter-latin-600-normal.woff2', '/fonts/inter-latin-700-normal.woff2',
  '/img/emb_defi.webp', '/img/emb_verite.webp', '/img/emb_duel.webp', '/img/emb_gage.webp', '/img/emb_sonia.webp', '/img/sogne.webp'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/') || u.pathname.startsWith('/admin')) return;
  const staticAsset = /\.(woff2|webp|png)$/.test(u.pathname);
  if (staticAsset) {
    e.respondWith(caches.match(e.request).then((m) => m || fetch(e.request).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, cp)); return r; })));
    return;
  }
  // réseau d'abord (contenu toujours à jour), cache en secours
  e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then((m) => m || caches.match('/'))));
});
