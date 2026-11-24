const SW_VERSION = 'v3';
const STATIC_CACHE = `clean-energy-static-${SW_VERSION}`;
const RUNTIME_CACHE = `clean-energy-runtime-${SW_VERSION}`;
const CDN_CACHE = `clean-energy-cdn-${SW_VERSION}`;
const OFFLINE_URL = '/offline.html';

const APP_SHELL = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/css/header.css',
  '/css/footer.css',
  '/css/darkmode.css',
  '/js/script.js',
  '/js/pwa.js',
  '/js/darkmode.js',
  '/imagem/logo-curva.svg',
  '/imagem/icon-192.png',
  '/imagem/icon-512.png',
  '/imagem/favicon-32.png'
];

const ALL_CACHES = [STATIC_CACHE, RUNTIME_CACHE, CDN_CACHE];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((err) => console.warn('[SW] Falha ao pré-cachear app shell:', err))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => !ALL_CACHES.includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isCdnRequest(url) {
  return [
    'unpkg.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com'
  ].some((host) => url.hostname.includes(host));
}

function isCodeAsset(url) {
  return url.origin === self.location.origin && (
    url.pathname.startsWith('/css/') ||
    url.pathname.startsWith('/js/')
  );
}

function isStaticAsset(url) {
  return url.origin === self.location.origin && (
    url.pathname.startsWith('/css/') ||
    url.pathname.startsWith('/js/') ||
    url.pathname.startsWith('/imagem/') ||
    url.pathname === '/manifest.json'
  );
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    fetch(request).then((response) => {
      if (response && response.ok) {
        caches.open(cacheName).then((cache) => cache.put(request, response));
      }
    }).catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    if (request.mode === 'navigate') {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cached);
  return cached || networkPromise;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.pathname.startsWith('/adm') || url.pathname === '/logout') {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isCdnRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, CDN_CACHE));
    return;
  }

  if (isCodeAsset(url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  event.respondWith(networkFirst(request));
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
