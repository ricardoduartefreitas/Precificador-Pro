// freemium.js — PrecificaPRO
// Responsabilidade: controle do plano free/pro
// Free: 30 cálculos gratuitos. PRO: desbloqueado via SHA-256 de senha

import { storageGet, storageSet } from './storage.js';
import { updatePlanBadge, openOverlayPro, showToast } from './ui.js';

const KEY_COUNT = 'u';   // contador de cálculos (prefixado por storage.js → _psp_u)
const KEY_HASH  = 'h';   // hash da senha PRO (_psp_h)
const FREE_LIMIT = 30;
const WARN_AT    = 25;

// Hashes SHA-256 válidos para ativação PRO (adicionar senhas via config)
// Para gerar: crypto.subtle.digest('SHA-256', encoder.encode(senha))
const PRO_HASHES = [
  // Exemplo: hash de 'precifica2026pro' — substituir pelas senhas reais em produção
  // '...'
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
