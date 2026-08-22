// router.js — PrecificaPRO
// Responsabilidade: navegação entre as views via window.location.hash + proteção de rotas
// Rotas públicas: #/login
// Rotas protegidas: #/comparar | #/calcular/:platform | #/historico

import { setState } from './state.js';
import { isLoggedIn, isAdmin } from './auth.js';

// FIX (16/08): os VIEWS são buscados SEMPRE (getViews()) — antes eram avaliados na carga do módulo
// e podiam virar null se o DOM não estivesse pronto → o showView não mostrava a tela (a tela vazia!)
function getViews() {
  return {
    login:              document.getElementById('view-login'),
    'aceitar-convite':  document.getElementById('view-login'), // Mesma view, diferente card
    'recuperar-senha':  document.getElementById('view-login'), // FIX (17/08): mesma view, card de nova senha
    comparar:           document.getElementById('view-comparar'),
    calcular:           document.getElementById('view-calcular'),
    produtos:           document.getElementById('view-produtos'),
    'admin-panel':      document.getElementById('view-admin-panel'),
    historico:          document.getElementById('view-historico'),
  };
}

const TABS = document.querySelectorAll('.tab-btn');

// Rotas que NÃO requerem autenticação
const PUBLIC_ROUTES = ['login', 'aceitar-convite', 'recuperar-senha'];

// Rotas que REQUEREM autenticação
const PROTECTED_ROUTES = ['comparar', 'calcular', 'produtos', 'historico'];

function parseRoute(hash) {
  const clean = (hash || '').replace(/^#\//, '');
  const [routeRaw, param] = clean.split('/');
  // O hash pode trazer o query (ex.: aceitar-convite?token=...) — limpar!
  const route = (routeRaw || '').split('?')[0];
  return { route: route || 'comparar', param: param || null };
}

function showView(routeName) {
  const VIEWS = getViews();
  // FIX (17/08): 'login' e 'aceitar-convite' são a MESMA view (#view-login)!
  // O forEach antigo processava a view-login 2× — o 'aceitar-convite' re-adicionava
  // o hidden que o 'login' tinha acabado de remover → a 1ª visita SEMPRE escondia
  // a tela de login (e o reload funcionava só porque o hash já era #/login)!
  // ('recuperar-senha' também é a view-login — o card de nova senha!)
  const isLoginRoute = routeName === 'login' || routeName === 'aceitar-convite' || routeName === 'recuperar-senha';
  Object.entries(VIEWS).forEach(([name, el]) => {
    if (!el) return;
    const isLoginView = name === 'login' || name === 'aceitar-convite' || name === 'recuperar-senha';
    el.classList.toggle('hidden', isLoginRoute ? !isLoginView : name !== routeName);
  });

  // Mostrar/ocultar cards dentro da view-login (login vs aceitar-convite vs nova senha)
  if (routeName === 'login' || routeName === 'aceitar-convite' || routeName === 'recuperar-senha') {
    const loginFormCard = document.getElementById('login-form-card');
    const inviteAcceptCard = document.getElementById('invite-accept-card');
    const resetPasswordCard = document.getElementById('reset-password-card');

    if (loginFormCard) loginFormCard.style.display = routeName === 'login' ? 'block' : 'none';
    if (inviteAcceptCard) inviteAcceptCard.style.display = routeName === 'aceitar-convite' ? 'block' : 'none';
    if (resetPasswordCard) resetPasswordCard.style.display = routeName === 'recuperar-senha' ? 'block' : 'none';
  }

  // Mostrar/ocultar tabs apenas quando não está em login
  const isLoginView = routeName === 'login' || routeName === 'aceitar-convite' || routeName === 'recuperar-senha';
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

  // Se é admin-panel e usuário não é admin, redireciona para calcular
  if (route === 'admin-panel' && !isAdmin()) {
    window.location.hash = '#/calcular';
    return;
  }

  // Se é login e usuário JÁ está logado, redireciona para calcular
  // (o aceitar-convite NUNCA redireciona — o aceite do convite é SEMPRE mostrado,
  //  mesmo com uma sessão existente — o token do convite é a prioridade!)
  if (route === 'login' && isLoggedIn()) {
    window.location.hash = '#/calcular';
    return;
  }

  if (route === 'calcular' && param) {
    setState({ activePlatform: param });
  }

  const VIEWS = getViews();
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
