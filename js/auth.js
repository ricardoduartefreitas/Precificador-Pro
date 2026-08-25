// auth.js — PrecificaPRO
// Responsabilidade: gerenciar sessão, login/logout e permissões (admin/cliente)

import { getSupabase, getSession, getCurrentUser, getUserRole, getProfile } from './supabase.js';

let _auth = {
  session: null,
  user: null,
  role: null, // 'admin' | 'client'
  onboardingCompleto: false, // ESCOPO 1 (25/08): cadastro estendido de 3 passos
};

const AUTH_LISTENERS = [];

function notifyListeners(event) {
  AUTH_LISTENERS.forEach((fn) => fn(event || null, _auth));
}

export function onAuthChange(callback) {
  AUTH_LISTENERS.push(callback);
  // Chamar imediatamente com estado atual (sem evento)
  callback(null, _auth);
  // Retorna função de unsubscribe
  return () => {
    const idx = AUTH_LISTENERS.indexOf(callback);
    if (idx > -1) AUTH_LISTENERS.splice(idx, 1);
  };
}

export function getAuth() {
  return { ..._auth };
}

export function isLoggedIn() {
  return _auth.session !== null;
}

export function isAdmin() {
  return _auth.role === 'admin';
}

// ESCOPO 1 (25/08): gate do onboarding estendido (cadastro em 3 passos)
export function isOnboardingComplete() {
  return _auth.onboardingCompleto === true;
}

export function getCurrentUserId() {
  return _auth.user?.id || null;
}

export function getCurrentUserEmail() {
  return _auth.user?.email || null;
}

// Inicializar auth no boot (verificar sessão existente)
export async function initAuth() {
  try {
    // FIX (17/08): escutar o evento de RECUPERAÇÃO DE SENHA do Supabase!
    // (o link do 'Esqueci minha senha' → o supabase processa o token (detectSessionInUrl)
    //  e dispara PASSWORD_RECOVERY → o app mostra a tela de nova senha!)
    getSupabase().auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        _auth.session = session;
        _auth.user = session?.user || null;
        _auth.role = null;
        notifyListeners('PASSWORD_RECOVERY');
      }
    });

    // FIX (17/08): processar o token de recuperação MANUALMENTE antes de tudo!
    // (o hash-router: o link do email é `#/recuperar-senha?token_hash=...&type=recovery`
    //  — o detectSessionInUrl do supabase-js NÃO parseia o query dentro do fragmento,
    //  então chamamos o verifyOtp por conta própria → dispara PASSWORD_RECOVERY!)
    const hashQuery = (window.location.hash || '').split('?')[1] || '';
    const hashParams = new URLSearchParams(hashQuery);
    const tokenHash = hashParams.get('token_hash');
    const hashType = hashParams.get('type');
    if (tokenHash && hashType === 'recovery') {
      const { verifyRecoveryToken } = await import('./supabase.js');
      try {
        await verifyRecoveryToken(tokenHash);
        // limpar o token da URL (deixar só a rota limpa)
        window.history.replaceState(null, '', '#/recuperar-senha');
        console.log('✅ Token de recuperação validado');
      } catch (e) {
        console.error('❌ Token de recuperação inválido:', e.message);
        window.history.replaceState(null, '', '#/login');
      }
      return; // o PASSWORD_RECOVERY (via onAuthStateChange) cuida do resto
    }

    // Restaurar sessão do Supabase
    const session = await getSession();

    // Validar: se não há sessão OU a sessão é inválida, garantir limpeza do localStorage
    if (!session || !session.user) {
      const { signOut } = await import('./supabase.js');
      await signOut(); // Limpar qualquer dado antigo do localStorage
      _auth.session = null;
      _auth.user = null;
      _auth.role = null;
      _auth.onboardingCompleto = false;
      notifyListeners();
      console.log('ℹ️ Sessão inválida ou expirada — localStorage limpo');
      return;
    }

    _auth.session = session;
    _auth.user = session.user;

    // Buscar perfil do usuário (role + status do onboarding — ESCOPO 1)
    await _hydrateProfile(session.user.id);

    notifyListeners();
    console.log(`✅ Sessão restaurada: ${session.user.email} (${_auth.role})`);
  } catch (error) {
    console.error('❌ Erro ao inicializar autenticação:', error.message);
    // Se deu erro, garantir limpeza do localStorage
    try {
      const { signOut } = await import('./supabase.js');
      await signOut();
    } catch (signOutError) {
      console.warn('⚠️ Erro ao limpar localStorage:', signOutError.message);
    }
    _auth.session = null;
    _auth.user = null;
    _auth.role = null;
    _auth.onboardingCompleto = false;
    notifyListeners();
  }
}

