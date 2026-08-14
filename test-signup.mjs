#!/usr/bin/env node
// test-signup.mjs — validação rápida do formulário de signup

import fs from 'fs';
import path from 'path';

const htmlPath = path.join(process.cwd(), 'index.html');
const uiLoginPath = path.join(process.cwd(), 'js', 'ui-login.js');

console.log('🧪 Validando implementação de Signup...\n');

// 1️⃣ Verificar HTML
const html = fs.readFileSync(htmlPath, 'utf-8');
const checks = [
  { name: 'Form de Login', pattern: 'id="login-form-card"' },
  { name: 'Form de Signup', pattern: 'id="signup-form-card"' },
  { name: 'Confirmação de Email', pattern: 'id="signup-confirmation-card"' },
  { name: 'Input Email Signup', pattern: 'id="signup-email"' },
  { name: 'Input Senha Signup', pattern: 'id="signup-password"' },
  { name: 'Input Confirmar Senha', pattern: 'id="signup-password-confirm"' },
  { name: 'Botão Criar Conta', pattern: 'id="btn-signup"' },
  { name: 'Link Voltar ao Login', pattern: 'id="link-back-login"' },
  { name: 'Botão Voltar ao Login (Confirmação)', pattern: 'id="btn-back-to-login"' },
];

let htmlPassed = 0;
for (const check of checks) {
  if (html.includes(check.pattern)) {
    console.log(`  ✅ ${check.name}`);
    htmlPassed++;
  } else {
    console.log(`  ❌ ${check.name} — NÃO ENCONTRADO`);
  }
}

console.log(`\n📄 HTML: ${htmlPassed}/${checks.length} elementos presentes\n`);

// 2️⃣ Verificar JavaScript
const uiLogin = fs.readFileSync(uiLoginPath, 'utf-8');
const jsChecks = [
  { name: 'Função showSignupForm()', pattern: 'function showSignupForm()' },
  { name: 'Função showLoginForm()', pattern: 'function showLoginForm()' },
  { name: 'Função showSignupConfirmation()', pattern: 'function showSignupConfirmation()' },
  { name: 'Função showSignupError()', pattern: 'function showSignupError(message)' },
  { name: 'Validação: senhas iguais', pattern: 'password !== passwordConfirm' },
  { name: 'Validação: mínimo 6 caracteres', pattern: 'password.length < 6' },
  { name: 'Import signup do auth.js', pattern: "import { login, signup }" },
  { name: 'Event listener: btn-signup', pattern: "getElementById('btn-signup')" },
];

let jsPassed = 0;
for (const check of jsChecks) {
  if (uiLogin.includes(check.pattern)) {
    console.log(`  ✅ ${check.name}`);
    jsPassed++;
  } else {
    console.log(`  ❌ ${check.name} — NÃO ENCONTRADO`);
  }
}

console.log(`\n🧬 JavaScript: ${jsPassed}/${jsChecks.length} implementações presentes\n`);

// Resultado final
const totalPassed = htmlPassed + jsPassed;
const totalChecks = checks.length + jsChecks.length;
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
if (totalPassed === totalChecks) {
  console.log(`✅ Todas as validações passaram! (${totalPassed}/${totalChecks})`);
  console.log(`\n🚀 Fluxo de signup pronto para testes manuais:`);
  console.log(`   1. Abra: https://precificador.ruahtecnologia.com.br`);
  console.log(`   2. Clique em "Criar conta"`);
  console.log(`   3. Preencha: email + senha (mín 6 chars) + confirmar senha`);
  console.log(`   4. Clique em "Criar conta"`);
  console.log(`   5. Verifique a tela de confirmação de email`);
  console.log(`   6. Abra o seu email e clique no link de confirmação`);
  console.log(`   7. Volte e faça login com as credenciais`);
  process.exit(0);
} else {
  console.log(`❌ ${totalChecks - totalPassed} validações falharam!`);
  process.exit(1);
}
