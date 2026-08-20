/**
 * Service Worker - Clean Energy (Biomassa Hub)
 * ---------------------------------------------
 * Estratégias:
 *  - App shell (offline.html, manifest, ícones, CSS/JS core) -> pré-cache no install
 *  - Navegação (HTML)               -> Network First, fallback para cache e depois offline.html
 *  - Estáticos same-origin (css/js/imagem/fontes) -> Cache First com atualização em segundo plano
 *  - Recursos de terceiros (CDNs: boxicons, google fonts, bootstrap, fontawesome) -> Stale While Revalidate
 *  - Requisições não-GET (POST/PUT/DELETE, ex: login, formularios) -> sempre vão direto para a rede
 *
 * A versão do cache deve ser incrementada sempre que os arquivos pré-cacheados mudarem,
 * para forçar a atualização dos clients.
 */

const SW_VERSION = 'v2';
const STATIC_CACHE = `clean-energy-static-${SW_VERSION}`;
const RUNTIME_CACHE = `clean-energy-runtime-${SW_VERSION}`;
const CDN_CACHE = `clean-energy-cdn-${SW_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Arquivos essenciais para o app funcionar minimamente offline.
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

// ── INSTALL ──────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((err) => console.warn('[SW] Falha ao pré-cachear app shell:', err))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────────────
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

// ── HELPERS ──────────────────────────────────────────────────────────
function isCdnRequest(url) {
  return [
    'unpkg.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com'
  ].some((host) => url.hostname.includes(host));
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
    // Atualiza em segundo plano (stale revalidate) sem bloquear a resposta.
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

// ── FETCH ────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Nunca interceptar métodos que não são GET (login, formulários, checkout, etc).
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Nunca cachear rotas administrativas ou de autenticação: sempre rede.
  if (url.pathname.startsWith('/adm') || url.pathname === '/logout') {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Navegação entre páginas (documentos HTML) -> network first.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // CDNs de terceiros (ícones, fontes, css de frameworks) -> stale-while-revalidate.
  if (isCdnRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, CDN_CACHE));
    return;
  }

  // Estáticos do próprio site -> cache first.
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Qualquer outra requisição GET (ex: chamadas de dados) -> network first com fallback de cache.
  event.respondWith(networkFirst(request));
});

// ── MENSAGENS DO CLIENT (ex: forçar atualização) ────────────────────
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
