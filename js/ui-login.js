// ui-login.js — PrecificaPRO
// Responsabilidade: gerenciar interface de login e reset de senha (sem signup — somente por convite)

import { login, resetPassword, signup, getCurrentUserId } from './auth.js';
import { updateUserProfile } from './supabase.js';

export function initLoginUI() {
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const btnLogin = document.getElementById('btn-login');
  const linkSignup = document.getElementById('link-signup');
  const errorDiv = document.getElementById('login-error');

  if (!btnLogin) return; // Não existem elementos de login

  // ─────────────────────────────────────────────────────────────────
  // Toggle para ver/ocultar senha (25/08)
  // ─────────────────────────────────────────────────────────────────
  const btnTogglePassword = document.getElementById('btn-toggle-password');
  if (btnTogglePassword) {
    // Previne comportamento padrão do botão
    btnTogglePassword.addEventListener('click', (e) => {
      e.preventDefault();
      togglePasswordVisibility();
    });
  }

  function togglePasswordVisibility() {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    btnTogglePassword.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
    btnTogglePassword.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
  }

  // FIX (17/08): o botão SEMPRE reseta no initLoginUI (roda a cada logout!)
  // (antes: após um login, o botão ficava disabled 'Entrando...' para sempre —
  //  o caminho de sucesso não restaurava → o RELOGIN morria!)
  btnLogin.disabled = false;
  btnLogin.textContent = 'Entrar';

  // FIX (17/08): guard contra listeners duplicados (o initLoginUI roda a cada
  // logout — cada execução adicionava +1 listener de click no mesmo botão!)
  if (btnLogin.dataset.uiInit) return;
  btnLogin.dataset.uiInit = '1';

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
      // Pós-login: se veio de um cadastro aberto, grava o nome no perfil (o resto
      // do cadastro rico acontece no onboarding, que o router já força)
      _aplicarSignupAposLogin();
      // Restaura o botão (o redirect para #/calcular acontece no auth listener)
      btnLogin.disabled = false;
      btnLogin.textContent = 'Entrar';
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

  // Link "Esqueci minha senha?"
  const linkForgotPassword = document.getElementById('link-forgot-password');
  if (linkForgotPassword) {
    linkForgotPassword.addEventListener('click', (e) => {
      e.preventDefault();
      showForgotPasswordForm();
    });
  }

  // Elementos da tela de reset de senha (inicialmente escondida)
  const forgotPasswordCard = document.getElementById('forgot-password-card');
  const forgotPasswordEmail = document.getElementById('forgot-password-email');
  const btnSendReset = document.getElementById('btn-send-reset');
  const forgotPasswordError = document.getElementById('forgot-password-error');
  const linkBackLoginFromReset = document.getElementById('link-back-login-reset');

  // Se não existir ainda, criar os elementos dinamicamente (retrocompatibilidade)
  if (!forgotPasswordCard) {
    // Nós vamos criar depois se necessário
  }

  if (forgotPasswordCard && btnSendReset) {
    // Enviar link de reset
    btnSendReset.addEventListener('click', async () => {
      const email = forgotPasswordEmail.value.trim();

      if (!email) {
        showForgotPasswordError('Preencha seu e-mail');
        return;
      }

      btnSendReset.disabled = true;
      btnSendReset.textContent = 'Enviando...';

      const result = await resetPassword(email);

      if (result.success) {
        showForgotPasswordError(''); // Limpar erro
        forgotPasswordEmail.value = '';
        showForgotPasswordConfirmation();
      } else {
        showForgotPasswordError(result.error || 'Erro ao enviar link de reset');
        btnSendReset.disabled = false;
        btnSendReset.textContent = 'Enviar link de redefinição';
      }
    });

    // Permitir Enter para enviar reset
    if (forgotPasswordEmail) {
      forgotPasswordEmail.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          btnSendReset.click();
        }
      });
    }

    // Voltar ao login desde a tela de reset
    if (linkBackLoginFromReset) {
      linkBackLoginFromReset.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
      });
    }
  }

  // Botão "Voltar ao login" da tela de confirmação de reset
  const btnBackToLoginFromConfirm = document.getElementById('btn-back-to-login-reset-confirm');
  if (btnBackToLoginFromConfirm) {
    btnBackToLoginFromConfirm.addEventListener('click', (e) => {
      e.preventDefault();
      showLoginForm();
    });
  }

  // ─────────────────────────────────────────────────────────────
  // CADASTRO ABERTO (30/08): Criar conta grátis (self-signup)
  // ─────────────────────────────────────────────────────────────
  const linkCriarConta = document.getElementById('link-criar-conta');
  const linkBackLoginSignup = document.getElementById('link-back-login-signup');
  const btnSignup = document.getElementById('btn-signup');
  const signupCard = document.getElementById('signup-card');
  const signupNome = document.getElementById('signup-nome');
  const signupEmail = document.getElementById('signup-email');
  const signupPassword = document.getElementById('signup-password');
  const signupConsent = document.getElementById('signup-consent');

  if (linkCriarConta && signupCard) {
    linkCriarConta.addEventListener('click', (e) => {
      e.preventDefault();
      showSignupForm();
    });
  }

  if (linkBackLoginSignup && signupCard) {
    linkBackLoginSignup.addEventListener('click', (e) => {
      e.preventDefault();
      showLoginForm();
      _hideSignupFeedback();
    });
  }

  if (btnSignup && signupCard) {
    btnSignup.addEventListener('click', async () => {
      const nome = signupNome.value.trim();
      const email = signupEmail.value.trim();
      const senha = signupPassword.value.trim();

      if (!nome) return _showSignupError('Informe seu nome');
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return _showSignupError('Informe um e-mail válido');
      if (senha.length < 6) return _showSignupError('A senha precisa de pelo menos 6 caracteres');
      if (!signupConsent.checked) return _showSignupError('É preciso concordar com os Termos e a Política de Privacidade');

      _hideSignupError();
      btnSignup.disabled = true;
      btnSignup.textContent = 'Criando conta...';

      // Origem (UTM) + consentimento — registrados no user_metadata do auth
      const origem = _capturarOrigem();
      const metadata = {
        nome,
        consentimento_lgpd: true,
        consentimento_em: new Date().toISOString(),
        utm_source: origem.utm_source,
        utm_medium: origem.utm_medium,
        utm_campaign: origem.utm_campaign,
        utm_content: origem.utm_content,
        utm_term: origem.utm_term,
        referrer: origem.referrer,
      };

      // Guarda localmente para gravar o nome no perfil após o primeiro login
      try {
        localStorage.setItem('_psp_signup', JSON.stringify({ email, nome }));
      } catch (_) { /* storage cheio — segue sem */ }

      const result = await signup(email, senha, metadata);

      btnSignup.disabled = false;
      btnSignup.textContent = 'Criar conta grátis';

      if (result.success) {
        _showSignupSuccess('Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme e depois faça login.');
        signupNome.value = '';
        signupEmail.value = '';
        signupPassword.value = '';
        signupConsent.checked = false;
      } else {
        _showSignupError(result.error || 'Erro ao criar a conta. Tente novamente.');
      }
    });

    // Permitir Enter para criar conta
    signupPassword.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btnSignup.click();
    });
  }
}

