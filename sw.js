// Service Worker — PrecificaPRO
// Responsabilidade: cache offline dos assets estáticos (Cache First)
// Atualizar APP_SHELL ao adicionar novos arquivos ao projeto

const CACHE_NAME = 'precificapro-v1';

const APP_SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/state.js',
  './js/router.js',
  './js/storage.js',
  './js/calculator.js',
  './js/ui.js',
  './js/formatter.js',
  './js/freemium.js',
  './platforms/mercadolivre.js',
  './platforms/shopee.js',
  './platforms/amazon.js',
  './platforms/tiktok.js',
  './platforms/shein.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return Response.error();
      });
    })
  );
});
