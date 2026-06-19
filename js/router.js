// router.js — PrecificaPRO
// Responsabilidade: navegação entre as 3 views via window.location.hash
// Rotas: #/comparar | #/calcular/:platform | #/historico

import { setState } from './state.js';

const VIEWS = {
  comparar:  document.getElementById('view-comparar'),
  calcular:  document.getElementById('view-calcular'),
  historico: document.getElementById('view-historico'),
};

const TABS = document.querySelectorAll('.tab-btn');

function parseRoute(hash) {
  const clean = (hash || '').replace(/^#\//, '');
  const [route, param] = clean.split('/');
  return { route: route || 'comparar', param: param || null };
}

function showView(routeName) {
  Object.entries(VIEWS).forEach(([name, el]) => {
    if (!el) return;
    el.classList.toggle('hidden', name !== routeName);
  });

  TABS.forEach((btn) => {
    const target = btn.dataset.route;
    btn.classList.toggle('active', target === routeName);
  });
}

function navigate(hash) {
  const { route, param } = parseRoute(hash);

  if (route === 'calcular' && param) {
    setState({ activePlatform: param });
  }

  if (VIEWS[route]) {
    showView(route);
  } else {
    showView('comparar');
  }
}

export function initRouter() {
  // Navegação pelos botões de tab
  TABS.forEach((btn) => {
    btn.addEventListener('click', () => {
      const route = btn.dataset.route;
      window.location.hash = `/${route}`;
    });
  });

  // Escuta mudanças de hash (botão voltar / links internos)
  window.addEventListener('hashchange', () => navigate(window.location.hash));

  // Renderiza a view correta no carregamento inicial
  navigate(window.location.hash || '#/comparar');
}

export function goTo(route, param = null) {
  const hash = param ? `/${route}/${param}` : `/${route}`;
  window.location.hash = hash;
}
