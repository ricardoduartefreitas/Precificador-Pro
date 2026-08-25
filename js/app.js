// app.js — PrecificaPRO
// Entry point: importa plataformas, inicializa módulos e define rota padrão

import { initRouter }           from './router.js';
import { initFreemium }         from './freemium.js';
import { initUI }               from './ui.js';
import { initProdutos }         from './produtos.js';
import { initAdminPanel }       from './admin.js';
import { initInteligencia }     from './inteligencia.js';
import { initOnboarding }       from './onboarding.js';
import { getInputs, setState }  from './state.js';
import { initSupabase }         from './supabase.js';
import { initAuth, onAuthChange, isAdmin, isLoggedIn } from './auth.js';
import { initLoginUI, addLogoutButton, initResetPasswordUI } from './ui-login.js';
import { checkInviteLink, initInviteAcceptUI } from './ui-invite-accept.js';

import ML     from '../platforms/mercadolivre.js';
import Shopee from '../platforms/shopee.js';
import Amazon from '../platforms/amazon.js';
import TikTok from '../platforms/tiktok.js';
import Shein  from '../platforms/shein.js';

export const PLATAFORMAS = [ML, Shopee, Amazon, TikTok, Shein];

async function boot() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // 0️⃣ FIX (16/08): o router NO TOPO do boot — a tela aparece IMEDIATAMENTE, SEMPRE!
  // (o initSupabase/initAuth podem falhar ou travar — o router NÃO pode depender deles!)
  initRouter();

  // 0.1️⃣ FIX (16/08): a GARANTIA FINAL — a view-login aparece SEMPRE (SEM condição!)
  // (o isLoggedIn pode vir true com sessão stale — o remove SEMPRE, o auth depois redireciona se logado!)
  const loginView = document.getElementById('view-login');
  if (loginView) loginView.classList.remove('hidden');

  // Garante que imposto e desconto existam no estado
  const inputs = getInputs();
  if (inputs.imposto === undefined) {
    setState({ inputs: { ...inputs, imposto: 0, desconto: 0 } });
  }

  // 1️⃣ Inicializar Supabase
  await initSupabase();

  // 1.5️⃣ Verificar se há link de convite na URL e redirecionar
  checkInviteLink();

  // 2️⃣ Inicializar autenticação (verifica sessão existente)
  // FIX (16/08): o try/catch — se o Supabase falhar (rate limit/offline), o router AINDA roda e a tela do login aparece!
  try {
    await initAuth();
  } catch (e) {
    console.error('⚠️ initAuth falhou (o router segue):', e);
  }

  // 3️⃣ Escutar mudanças de autenticação
  let isUIInitialized = false;
  onAuthChange((event, auth) => {
    // FIX (17/08): RECUPERAÇÃO DE SENHA — o link do email foi processado!
    // mostra a tela de nova senha (#/recuperar-senha) em vez de seguir o fluxo normal
    if (event === 'PASSWORD_RECOVERY') {
      initResetPasswordUI();
      window.location.hash = '#/recuperar-senha';
      return;
    }

    if (auth.session) {
      // Usuário logou: inicializar UI
      if (!isUIInitialized) {
        initUI(PLATAFORMAS);
        initProdutos(PLATAFORMAS);
        initFreemium();
        initAdminPanel();
        initInteligencia(PLATAFORMAS);
        initOnboarding(); // ESCOPO 1 (25/08): wizard de cadastro estendido
        addLogoutButton();
        isUIInitialized = true;
      }

      // FIX (17/08): após login/sessão, ir para a CALCULADORA!
      // (o ui-login dizia 'o auth listener vai redirecionar' — mas ninguém redirecionava:
      //  o login entrava, o log saía 'Login bem-sucedido', e a tela ficava presa no
      //  login com o botão 'Entrando...' para sempre!)
      const rotaAtual = (window.location.hash || '').replace(/^#\//, '').split('?')[0];
      if (!rotaAtual || rotaAtual === 'login') {
        window.location.hash = '#/calcular';
      }

      // Mostrar/ocultar tabs de admin baseado na role
      // FIX (FASE 3): antes era querySelector (SINGULAR) — só a 1ª tab admin-only
      // ('Inteligência') era alternada; a 2ª ('Painel Admin') ficava sempre escondida.
      // Agora percorre TODAS as tabs com a classe admin-only.
      document.querySelectorAll('.tab-btn.admin-only').forEach((btn) => {
        btn.style.display = isAdmin() ? 'block' : 'none';
      });
    } else {
      // Usuário fez logout: inicializar login UI e redirecionar
      initLoginUI();
      initInviteAcceptUI();
      initResetPasswordUI();
      // NÃO sobrescrever o aceite do convite: se o hash é o aceitar-convite,
      // o fluxo do aceite (nome + senha) é a prioridade — preservar!
      const rotaAtual = (window.location.hash || '').replace(/^#\//, '').split('?')[0];
      if (rotaAtual !== 'aceitar-convite') {
        window.location.hash = '#/login';
      }
    }
  });

  // 3.5️⃣ Inicializar router SEMPRE (mesmo sem sessão) para gerenciar navegação por hash
  // FIX: Anteriormente, initRouter() só era chamado se havia uma sessão,
  // causando que o aceitar-convite não fosse renderizado em navegadores limpos.
  // Agora é chamado SEMPRE para garantir que o sistema de rotas funciona corretamente.
  // Atualiza document.title conforme a view ativa
  const VIEW_TITLES = {
    calcular:  'Calcular — PrecificaPRO',
    comparar:  'Comparar — PrecificaPRO',
    produtos:  'Meus Produtos — PrecificaPRO',
    historico: 'Histórico — PrecificaPRO',
    inteligencia: 'Inteligência — PrecificaPRO',
    onboarding: 'Complete seu cadastro — PrecificaPRO',
  };
  function syncTitle() {
    const route = (window.location.hash || '').replace(/^#\//, '').split('/')[0] || 'calcular';
    document.title = VIEW_TITLES[route] || 'PrecificaPRO';
  }
  window.addEventListener('hashchange', syncTitle);
  syncTitle();
}

boot();
