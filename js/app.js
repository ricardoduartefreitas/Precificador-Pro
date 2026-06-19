// app.js — PrecificaPRO
// Responsabilidade: entry point da aplicação
// Inicializa módulos, registra service worker e dispara o roteamento inicial

import { initRouter } from './router.js';
import { initFreemium } from './freemium.js';
import { initUI } from './ui.js';

async function boot() {
  // Registra o service worker para PWA/offline
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // Inicializa UI (listeners de tabs, modais, toast)
  initUI();

  // Inicializa controle freemium (lê contador do localStorage)
  initFreemium();

  // Inicia o roteador (lê hash atual e renderiza a view correta)
  initRouter();
}

boot();