function showLoginForm() {
  const loginFormCard = document.getElementById('login-form-card');
  const forgotPasswordCard = document.getElementById('forgot-password-card');
  const forgotPasswordConfirmCard = document.getElementById('forgot-password-confirm-card');

  loginFormCard.style.display = 'block';
  if (forgotPasswordCard) forgotPasswordCard.style.display = 'none';
  if (forgotPasswordConfirmCard) forgotPasswordConfirmCard.style.display = 'none';

  // Limpar campos
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  showError(''); // Limpar erros
}

function showForgotPasswordForm() {
  const loginFormCard = document.getElementById('login-form-card');
  let forgotPasswordCard = document.getElementById('forgot-password-card');
  let forgotPasswordConfirmCard = document.getElementById('forgot-password-confirm-card');

  // Se não existir, criar dinamicamente
  if (!forgotPasswordCard) {
    const viewLogin = document.getElementById('view-login');
    const newCardHTML = `
      <div class="card" id="forgot-password-card">
        <h2 class="card-title" style="text-align: center;">Redefinir senha</h2>
        <p style="text-align: center; color: #666; margin-bottom: 2rem;">Insira seu e-mail para receber um link de redefinição</p>

        <div class="form-grid">
          <div class="form-field form-field--full">
            <label for="forgot-password-email">E-mail</label>
            <input type="email" id="forgot-password-email" placeholder="seu@email.com" autocomplete="email" />
          </div>
        </div>

        <button class="btn btn--primary" id="btn-send-reset" style="width: 100%; margin-bottom: 1rem;">Enviar link de redefinição</button>

        <div id="forgot-password-error" class="login-error" style="display: none; color: #d32f2f; padding: 1rem; background: #ffebee; border-radius: 4px; margin-bottom: 1rem;"></div>

        <div style="text-align: center; font-size: 0.875rem; color: #666;">
          <p><a href="#" id="link-back-login-reset" style="color: #FFD700; cursor: pointer;">Voltar ao login</a></p>
        </div>
      </div>

      <div class="card" id="forgot-password-confirm-card" style="display: none;">
        <h2 class="card-title" style="text-align: center;">Verifique seu e-mail</h2>
        <p style="text-align: center; color: #666; margin-bottom: 2rem;">Enviamos um link de redefinição de senha para seu e-mail.</p>
        <div style="text-align: center; padding: 2rem; background: #e8f5e9; border-radius: 4px; margin-bottom: 2rem;">
          <p style="font-size: 0.875rem; color: #2e7d32;">✅ Link enviado com sucesso!</p>
          <p style="font-size: 0.875rem; color: #555; margin-top: 0.5rem;">Procure o e-mail na sua caixa de entrada ou na pasta de spam.</p>
        </div>
        <button class="btn btn--primary" id="btn-back-to-login-reset-confirm" style="width: 100%;">Voltar ao login</button>
      </div>
    `;
    const viewLoginInner = viewLogin.querySelector('.view-inner');
    viewLoginInner.insertAdjacentHTML('beforeend', newCardHTML);

    // Re-fetch após criar
    forgotPasswordCard = document.getElementById('forgot-password-card');
    forgotPasswordConfirmCard = document.getElementById('forgot-password-confirm-card');

    // Re-bind event listeners
    const forgotPasswordEmail = document.getElementById('forgot-password-email');
    const btnSendReset = document.getElementById('btn-send-reset');
    const forgotPasswordError = document.getElementById('forgot-password-error');
    const linkBackLoginFromReset = document.getElementById('link-back-login-reset');
    const btnBackToLoginFromConfirm = document.getElementById('btn-back-to-login-reset-confirm');

    if (btnSendReset) {
      btnSendReset.addEventListener('click', async () => {
        const email = forgotPasswordEmail.value.trim();

        if (!email) {
          showForgotPasswordError('Preencha seu e-mail');
          return;
        }

        btnSendReset.disabled = true;
        btnSendReset.textContent = 'Enviando...';

        const result = await resetPassword(email);

        if (result.success) {
          showForgotPasswordError(''); // Limpar erro
          forgotPasswordEmail.value = '';
          showForgotPasswordConfirmation();
        } else {
          showForgotPasswordError(result.error || 'Erro ao enviar link de reset');
          btnSendReset.disabled = false;
          btnSendReset.textContent = 'Enviar link de redefinição';
        }
      });

      if (forgotPasswordEmail) {
        forgotPasswordEmail.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            btnSendReset.click();
          }
        });
      }
    }

    if (linkBackLoginFromReset) {
      linkBackLoginFromReset.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
      });
    }

    if (btnBackToLoginFromConfirm) {
      btnBackToLoginFromConfirm.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
      });
    }
  }

  loginFormCard.style.display = 'none';
  if (forgotPasswordCard) forgotPasswordCard.style.display = 'block';
  if (forgotPasswordConfirmCard) forgotPasswordConfirmCard.style.display = 'none';

  // Limpar campos e erros
  const forgotPasswordEmail = document.getElementById('forgot-password-email');
  if (forgotPasswordEmail) {
    forgotPasswordEmail.value = '';
    forgotPasswordEmail.focus();
  }
  showForgotPasswordError('');
}

