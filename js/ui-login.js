// ui-login.js — PrecificaPRO
// Responsabilidade: gerenciar interface de login e signup

import { login, signup } from './auth.js';

export function initLoginUI() {
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const btnLogin = document.getElementById('btn-login');
  const linkSignup = document.getElementById('link-signup');
  const errorDiv = document.getElementById('login-error');

  if (!btnLogin) return; // Não existem elementos de login

  // Fazer login
  btnLogin.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      showError('Preencha e-mail e senha');
      return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = 'Entrando...';

    const result = await login(email, password);

    if (result.success) {
      showError(''); // Limpar erro
      emailInput.value = '';
      passwordInput.value = '';
      // O auth listener vai redirecionar automaticamente
    } else {
      showError(result.error || 'Erro ao fazer login');
      btnLogin.disabled = false;
      btnLogin.textContent = 'Entrar';
    }
  });

  // Permitir Enter para login
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnLogin.click();
    }
  });

  // Placeholder para signup (futura implementação)
  linkSignup.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Signup será implementado em breve. Por enquanto, entre em contato.');
  });
}

function showError(message) {
  const errorDiv = document.getElementById('login-error');
  if (message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  } else {
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
  }
}

// Logout: adiciona botão no header
export function addLogoutButton() {
  const header = document.querySelector('.app-header');
  if (!header) return;

  // Procura por existing logout button
  let logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) return; // Já existe

  // Cria botão de logout
  logoutBtn = document.createElement('button');
  logoutBtn.id = 'btn-logout';
  logoutBtn.className = 'btn btn--ghost';
  logoutBtn.textContent = '🚪 Logout';
  logoutBtn.style.position = 'absolute';
  logoutBtn.style.right = '1rem';
  logoutBtn.style.top = '50%';
  logoutBtn.style.transform = 'translateY(-50%)';

  logoutBtn.addEventListener('click', async () => {
    const { logout } = await import('./auth.js');
    await logout();
  });

  header.style.position = 'relative';
  header.appendChild(logoutBtn);
}
