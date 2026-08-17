// supabase.js — PrecificaPRO
// Inicializa cliente Supabase via CDN
// ⚠️ Nota: ANON_KEY é pública (exposta no frontend) — segurança via RLS no banco
// Projeto: ztzbqmbnlqafsazvwjyw (precificador-pro-2026)

let supabaseClient = null;

export async function initSupabase() {
  if (typeof window.supabase === 'undefined') {
    // Supabase não foi carregado via script tag
    console.error('❌ Supabase SDK não está carregado. Verifique o script tag no index.html');
    return null;
  }

  // Credenciais REAIS do projeto Supabase dedicado (produção)
  // URL e chave pública — segurança via RLS (Row-Level Security) no banco
  const SUPABASE_URL = 'https://ztzbqmbnlqafsazvwjyw.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_CDePFED29CEUJSJnbkmeSw_UFPq3Hdt';

  // Validação mínima (apenas para avisar se falhar)
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Credenciais Supabase não configuradas.');
    return null;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      // FIX (17/08): processa o token do link do email (recuperação de senha)!
      // (antes: o link do 'Esqueci minha senha' abria e NADA processava o token —
      //  o usuário caía no login sem opção de digitar a nova senha!)
      detectSessionInUrl: true,
    },
  });
  return supabaseClient;
}

export function getSupabase() {
  if (!supabaseClient) {
    throw new Error('Supabase não inicializado. Chame initSupabase() primeiro.');
  }
  return supabaseClient;
}

// Helpers
export async function signUp(email, password) {
  const { data, error } = await getSupabase().auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}

export async function resetPasswordForEmail(email) {
  const { data, error } = await getSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: 'https://precificador.ruahtecnologia.com.br/#/recuperar-senha',
  });
  if (error) throw error;
  return data;
}

// Trocar a senha (usado na tela de recuperação — o token do link já foi processado)
export async function updatePassword(novaSenha) {
  const { data, error } = await getSupabase().auth.updateUser({ password: novaSenha });
  if (error) throw error;
  return data;
}

export async function getSession() {
  const { data } = await getSupabase().auth.getSession();
  return data.session;
}

export async function getCurrentUser() {
  const { data } = await getSupabase().auth.getUser();
  return data.user;
}

// Obter role do usuário (admin | client) da tabela public.profiles
export async function getUserRole(userId) {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn('⚠️ Erro ao buscar role do usuário:', error.message);
    return 'client'; // Default: cliente
  }

  return data?.role || 'client';
}

// Listar cálculos do usuário (ou todos se admin)
export async function listCalculations(userId, isAdmin = false) {
  let query = getSupabase()
    .from('calculations')
    .select('*')
    .order('created_at', { ascending: false });

  if (!isAdmin) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Inserir novo cálculo
export async function insertCalculation(userId, productName, calculationData) {
  const { data, error } = await getSupabase()
    .from('calculations')
    .insert([
      {
        user_id: userId,
        product_name: productName,
        data: calculationData,
        created_at: new Date().toISOString(),
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0];
}

// Deletar cálculo
export async function deleteCalculation(calculationId) {
  const { error } = await getSupabase()
    .from('calculations')
    .delete()
    .eq('id', calculationId);

  if (error) throw error;
}


// Atualizar nome do usuário em profiles (o UPSERT: cria o perfil se não existe — o convite cria só o usuário!)
export async function updateUserProfile(userId, updates) {
  const { data, error } = await getSupabase()
    .from('profiles')
    .upsert({ id: userId, ...updates }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
