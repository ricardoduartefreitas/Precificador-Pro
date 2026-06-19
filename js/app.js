// app.js — PrecificaPRO
// Entry point: importa plataformas, inicializa módulos e define rota padrão

import { initRouter }           from './router.js';
import { initFreemium }         from './freemium.js';
import { initUI }               from './ui.js';
import { getInputs, setState }  from './state.js';

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

  // Define rota padrão (calcular) antes de iniciar o router
  if (!window.location.hash || window.location.hash === '#') {
    window.location.hash = '/calcular';
  }

  initUI(PLATAFORMAS);
  initFreemium();
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