function showForgotPasswordConfirmation() {
  const loginFormCard = document.getElementById('login-form-card');
  const forgotPasswordCard = document.getElementById('forgot-password-card');
  const forgotPasswordConfirmCard = document.getElementById('forgot-password-confirm-card');

  loginFormCard.style.display = 'none';
  if (forgotPasswordCard) forgotPasswordCard.style.display = 'none';
  if (forgotPasswordConfirmCard) forgotPasswordConfirmCard.style.display = 'block';
}

function showForgotPasswordError(message) {
  const forgotPasswordError = document.getElementById('forgot-password-error');
  if (!forgotPasswordError) return; // Elemento ainda não foi criado

  if (message) {
    forgotPasswordError.textContent = message;
    forgotPasswordError.style.display = 'block';
  } else {
    forgotPasswordError.style.display = 'none';
    forgotPasswordError.textContent = '';
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

// ═══════════════════════════════════════════════════════════════
// RECUPERAÇÃO DE SENHA (#/recuperar-senha) — FIX (17/08)!
// O link do 'Esqueci minha senha' → o supabase processa o token
// (detectSessionInUrl) → evento PASSWORD_RECOVERY → este card aparece.
// ═══════════════════════════════════════════════════════════════

// Mostrar o card de nova senha (dentro da view-login)
export function showResetPasswordForm() {
  const loginFormCard = document.getElementById('login-form-card');
  const resetPasswordCard = document.getElementById('reset-password-card');

  if (loginFormCard) loginFormCard.style.display = 'none';
  if (resetPasswordCard) resetPasswordCard.style.display = 'block';
}

export function initResetPasswordUI() {
  const btnReset = document.getElementById('btn-reset-password');
  if (!btnReset) return;

  // Guard contra listeners duplicados (o init roda a cada boot/logout)
  if (btnReset.dataset.uiInit) return;
  btnReset.dataset.uiInit = '1';

  const novaInput = document.getElementById('reset-password-nova');
  const confirmarInput = document.getElementById('reset-password-confirmar');
  const errorDiv = document.getElementById('reset-password-error');

  function showResetError(message) {
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = message ? 'block' : 'none';
    }
  }

  btnReset.addEventListener('click', async () => {
    const nova = novaInput.value.trim();
    const confirmar = confirmarInput.value.trim();

    if (!nova || nova.length < 6) {
      showResetError('A nova senha precisa de pelo menos 6 caracteres');
      return;
    }
    if (nova !== confirmar) {
      showResetError('As senhas não conferem');
      return;
    }

    btnReset.disabled = true;
    btnReset.textContent = 'Salvando...';

    const { updatePassword } = await import('./auth.js');
    const result = await updatePassword(nova);

    if (result.success) {
      showResetError('');
      novaInput.value = '';
      confirmarInput.value = '';
      btnReset.disabled = false;
      btnReset.textContent = 'Salvar nova senha';
      // Volta para o login com a mensagem de sucesso
      const loginError = document.getElementById('login-error');
      if (loginError) {
        loginError.style.display = 'block';
        loginError.style.background = '#e8f5e9';
        loginError.style.color = '#2e7d32';
        loginError.textContent = '✅ Senha alterada com sucesso! Faça login com a nova senha.';
      }
      window.location.hash = '#/login';
    } else {
      showResetError(result.error || 'Erro ao alterar a senha');
      btnReset.disabled = false;
      btnReset.textContent = 'Salvar nova senha';
    }
  });

  // Enter nos campos dispara o salvamento
  [novaInput, confirmarInput].forEach((input) => {
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btnReset.click();
      });
    }
  });

  // Voltar ao login
  const linkBack = document.getElementById('link-back-login-reset-password');
  if (linkBack) {
    linkBack.addEventListener('click', (e) => {
      e.preventDefault();
      const loginFormCard = document.getElementById('login-form-card');
      const resetPasswordCard = document.getElementById('reset-password-card');
      if (loginFormCard) loginFormCard.style.display = 'block';
      if (resetPasswordCard) resetPasswordCard.style.display = 'none';
      window.location.hash = '#/login';
    });
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
  logoutBtn.innerHTML = '<span class="logout-icon">🚪</span><span class="logout-text">Logout</span>';

  logoutBtn.addEventListener('click', async () => {
    const { logout } = await import('./auth.js');
    await logout();
  });

  // Fica ao lado do plan-badge, dentro do fluxo flex do header (sem position: absolute)
  const actions = header.querySelector('.header-actions') || header.querySelector('.header-inner') || header;
  actions.appendChild(logoutBtn);
}

