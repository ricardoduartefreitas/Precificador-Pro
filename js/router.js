// router.js — PrecificaPRO
// Responsabilidade: navegação entre as views via window.location.hash + proteção de rotas
// Rotas públicas: #/login
// Rotas protegidas: #/comparar | #/calcular/:platform | #/historico

import { setState } from './state.js';
import { isLoggedIn } from './auth.js';

const VIEWS = {
  login:     document.getElementById('view-login'),
  comparar:  document.getElementById('view-comparar'),
  calcular:  document.getElementById('view-calcular'),
  historico: document.getElementById('view-historico'),
};

const TABS = document.querySelectorAll('.tab-btn');

// Rotas que NÃO requerem autenticação
const PUBLIC_ROUTES = ['login'];

// Rotas que REQUEREM autenticação
const PROTECTED_ROUTES = ['comparar', 'calcular', 'historico'];

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

  // Mostrar/ocultar tabs apenas quando não está em login
  const isLoginView = routeName === 'login';
  const header = document.querySelector('.app-header');
  if (header) {
    header.style.display = isLoginView ? 'none' : 'flex';
  }

  TABS.forEach((btn) => {
    const target = btn.dataset.route;
    btn.classList.toggle('active', target === routeName);
  });
}

function navigate(hash) {
  const { route, param } = parseRoute(hash);

  // Proteção de rotas: se a rota é protegida e usuário não está logado, redireciona para login
  if (PROTECTED_ROUTES.includes(route) && !isLoggedIn()) {
    window.location.hash = '#/login';
    return;
  }

  // Se é login e usuário JÁ está logado, redireciona para calcular
  if (route === 'login' && isLoggedIn()) {
    window.location.hash = '#/calcular';
    return;
  }

  if (route === 'calcular' && param) {
    setState({ activePlatform: param });
  }

  if (VIEWS[route]) {
    showView(route);
  } else {
    // Rota inválida: redireciona para login (se não autenticado) ou calcular (se autenticado)
    const fallback = isLoggedIn() ? 'calcular' : 'login';
    window.location.hash = `#/${fallback}`;
  }
}

export function initRouter() {
  // Navegação pelos botões de tab
  TABS.forEach((btn) => {
    btn.addEventListener('click', () => {
      const route = btn.dataset.route;
      window.location.hash = `#/${route}`;
    });
  });

  // Escuta mudanças de hash (botão voltar / links internos)
  window.addEventListener('hashchange', () => navigate(window.location.hash));

  // Renderiza a view correta no carregamento inicial
  // Nota: Se não autenticado, navigate() redirecionará para login automaticamente
  const initialHash = window.location.hash || (isLoggedIn() ? '#/calcular' : '#/login');
  navigate(initialHash);
}

export function goTo(route, param = null) {
  const hash = param ? `/${route}/${param}` : `/${route}`;
  window.location.hash = hash;
}