// Busca o perfil (profiles) e popula role + onboardingCompleto no _auth.
// Isolado num helper porque é chamado de 3 lugares (initAuth, login, hydrateSession)
// e não pode derrubar o fluxo de login se a tabela profiles falhar por algum motivo.
async function _hydrateProfile(userId) {
  try {
    const profile = await getProfile(userId);
    _auth.role = profile?.role || 'client';
    _auth.onboardingCompleto = !!profile?.onboarding_completo;
  } catch (error) {
    console.warn('⚠️ Falha ao buscar perfil (usando fallback role=client):', error.message);
    _auth.role = _auth.role || 'client';
    _auth.onboardingCompleto = false;
  }
}

// Login com email/senha (Supabase REAL somente — sem fallback demo)
export async function login(email, password) {
  try {
    const { signIn } = await import('./supabase.js');
    const { session, user } = await signIn(email, password);

    _auth.session = session;
    _auth.user = user;

    // Buscar role + status do onboarding no banco (ESCOPO 1)
    await _hydrateProfile(user.id);

    notifyListeners();
    console.log(`✅ Login bem-sucedido: ${email} (${_auth.role})`);
    return { success: true, user, role: _auth.role };
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.message);
    return { success: false, error: error.message };
  }
}

// Logout
export async function logout() {
  // FIX (17/08): o logout do APP NUNCA falha — o _auth é limpo SEMPRE,
  // mesmo se o signOut do Supabase falhar (o token expirado/offline)!
  // (antes: o catch retornava o erro SEM limpar o _auth → o isLoggedIn ficava true
  //  → o router redirecionava para o calcular (vazio) → a TELA BRANCA pós-logout!)
  let signOutError = null;
  try {
    const { signOut } = await import('./supabase.js');
    await signOut();
  } catch (error) {
    signOutError = error;
    console.error('❌ Erro ao fazer logout no Supabase (o logout local segue):', error.message);
  }

  _auth.session = null;
  _auth.user = null;
  _auth.role = null;
  _auth.onboardingCompleto = false;

  notifyListeners();

  if (signOutError) {
    return { success: true, warning: 'logout local ok; o Supabase falhou' };
  }
  return { success: true };
}

// Signup (criar conta nova) — DESABILITADO: somente por convite
export async function signup(email, password) {
  try {
    const { signUp } = await import('./supabase.js');
    const result = await signUp(email, password);

    // Após signup, a sessão não é automática — usuário precisa verificar email ou fazer login
    // Aqui só retornamos o resultado
    return { success: true, user: result.user };
  } catch (error) {
    console.error('❌ Erro ao fazer signup:', error.message);
    return { success: false, error: error.message };
  }
}

// Reset de senha por email
export async function resetPassword(email) {
  try {
    const { resetPasswordForEmail } = await import('./supabase.js');
    await resetPasswordForEmail(email);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao enviar link de reset:', error.message);
    return { success: false, error: error.message };
  }
}

// Trocar a senha (na tela de recuperação — o token do link já foi processado)
export async function updatePassword(novaSenha) {
  try {
    const { updatePassword: updatePasswordApi } = await import('./supabase.js');
    await updatePasswordApi(novaSenha);
    // Após trocar, encerra a sessão de recovery e volta para o login
    _auth.session = null;
    _auth.user = null;
    _auth.role = null;
    _auth.onboardingCompleto = false;
    notifyListeners();
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao trocar a senha:', error.message);
    return { success: false, error: error.message };
  }
}

// ESCOPO 1 (25/08): re-consulta o onboarding_completo em profiles e notifica os
// listeners — chamado pelo onboarding.js após salvar o último passo do wizard.
export async function refreshOnboardingStatus() {
  if (!_auth.user) return;
  try {
    const profile = await getProfile(_auth.user.id);
    _auth.onboardingCompleto = !!profile?.onboarding_completo;
    _auth.role = profile?.role || _auth.role;
    notifyListeners();
  } catch (error) {
    console.warn('⚠️ Falha ao atualizar status do onboarding:', error.message);
  }
}

// FIX (25/08): o aceite de convite (ui-invite-accept.js) chama verifyOtp() DIRETO
// no SDK do Supabase — sem passar por login() — então o _auth local nunca era
// sincronizado. Isso deixava isLoggedIn()===false logo após aceitar o convite,
// e o router bounceava o usuário recém-cadastrado de volta pro #/login.
// Este setter permite que quem já tem `session`/`user` em mãos (o retorno do
// verifyOtp) sincronize o auth.js sem duplicar a lógica de login por senha.
export async function hydrateSession(session, user) {
  _auth.session = session;
  _auth.user = user;
  await _hydrateProfile(user.id);
  notifyListeners();
}
