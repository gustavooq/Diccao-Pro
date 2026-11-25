const CACHE_NAME = 'diccao-pro-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/custom.css',
  './js/conteudo.js',
  './js/app.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

// Instalação do Service Worker e Cache dos arquivos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de Fetch: Stale-While-Revalidate (carrega do cache e atualiza em segundo plano)
self.addEventListener('fetch', (event) => {
  // Ignora requisições de áudios externos ou outras origens que não sejam GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Se estiver offline e sem cache
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
