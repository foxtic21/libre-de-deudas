// Libre · service worker: guarda la app en el dispositivo para que abra y funcione sin internet.
// Los datos sin conexión los maneja Firestore (caché local + cola de escrituras que se suben al volver).
const VERSION = 'libre-2.8.0';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './config.js?v=2.8.0', './assets/styles.css?v=2.8.0', './assets/app.js?v=2.8.0', './assets/store.js?v=2.8.0',
  './assets/icon.svg', './assets/icon-180.png', './assets/icon-512.png'
];
const FIREBASE = ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'].map(f => 'https://www.gstatic.com/firebasejs/10.12.2/' + f);

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(SHELL);
    await Promise.all(FIREBASE.map(u => fetch(u, { mode: 'cors' }).then(r => r.ok && c.put(u, r)).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('libre-') && k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Firestore y el login van directo a la red (Firestore ya trabaja sin conexión por su cuenta)
  if (/firestore|identitytoolkit|securetoken|googleapis\.com$/.test(url.hostname) && !url.hostname.startsWith('fonts.')) return;

  // Abrir la app: primero la red (para tener siempre la última versión); sin internet, la copia guardada
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy));
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }

  // Archivos de la app, Firebase y la tipografía: la copia guardada y, si no está, la red (y se guarda)
  const ok = url.origin === self.location.origin || url.hostname === 'www.gstatic.com' || url.hostname.startsWith('fonts.');
  if (!ok) return;
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  })));
});
