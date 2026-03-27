const CACHE_NAME = 'onbible-cache-v2';

// Recursos críticos para a primeira inicialização offline
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './book.html',
  './player.html',
  './bible_play.html',
  './manifest.json',
  
  // Imagens essenciais
  './assets/images/logo.png',
  './assets/images/favicon.png',
  
  // Scripts
  './assets/libs/dexie.min.js',
  './js/db.js',
  './js/main.js',
  './js/book.js',
  './js/index.js',
  './js/jquery-3.2.1.min.js',
  
  // Estilos
  './assets/css/bootstrap.min.css',
  './assets/css/app.min.css',
  './assets/css/icons.min.css',
  
  // Dados de Sistema 
  './db/books/json/index.json',
  './db/imgs/index.json',
  
  // Tradução padrão exigida para uso imediato Offline
  './db/books/json/pt_acf.json'
];

self.addEventListener('install', (event) => {
    // Força a instalação imediata do novo Service Worker
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching Core Assets');
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    // Permite que o SW recém instalado assuma o controle imediato
    event.waitUntil(self.clients.claim());
    // Limpar caches antigos
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Clearing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Stale-While-Revalidate Strategy para Interceptação de Dados
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Usa o cache instantaneamente (se existir) na requisição
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // E também tenta buscar do servidor e atualiza o cache silenciosamente (se a rede funcionar)
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            }).catch(() => {
                // Caso falhe na rede, o fallback já provê o que tem no cache (PWA Offline First real)
                console.log('[SW] Network error. Serving from cache only.');
            });

            // Retorna o cache se houver, ou espera a promessa da rede
            return cachedResponse || fetchPromise;
        })
    );
});
