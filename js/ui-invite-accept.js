// ui-invite-accept.js — PrecificaPRO
// Responsabilidade: gerenciar interface de aceite de convite

import { updateUserProfile, getSupabase } from './supabase.js';
import { showToast } from './ui.js';

let _inviteState = {
  token_hash: null,
  email: null,
  nome: null,
};

/**
 * Extrair token e parâmetros da URL
 * Formato esperado do Supabase: #/auth/callback?token_hash=...&type=invite
 * Vamos redirecionar para #/aceitar-convite?token=...&email=...&nome=...
 */
export function checkInviteLink() {
  const params = new URLSearchParams(window.location.search);
  const token_hash = params.get('token_hash') || params.get('token');
  const type = params.get('type');

  if (token_hash && type === 'invite') {
    _inviteState.token_hash = token_hash;
    _inviteState.email = params.get('email') || '';
    _inviteState.nome = params.get('nome') || '';

    // Redirecionar para a view de aceite com os parâmetros
    window.location.hash = `#/aceitar-convite?token=${encodeURIComponent(token_hash)}&email=${encodeURIComponent(_inviteState.email)}&nome=${encodeURIComponent(_inviteState.nome)}`;
    return true;
  }

  // Se está na view de aceite, extrair parâmetros da hash
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
  const hashToken = hashParams.get('token');

  if (hashToken) {
    _inviteState.token_hash = hashToken;
    _inviteState.email = hashParams.get('email') || '';
    _inviteState.nome = hashParams.get('nome') || '';
    return true;
  }

  return false;
}

export function initInviteAcceptUI() {
  // Verificar se há token de convite
  if (!_inviteState.token_hash) {
    return;
  }

  const btnAceitar = document.getElementById('btn-aceitar-convite');
  const passwordInput = document.getElementById('invite-password');
  const passwordConfirmInput = document.getElementById('invite-password-confirm');
  const nomeDisplay = document.getElementById('invite-nome-display');
  const errorDiv = document.getElementById('invite-accept-error');

  if (!btnAceitar) return;

  // Mostrar nome confirmado
  if (nomeDisplay && _inviteState.nome) {
    nomeDisplay.textContent = _inviteState.nome;
  }

  // Aceitar convite
  btnAceitar.addEventListener('click', async () => {
    const password = passwordInput?.value?.trim();
    const passwordConfirm = passwordConfirmInput?.value?.trim();

    // Validações
    if (!password || !passwordConfirm) {
      showError('Preencha a senha e confirme', errorDiv);
      return;
    }

    if (password.length < 6) {
      showError('Senha deve ter no mínimo 6 caracteres', errorDiv);
      return;
    }

    if (password !== passwordConfirm) {
      showError('As senhas não correspondem', errorDiv);
      return;
    }

    btnAceitar.disabled = true;
    btnAceitar.textContent = 'Processando...';

    try {
      // 1️⃣ Verificar OTP e confirmar o convite (cria conta sem senha)
      const { data: { user, session }, error } = await getSupabase().auth.verifyOtp({
        token_hash: _inviteState.token_hash,
        type: 'invite',
      });

      if (error) {
        showError(`Erro ao aceitar convite: ${error.message}`, errorDiv);
        btnAceitar.disabled = false;
        btnAceitar.textContent = 'Aceitar convite';
        return;
      }

      if (!user || !session) {
        showError('Falha ao processar convite. Tente novamente.', errorDiv);
        btnAceitar.disabled = false;
        btnAceitar.textContent = 'Aceitar convite';
        return;
      }

      // 2️⃣ Salvar nome em profiles.nome
      await updateUserProfile(user.id, { nome: _inviteState.nome });

      // 3️⃣ Definir a senha do usuário
      const { error: updateError } = await getSupabase().auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.warn('⚠️ Aviso ao atualizar senha:', updateError.message);
        // Não falhar — o convite foi aceito e o usuário pode fazer login
      }

      // 4️⃣ Limpar inputs e ir para calculadora
      if (passwordInput) passwordInput.value = '';
      if (passwordConfirmInput) passwordConfirmInput.value = '';
      if (errorDiv) errorDiv.style.display = 'none';

      showToast('✅ Bem-vindo! Sua conta foi ativada.', 'success');

      // Redirecionar para calculadora (a sessão já está ativa)
      setTimeout(() => {
        window.location.hash = '#/calcular';
      }, 500);
    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      showError(`Erro: ${error.message}`, errorDiv);
      btnAceitar.disabled = false;
      btnAceitar.textContent = 'Aceitar convite';
    }
  });

  // Permitir Enter para aceitar
  passwordConfirmInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnAceitar.click();
    }
  });

  // Link para solicitar novo convite (se expirou)
  const linkSolicitar = document.getElementById('link-solicitar-novo-convite');
  if (linkSolicitar) {
    linkSolicitar.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Entre em contato com o administrador para solicitar um novo convite', 'info');
      window.location.hash = '#/login';
    });
  }
}

function showError(message, errorDiv) {
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
  showToast(message, 'error');
}

export function getInviteState() {
  return { ..._inviteState };
}
