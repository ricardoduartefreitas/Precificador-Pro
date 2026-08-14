// auth.js — PrecificaPRO
// Responsabilidade: gerenciar sessão, login/logout e permissões (admin/cliente)

import { getSupabase, getSession, getCurrentUser, getUserRole } from './supabase.js';

let _auth = {
  session: null,
  user: null,
  role: null, // 'admin' | 'client'
};

const AUTH_LISTENERS = [];

function notifyListeners() {
  AUTH_LISTENERS.forEach((fn) => fn(_auth));
}

export function onAuthChange(callback) {
  AUTH_LISTENERS.push(callback);
  // Chamar imediatamente com estado atual
  callback(_auth);
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

export function getCurrentUserId() {
  return _auth.user?.id || null;
}

export function getCurrentUserEmail() {
  return _auth.user?.email || null;
}

// Inicializar auth no boot (verificar sessão existente)
export async function initAuth() {
  try {
    // Restaurar sessão do Supabase
    const session = await getSession();
    if (!session) {
      _auth.session = null;
      _auth.user = null;
      _auth.role = null;
      notifyListeners();
      return;
    }

    _auth.session = session;
    _auth.user = session.user;

    // Buscar role do usuário
    const role = await getUserRole(session.user.id);
    _auth.role = role;

    notifyListeners();
  } catch (error) {
    console.error('❌ Erro ao inicializar autenticação:', error.message);
    _auth.session = null;
    _auth.user = null;
    _auth.role = null;
    notifyListeners();
  }
}

// Login com email/senha
// PRIORIDADE: Supabase REAL → Demo apenas como fallback se Supabase falhar
export async function login(email, password) {
  try {
    // 1️⃣ TENTAR SUPABASE PRIMEIRO (principal)
    try {
      const { signIn } = await import('./supabase.js');
      const { session, user } = await signIn(email, password);

      _auth.session = session;
      _auth.user = user;

      // Buscar role do usuário no banco
      const role = await getUserRole(user.id);
      _auth.role = role;

      notifyListeners();
      console.log(`✅ Login bem-sucedido com Supabase: ${email} (${role})`);
      return { success: true, user, role };
    } catch (supabaseError) {
      console.warn('⚠️ Supabase indisponível, tentando modo demo...', supabaseError.message);

      // 2️⃣ FALLBACK: Modo demo apenas se Supabase falhar
      const DEMO_ACCOUNTS = {
        'admin@ruah.com.br': { password: '123456', role: 'admin' },
        'client@ruah.com.br': { password: '123456', role: 'client' },
      };

      if (DEMO_ACCOUNTS[email]) {
        if (DEMO_ACCOUNTS[email].password !== password) {
          return { success: false, error: 'Senha incorreta' };
        }

        // Simular sessão demo
        const demoUser = {
          id: email.split('@')[0],
          email,
          user_metadata: { role: DEMO_ACCOUNTS[email].role },
        };

        _auth.session = { user: demoUser }; // Session fake
        _auth.user = demoUser;
        _auth.role = DEMO_ACCOUNTS[email].role;

        notifyListeners();
        console.log(`⚠️ Login em MODO DEMO (Supabase offline): ${email} (${_auth.role})`);
        return { success: true, user: demoUser, role: _auth.role };
      }

      // Nenhuma conta demo encontrada, e Supabase falhou
      return { success: false, error: 'Usuário ou senha incorretos' };
    }
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.message);
    return { success: false, error: error.message };
  }
}

// Logout
export async function logout() {
  try {
    const { signOut } = await import('./supabase.js');
    await signOut();

    _auth.session = null;
    _auth.user = null;
    _auth.role = null;

    notifyListeners();
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error.message);
    return { success: false, error: error.message };
  }
}

// Signup (criar conta nova)
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
