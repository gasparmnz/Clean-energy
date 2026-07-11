const CACHE_NAME = 'clean-energy-v1';
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  '/manifest.json',
  '/imagem/icon-192.png',
  '/imagem/icon-512.png',
  '/imagem/logo-curva.svg',
  OFFLINE_URL
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Só cuida de GET; POST/PUT/DELETE (login, cadastro, carrinho, compras) sempre vão direto à rede
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegação de páginas (HTML): tenta rede primeiro, cai pra cache/offline se falhar
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
      )
    );
    return;
  }

  // Assets estáticos (css/js/imagens): cache-first, com atualização em segundo plano
  if (/\.(css|js|png|jpg|jpeg|svg|webp|gif|ico)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse.clone()));
          return networkResponse;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
