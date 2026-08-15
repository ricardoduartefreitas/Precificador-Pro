// app.js — PrecificaPRO
// Entry point: importa plataformas, inicializa módulos e define rota padrão

import { initRouter }           from './router.js';
import { initFreemium }         from './freemium.js';
import { initUI }               from './ui.js';
import { initAdminPanel }       from './admin.js';
import { getInputs, setState }  from './state.js';
import { initSupabase }         from './supabase.js';
import { initAuth, onAuthChange, isAdmin } from './auth.js';
import { initLoginUI, addLogoutButton } from './ui-login.js';
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
  await initAuth();

  // 3️⃣ Escutar mudanças de autenticação
  let isUIInitialized = false;
  onAuthChange((auth) => {
    if (auth.session) {
      // Usuário logou: inicializar UI
      if (!isUIInitialized) {
        initUI(PLATAFORMAS);
        initFreemium();
        initAdminPanel();
        addLogoutButton();
        isUIInitialized = true;
      }

      // Mostrar/ocultar tab de admin baseado na role
      const adminTabBtn = document.querySelector('.tab-btn.admin-only');
      if (adminTabBtn) {
        if (isAdmin()) {
          adminTabBtn.style.display = 'block';
        } else {
          adminTabBtn.style.display = 'none';
        }
      }
    } else {
      // Usuário fez logout: inicializar login UI e redirecionar
      initLoginUI();
      initInviteAcceptUI();
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
  initRouter();

  // Atualiza document.title conforme a view ativa
  const VIEW_TITLES = {
    calcular:  'Calcular — PrecificaPRO',
    comparar:  'Comparar — PrecificaPRO',
    historico: 'Histórico — PrecificaPRO',
  };
  function syncTitle() {
    const route = (window.location.hash || '').replace(/^#\//, '').split('/')[0] || 'calcular';
    document.title = VIEW_TITLES[route] || 'PrecificaPRO';
  }
  window.addEventListener('hashchange', syncTitle);
  syncTitle();
}

boot();
