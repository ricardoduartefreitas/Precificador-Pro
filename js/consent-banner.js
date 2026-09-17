// consent-banner.js — PrecificaPRO
// LGPD (17/09/2026): consentimento para quem JÁ tinha cadastro antes da Política de Privacidade.
//
// Contexto: o aceite explícito passou a ser coletado no passo 3 do cadastro (js/onboarding.js).
// Quem completou o onboarding ANTES desta data não tem registro de consentimento — este banner
// pede o aceite uma vez, no primeiro acesso após o login, e grava consentimento_aceito/em/versao
// no perfil (mesmos campos do onboarding).
//
// Regras: só aparece para quem tem onboarding completo e ainda sem aceite; fica visível até o
// aceite; NUNCA bloqueia o uso do app. Isolado e defensivo — qualquer falha é silenciosa
// (try/catch em todas as chamadas) para não quebrar o boot do app.

import { getCurrentUserId } from './auth.js';
import { getProfile, updateUserProfile } from './supabase.js';
import { LGPD_VERSAO } from './onboarding.js';
import { showToast } from './ui.js';

const BANNER_ID = 'lgpd-consent-banner';
let _running = false;

export async function initConsentBanner() {
  if (_running) return;
  _running = true;

  try {
    const userId = getCurrentUserId();
    if (!userId) return;

    const perfil = await getProfile(userId);
    if (!perfil) return;                                  // sem perfil = onboarding ainda vai rodar
    if (perfil.consentimento_aceito) return;               // já aceitou — nada a fazer
    if (!perfil.onboarding_completo) return;               // cadastro incompleto = o wizard coleta o aceite
    if (document.getElementById(BANNER_ID)) return;        // já está na tela

    _render(userId);
  } catch (err) {
    console.warn('⚠️ Banner de consentimento (LGPD) não pôde ser exibido:', err?.message || err);
  }
}

function _render(userId) {
  const el = document.createElement('div');
  el.id = BANNER_ID;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Consentimento da Política de Privacidade');
  el.style.cssText = [
    'position:fixed', 'left:0', 'right:0', 'bottom:0', 'z-index:9999',
    'background:var(--bg-card,#0f1a2e)',
    'border-top:1px solid var(--border,#1e2d47)',
    'box-shadow:0 -6px 24px rgba(0,0,0,.45)',
    'padding:1rem 1.15rem', 'display:flex', 'flex-wrap:wrap', 'gap:.75rem 1.25rem',
    'align-items:center', 'justify-content:center', 'text-align:left',
  ].join(';');

  el.innerHTML = `
    <p style="margin:0;max-width:680px;color:var(--text-secondary,#8899bb);font-size:.9rem;line-height:1.5;">
      <strong style="color:var(--text-primary,#f0f4ff);">Autorizo o contato da Ruah Tecnologia</strong>
      e concordo com a
      <a href="privacidade.html" target="_blank" rel="noopener"
         style="color:var(--accent-gold,#D4AF37);font-weight:600;">Política de Privacidade</a>.
    </p>
    <button id="${BANNER_ID}-aceitar" class="btn btn--primary" type="button">Aceitar e continuar</button>
  `;

  document.body.appendChild(el);

  document.getElementById(`${BANNER_ID}-aceitar`)?.addEventListener('click', async (ev) => {
    const btn = ev.currentTarget;
    btn.disabled = true;
    btn.textContent = 'Salvando...';
    try {
      await updateUserProfile(userId, {
        consentimento_aceito: true,
        consentimento_em: new Date().toISOString(),
        consentimento_versao: LGPD_VERSAO,
      });
      el.remove();
      showToast('✅ Consentimento registrado. Obrigado!', 'success');
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Aceitar e continuar';
      showToast('Não foi possível registrar o consentimento. Tente novamente.', 'error');
      console.warn('⚠️ Falha ao registrar consentimento (LGPD):', err?.message || err);
    }
  });
}
