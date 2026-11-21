// Guarda el juego en el dispositivo para que la app abra aunque no haya página o internet.
// Archivos del juego: primero intenta la red (para recibir actualizaciones) y si no hay, usa la copia guardada.
// Archivos de fuera (PeerJS, letra): usa la copia guardada y la renueva en segundo plano.
const CACHE = 'medianoche-v6';
const CORE = ['./', './index.html', './game.js?v=6', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
const EXTRA = ['https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await c.addAll(CORE);
    await Promise.all(EXTRA.map(u => fetch(u, { mode: 'cors' }).then(r => r.ok && c.put(u, r)).catch(() => { })));
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; })
        .catch(() => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(r => r || caches.match('./')))
    );
  } else if (/unpkg\.com|fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
