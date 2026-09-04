// freemium.js — PrecificaPRO
// Responsabilidade: controle do plano free/pro
// Decisão do dono (03/09/2026): uso LIBERADO — sem limite de cálculos, sem overlay/CTA
// de upgrade. A única barreira do app é cadastro/login (auth.js). Este módulo fica
// inerte (canCalculate sempre true, registerCalculo no-op) — ver BRIEFING_LIBERAR_USO.

import { storageGet, storageSet } from './storage.js';
import { updatePlanBadge, showToast } from './ui.js';

const KEY_HASH  = 'h';   // hash da senha PRO (_psp_h) — mecanismo mantido inerte

// Hashes SHA-256 válidos para ativação PRO (adicionar senhas via config)
// Para gerar: crypto.subtle.digest('SHA-256', encoder.encode(senha))
const PRO_HASHES = [
  '8b3246735f015e4beb553e388f0ae1b4fb54b8bbd546cc40b448835445afb079',
  'd4a1c7ee5d0d83ff62c579c4c8b643b2cc7b467a38503c79aeedee27f53f0d3e',
  'd6f8d408171fdae20d9f8f66972ba3a1e9d8bfe0b4d6c77b1c8881b801962b3f',
];

// ---------- INICIALIZAÇÃO ----------

export function initFreemium() {
  const isPro = _checkPro();
  updatePlanBadge(isPro);

  if (!isPro) {
    _bindProActivation();
  }
}

// ---------- VERIFICAÇÃO ----------

export function isPro() {
  return _checkPro();
}

export function canCalculate() {
  return true; // uso liberado — cadastro/login já é a única barreira
}

// ---------- REGISTRAR CÁLCULO ----------

export function registerCalculo() {
  // no-op — uso liberado, não há mais contagem/limite nem overlay de upgrade
}

// ---------- ATIVAÇÃO PRO ----------

function _bindProActivation() {
  const btn = document.getElementById('btn-ativar-pro');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const input = document.getElementById('pro-senha');
    const senha = input?.value?.trim();
    if (!senha) return;

    const hash = await _sha256(senha);
    if (PRO_HASHES.includes(hash)) {
      storageSet(KEY_HASH, hash);
      updatePlanBadge(true);
      document.getElementById('overlay-pro')?.classList.add('hidden');
      showToast('Plano PRO ativado!', 'success');
    } else {
      showToast('Senha inválida', 'error');
    }
  });
}

function _checkPro() {
  const saved = storageGet(KEY_HASH, null);
  return saved !== null && PRO_HASHES.includes(saved);
}

async function _sha256(text) {
  const encoder = new TextEncoder();
  const data    = encoder.encode(text);
  const buffer  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
