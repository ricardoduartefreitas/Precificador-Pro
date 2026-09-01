// Service Worker — PrecificaPRO
// Responsabilidade: cache offline dos assets estáticos (Stale-While-Revalidate — o psp-v6!)
// Atualizar APP_SHELL ao adicionar novos arquivos ao projeto

const CACHE_NAME = 'psp-v21';

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
  './js/history.js',
  './js/lote.js',
  './js/produtos.js',
  './js/inteligencia.js',
  './js/onboarding.js',
  './js/ui-login.js',
  './js/ui-invite-accept.js',
  './js/admin.js',
  './js/auth.js',
  './js/supabase.js',
  './js/ruah-ad.js',
  './platforms/mercadolivre.js',
  './platforms/shopee.js',
  './platforms/amazon.js',
  './platforms/tiktok.js',
  './platforms/shein.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
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

  // NAVIGATION: Network First — a página sempre busca a versão NOVA (o fix do cache teimoso!)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // FIX (22/08 — Fase 2): NUNCA cachear requisições cross-origin (API do Supabase)!
  // O SWR abaixo servia respostas VELHAS da API (ex: lista de produtos) na hora,
  // fazendo "Salvar produto" parecer que não persistiu — só atualizava na navegação seguinte.
  // API sempre passa direto pra rede, sem cache — só os assets do app shell usam SWR.
  if (new URL(event.request.url).origin !== self.location.origin) {
    return;
  }

  // Assets: Stale-While-Revalidate (o fix 17/08 — o fim da "tela antiga"!)
  // Serve o cache NA HORA (rápido) e atualiza em background — o asset NOVO
  // chega sozinho na próxima carga, SEM depender de Ctrl+Shift+R ou bump manual!
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached || Response.error());
      return cached || networkFetch;
    })
  );
});