// ─────────────────────────────────────────────────────────────
// CADASTRO ABERTO (30/08) — helpers do self-signup
// ─────────────────────────────────────────────────────────────

function showSignupForm() {
  const loginFormCard = document.getElementById('login-form-card');
  const signupCard = document.getElementById('signup-card');
  if (loginFormCard) loginFormCard.style.display = 'none';
  if (signupCard) signupCard.style.display = 'block';
  _hideSignupFeedback();
}

function _showSignupError(msg) {
  const el = document.getElementById('signup-error');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

function _hideSignupError() {
  const el = document.getElementById('signup-error');
  if (el) { el.textContent = ''; el.style.display = 'none'; }
}

function _showSignupSuccess(msg) {
  const el = document.getElementById('signup-success');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

function _hideSignupFeedback() {
  _hideSignupError();
  const el = document.getElementById('signup-success');
  if (el) { el.textContent = ''; el.style.display = 'none'; }
}

// Origem do visitante: UTM da URL (search ou hash) + referrer
function _capturarOrigem() {
  const params = new URLSearchParams(window.location.search || '');
  const hashQuery = (window.location.hash || '').split('?')[1];
  if (hashQuery) {
    new URLSearchParams(hashQuery).forEach((v, k) => {
      if (!params.has(k)) params.set(k, v);
    });
  }
  return {
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
    utm_content: params.get('utm_content') || null,
    utm_term: params.get('utm_term') || null,
    referrer: document.referrer || null,
  };
}

// Após o 1º login de quem se cadastrou sozinho: grava o nome no perfil
// (o cadastro rico completo acontece no onboarding, que o router já força)
function _aplicarSignupAposLogin() {
  let dados;
  try {
    dados = JSON.parse(localStorage.getItem('_psp_signup') || 'null');
  } catch (_) { dados = null; }
  if (!dados || !dados.nome) return;

  try { localStorage.removeItem('_psp_signup'); } catch (_) { /* segue */ }

  const userId = getCurrentUserId();
  if (!userId) return; // sessão ainda não hidratada — nada a fazer aqui

  import('./supabase.js').then(({ updateUserProfile }) => {
    updateUserProfile(userId, { nome: dados.nome })
      .then(() => console.log('[SIGNUP] Nome gravado no perfil:', dados.nome))
      .catch((err) => console.warn('⚠️ Falha ao gravar nome pós-signup:', err.message));
  }).catch(() => { /* módulo já carregado — sem ação */ });
}
