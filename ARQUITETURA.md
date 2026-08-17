# 🗺️ ARQUITETURA DO PRECIFICAPRO — a estrutura DEFINIDA (criado 17/08/2026)

> **A RÉGUA (o Ricardo): entender a estrutura ANTES de mexer — nunca sair fazendo fixes às cegas (o que quebra o próximo)!**
> Este documento é o mapa COMPLETO — consultar SEMPRE antes de qualquer alteração!

## 1. VISÃO GERAL
- **App SPA** (Single Page Application) — sem framework, JS puro com módulos ES6!
- **PWA** com service worker (cache offline)!
- **O backend**: Supabase (auth + dados) — o projeto `ztzbqmbnlqafsazvwjyw`!
- **O deploy**: GitHub Actions → GitHub Pages → `precificador.ruahtecnologia.com.br` (com Cloudflare no meio — o cache pode segurar as versões antigas!)

## 2. OS ARQUIVOS (as responsabilidades!)
| Arquivo | Responsabilidade |
|---|---|
| `index.html` | O esqueleto: as VIEWS (view-login, view-calcular, view-comparar, view-historico, view-admin-panel!) + o SDK do Supabase (CDN!) |
| `sw.js` | O service worker: o cache offline (Cache First para os assets, Network First para a navegação — o psp-v5!) |
| `js/app.js` | O BOOT: a ordem de inicialização (o router → o supabase → o auth → a UI!) |
| `js/router.js` | As ROTAS: o parse do hash, a proteção (públicas vs protegidas), o showView (o getViews() — os elementos buscados SEMPRE!) |
| `js/auth.js` | O AUTH: o `_auth` (session/user/role!), o initAuth, o login, o logout, o isLoggedIn, o onAuthChange (os listeners!) |
| `js/supabase.js` | O CLIENTE: o initSupabase (a URL + a anon key!), o signIn, o signOut, o getUserRole |
| `js/ui-login.js` | A UI DO LOGIN: o initLoginUI (os listeners do form!), o reset de senha |
| `js/ui-invite-accept.js` | O CONVITE: o checkInviteLink (o fluxo do aceite!) |
| `js/ui.js` | A UI PRINCIPAL: as 3 views (calcular, comparar, histórico!) |
| `js/state.js` | O ESTADO global (o setState!) |
| `js/calculator.js` | O MOTOR de cálculo (as plataformas!) |
| `js/formatter.js` | A formatação (BRL, %, datas!) |
| `js/freemium.js` | O limite dos 30 cálculos grátis |
| `js/history.js` | O histórico + o CSV |
| `js/admin.js` | O painel admin |
| `platforms/*.js` | As 5 plataformas (ML, Shopee, Amazon, TikTok, Shein!) |

## 3. O FLUXO DO BOOT (a ordem — o app.js!)
1. **O serviceWorker.register** (o SW!)
2. **O initRouter()** — o router NO TOPO (o fix 16/08: a tela aparece SEMPRE — o router NÃO depende do Supabase!)
3. **A GARANTIA FINAL** — o remove do hidden da view-login (SEM condição — o login aparece SEMPRE!)
4. **O getInputs/setState** (o estado inicial!)
5. **O await initSupabase()** (o cliente!)
6. **O checkInviteLink()** (o convite na URL!)
7. **O try { await initAuth() } catch** (o auth — o try/catch para NUNCA travar o boot!)
8. **O onAuthChange** (os listeners: sessão → a UI! · sem sessão → o login!)

## 4. O FLUXO DO AUTH (o auth.js!)
- **O `_auth`**: { session: null, user: null, role: null } — o estado inicial SEMPRE null!
- **O initAuth()**: o getSession → se inválida → o signOut + o _auth = null + o notifyListeners (o log "Sessão inválida")! · se válida → o _auth = session + o getUserRole!
- **O login()**: o signIn (o Supabase!) → o _auth = session → o getUserRole → o notifyListeners!
- **O logout()**: o signOut → o _auth = null → o notifyListeners → o onAuthChange → o initLoginUI + o hash = '#/login'!
- **O onAuthChange()**: o callback é chamado IMEDIATAMENTE (o line 21!) + a cada mudança!

## 5. AS ROTAS (o router.js!)
- **As públicas**: `#/login`, `#/aceitar-convite`!
- **As protegidas**: `#/comparar`, `#/calcular`, `#/historico` (o redirect para o login sem a sessão!)
- **O admin**: `#/admin-panel` (só o admin!)
- **O parseRoute**: o hash → { route, param } (o query limpo!)
- **O showView**: o getViews() (os elementos buscados SEMPRE!) + o toggle('hidden')!

## 6. AS VIEWS (o index.html!)
- `#view-login` — o formulário de login + o aceitar-convite (os cards: login-form-card + invite-accept-card!)
- `#view-calcular` — a calculadora!
- `#view-comparar` — o comparador!
- `#view-historico` — o histórico!
- `#view-admin-panel` — o painel admin!
- O CSS: `.view { display: none }` + `.view:not(.hidden) { display: flex }` + `.hidden { display: none !important }`!

## 7. OS PONTOS DE ATENÇÃO (as lições de 16/08!)
- **O SW + o Cloudflare**: o cache pode servir as versões antigas — o diagnóstico: o fetch com o cache-busting (`?v=Date.now()`)! O usuário: o Ctrl+shift+r!
- **O login() NUNCA esquece de navegar**: após o login/sessão, o onAuthChange DEVE ir para `#/calcular` (o ui-login não redireciona sozinho — o comentário 'o auth listener vai redirecionar' era mentira!) — FIX 17/08!
- **O showView NUNCA processa a view-login 2×**: 'login' e 'aceitar-convite' são a MESMA view (`#view-login`) — o forEach com o toggle simples re-adicionava o hidden (a 1ª visita SEMPRE escondia o login; o reload funcionava por acaso!) — FIX 17/08: o isLoginRoute/isLoginView!
- **O router NUNCA pode depender do Supabase** (o boot: o router no TOPO + a garantia final do remove do hidden!)
- **O rate limit do Supabase Free**: os emails ~1/h + as tentativas de login podem ser limitadas (o "Too many requests" — aguardar uns minutos!)
- **O VIEWS do router**: SEMPRE via getViews() (nunca na carga do módulo — o DOM pode não estar pronto!)
- **O initAuth**: SEMPRE no try/catch (o boot nunca pode travar!)
- **O auth RLS**: a segurança é no banco (a anon key é pública!)

## 8. O QUE NÃO MEXER SEM O MAPA
- A ordem do boot (o initRouter ANTES do auth!)
- O getViews() do router
- O try/catch do initAuth
- O Network First do SW (a navegação!)
- O fluxo do aceite do convite (o aceitar-convite NUNCA redireciona!)
