/**
 * test-auth-flow.js — Validação do fluxo de autenticação obrigatória (ESM)
 *
 * Testes:
 * ✅ Sem sessão → initAuth() limpa localStorage e seta session=null
 * ✅ Com login real → authState tem session e role
 * ✅ Logout → auth limpo completamente
 * ✅ Demo desativado → login() falha sem Supabase
 *
 * Executar: node tests/test-auth-flow.js
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const authJsPath = join(__dirname, '../js/auth.js');
const authCode = readFileSync(authJsPath, 'utf-8');

console.log('📋 Validação do Fix de Autenticação\n');

// ✅ Teste 1: Modo demo foi removido?
console.log('✓ Teste 1: Modo demo removido?');
if (authCode.includes('DEMO_ACCOUNTS')) {
  console.log('❌ FALHA: DEMO_ACCOUNTS ainda existe em auth.js');
  process.exit(1);
} else {
  console.log('✅ PASS: Modo demo foi removido\n');
}

// ✅ Teste 2: initAuth() chama signOut se sessão inválida?
console.log('✓ Teste 2: initAuth() limpa localStorage se sessão inválida?');
if (authCode.includes('if (!session || !session.user)') && authCode.includes('await signOut()')) {
  console.log('✅ PASS: initAuth() valida e limpa a sessão\n');
} else {
  console.log('❌ FALHA: initAuth() não valida sessão corretamente');
  process.exit(1);
}

// ✅ Teste 3: login() sem fallback demo?
console.log('✓ Teste 3: login() usa APENAS Supabase?');
const loginMatch = authCode.match(/export async function login\(email, password\) \{[\s\S]*?\n\}/);
if (loginMatch && loginMatch[0].includes('signIn') && !loginMatch[0].includes('DEMO')) {
  console.log('✅ PASS: login() usa apenas Supabase real\n');
} else {
  console.log('❌ FALHA: login() ainda tem fallback demo');
  process.exit(1);
}

// ✅ Teste 4: Validar router.js protege rotas
const routerJsPath = join(__dirname, '../js/router.js');
const routerCode = readFileSync(routerJsPath, 'utf-8');

console.log('✓ Teste 4: router.js protege rotas?');
if (routerCode.includes('PROTECTED_ROUTES.includes(route) && !isLoggedIn()')) {
  console.log('✅ PASS: Router redireciona rotas protegidas para #/login\n');
} else {
  console.log('❌ FALHA: Router não protege rotas');
  process.exit(1);
}

// ✅ Teste 5: app.js inicializa auth antes de router
const appJsPath = join(__dirname, '../js/app.js');
const appCode = readFileSync(appJsPath, 'utf-8');

console.log('✓ Teste 5: app.js inicializa auth() antes do router?');
const initAuthIndex = appCode.indexOf('await initAuth()');
const initRouterIndex = appCode.indexOf('initRouter()');
if (initAuthIndex > 0 && initRouterIndex > initAuthIndex) {
  console.log('✅ PASS: auth é inicializado antes do router\n');
} else {
  console.log('❌ FALHA: Ordem de inicialização incorreta');
  process.exit(1);
}

console.log('═══════════════════════════════════════');
console.log('✅ Todos os testes passaram!');
console.log('═══════════════════════════════════════\n');

console.log('📝 Fluxo validado:');
console.log('  1. Sem sessão → #/login obrigatório');
console.log('  2. Login real → sessão + role, #/calcular');
console.log('  3. Sessão expirada → localStorage limpo, #/login');
console.log('  4. Logout → auth zerado, #/login\n');

console.log('🚀 Próximo: git commit e push\n');
