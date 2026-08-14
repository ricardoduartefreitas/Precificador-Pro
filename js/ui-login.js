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

  // Mostrar tela de signup
  linkSignup.addEventListener('click', (e) => {
    e.preventDefault();
    showSignupForm();
  });

  // Elementos da tela de signup
  const signupFormCard = document.getElementById('signup-form-card');
  const signupEmail = document.getElementById('signup-email');
  const signupPassword = document.getElementById('signup-password');
  const signupPasswordConfirm = document.getElementById('signup-password-confirm');
  const btnSignup = document.getElementById('btn-signup');
  const signupError = document.getElementById('signup-error');
  const linkBackLogin = document.getElementById('link-back-login');

  if (signupFormCard && btnSignup) {
    // Criar conta
    btnSignup.addEventListener('click', async () => {
      const email = signupEmail.value.trim();
      const password = signupPassword.value.trim();
      const passwordConfirm = signupPasswordConfirm.value.trim();

      // Validações
      if (!email || !password || !passwordConfirm) {
        showSignupError('Preencha todos os campos');
        return;
      }

      if (password.length < 6) {
        showSignupError('Senha deve ter no mínimo 6 caracteres');
        return;
      }

      if (password !== passwordConfirm) {
        showSignupError('As senhas não correspondem');
        return;
      }

      btnSignup.disabled = true;
      btnSignup.textContent = 'Criando conta...';

      const result = await signup(email, password);

      if (result.success) {
        showSignupError(''); // Limpar erro
        signupEmail.value = '';
        signupPassword.value = '';
        signupPasswordConfirm.value = '';
        showSignupConfirmation();
      } else {
        showSignupError(result.error || 'Erro ao criar conta');
        btnSignup.disabled = false;
        btnSignup.textContent = 'Criar conta';
      }
    });

    // Permitir Enter para signup
    signupPasswordConfirm.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        btnSignup.click();
      }
    });

    // Voltar ao login desde a tela de signup
    linkBackLogin.addEventListener('click', (e) => {
      e.preventDefault();
      showLoginForm();
    });
  }

  // Botão "Voltar ao login" da tela de confirmação
  const btnBackToLogin = document.getElementById('btn-back-to-login');
  if (btnBackToLogin) {
    btnBackToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      showLoginForm();
    });
  }
}

function showLoginForm() {
  const loginFormCard = document.getElementById('login-form-card');
  const signupFormCard = document.getElementById('signup-form-card');
  const signupConfirmationCard = document.getElementById('signup-confirmation-card');

  loginFormCard.style.display = 'block';
  signupFormCard.style.display = 'none';
  signupConfirmationCard.style.display = 'none';

  // Limpar campos
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  showError(''); // Limpar erros
}

function showSignupForm() {
  const loginFormCard = document.getElementById('login-form-card');
  const signupFormCard = document.getElementById('signup-form-card');
  const signupConfirmationCard = document.getElementById('signup-confirmation-card');

  loginFormCard.style.display = 'none';
  signupFormCard.style.display = 'block';
  signupConfirmationCard.style.display = 'none';

  // Limpar campos e erros
  document.getElementById('signup-email').value = '';
  document.getElementById('signup-password').value = '';
  document.getElementById('signup-password-confirm').value = '';
  showSignupError('');

  // Focar no email
  document.getElementById('signup-email').focus();
}

function showSignupConfirmation() {
  const loginFormCard = document.getElementById('login-form-card');
  const signupFormCard = document.getElementById('signup-form-card');
  const signupConfirmationCard = document.getElementById('signup-confirmation-card');

  loginFormCard.style.display = 'none';
  signupFormCard.style.display = 'none';
  signupConfirmationCard.style.display = 'block';
}

function showSignupError(message) {
  const signupError = document.getElementById('signup-error');
  if (message) {
    signupError.textContent = message;
    signupError.style.display = 'block';
  } else {
    signupError.style.display = 'none';
    signupError.textContent = '';
  }
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
