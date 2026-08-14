// admin.js — PrecificaPRO
// Painel de administração: gerenciar convites de usuários

import { showToast } from './ui.js';
import { getSupabase } from './supabase.js';

export async function initAdminPanel() {
  const btnEnviar = document.getElementById('btn-enviar-convite');
  const inputNome = document.getElementById('invite-nome');
  const inputEmail = document.getElementById('invite-email');

  if (!btnEnviar) return;

  btnEnviar.addEventListener('click', async () => {
    await _handleSendInvite(inputNome, inputEmail);
  });

  // Enter no último input envia o convite
  inputEmail?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') _handleSendInvite(inputNome, inputEmail);
  });

  // Carregar lista de convidados ao abrir a view
  await _loadConvidados();
}

async function _handleSendInvite(inputNome, inputEmail) {
  const nome = inputNome?.value.trim();
  const email = inputEmail?.value.trim();
  const feedbackEl = document.getElementById('invite-feedback');

  if (!nome || !email) {
    if (feedbackEl) {
      feedbackEl.textContent = '❌ Nome e e-mail são obrigatórios';
      feedbackEl.style.display = 'block';
    }
    showToast('Preencha nome e e-mail', 'error');
    return;
  }

  if (!_isValidEmail(email)) {
    if (feedbackEl) {
      feedbackEl.textContent = '❌ E-mail inválido';
      feedbackEl.style.display = 'block';
    }
    showToast('E-mail inválido', 'error');
    return;
  }

  try {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase não inicializado');
    }

    // Obter o token de acesso do usuário admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    // Chamar edge function para enviar convite
    // NOTA: Esta edge function precisa ser criada no Supabase:
    // https://ztzbqmbnlqafsazvwjyw.supabase.co/functions/v1/send-invite
    const response = await fetch(
      'https://ztzbqmbnlqafsazvwjyw.supabase.co/functions/v1/send-invite',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          nome,
          email,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao enviar convite');
    }

    // Limpar inputs e atualizar lista
    if (inputNome) inputNome.value = '';
    if (inputEmail) inputEmail.value = '';
    if (feedbackEl) feedbackEl.style.display = 'none';

    showToast('✅ Convite enviado com sucesso!', 'success');

    // Recarregar lista de convidados
    await _loadConvidados();
  } catch (error) {
    console.error('Erro ao enviar convite:', error);
    if (feedbackEl) {
      feedbackEl.textContent = `❌ ${error.message}`;
      feedbackEl.style.display = 'block';
    }
    showToast(`Erro: ${error.message}`, 'error');
  }
}

async function _loadConvidados() {
  const listEl = document.getElementById('convidados-list');
  if (!listEl) return;

  try {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase não inicializado');
    }

    // Buscar lista de convidados (usuários com role 'client' criados via convite)
    const { data, error } = await supabase
      .from('user_roles')
      .select('id, email, role, created_at')
      .eq('role', 'client')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      listEl.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">Nenhum convite enviado ainda</p>';
      return;
    }

    // Montar tabela de convidados
    let html = `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
        <thead style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;">
          <tr>
            <th style="padding: 0.75rem; text-align: left; font-weight: 600;">Nome / E-mail</th>
            <th style="padding: 0.75rem; text-align: center; font-weight: 600;">Status</th>
            <th style="padding: 0.75rem; text-align: center; font-weight: 600;">Data do convite</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.forEach((user) => {
      const status = user.status === 'active' ? '✅ Conta criada' : '⏳ Convite enviado';
      const date = new Date(user.created_at).toLocaleDateString('pt-BR');
      html += `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 0.75rem; word-break: break-word;">
            <strong>${user.email}</strong>
          </td>
          <td style="padding: 0.75rem; text-align: center;">${status}</td>
          <td style="padding: 0.75rem; text-align: center; color: #666;">${date}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    listEl.innerHTML = html;
  } catch (error) {
    console.error('Erro ao carregar convidados:', error);
    listEl.innerHTML = `<p style="color: #d32f2f; padding: 2rem;">Erro ao carregar convidados: ${error.message}</p>`;
  }
}

function _isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
