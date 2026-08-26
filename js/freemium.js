// freemium.js — PrecificaPRO
// Responsabilidade: controle do plano free/pro
// Free: 30 cálculos gratuitos. PRO: desbloqueado via SHA-256 de senha

import { storageGet, storageSet } from './storage.js';
import { updatePlanBadge, openOverlayPro, showToast } from './ui.js';

const KEY_COUNT = 'u';   // contador de cálculos (prefixado por storage.js → _psp_u)
const KEY_HASH  = 'h';   // hash da senha PRO (_psp_h)
const FREE_LIMIT = 30; // 30 cálculos gratuitos
const WARN_AT    = 25; // avisa perto do limite

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

export function getUsageCount() {
  return storageGet(KEY_COUNT, 0);
}

export function canCalculate() {
  if (_checkPro()) return true;
  return getUsageCount() < FREE_LIMIT;
}

// ---------- REGISTRAR CÁLCULO ----------

export function registerCalculo() {
  if (_checkPro()) return;

  const count = getUsageCount() + 1;
  storageSet(KEY_COUNT, count);

  if (count === WARN_AT) {
    showToast(`Você usou ${count} de ${FREE_LIMIT} cálculos gratuitos`, '');
  }

  if (count >= FREE_LIMIT) {
    showUpgradeOverlay();
  }
}

// ---------- OVERLAY DE UPGRADE ----------

export function showUpgradeOverlay() {
  openOverlayPro();
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
