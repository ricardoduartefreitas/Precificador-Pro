# Graph Report - Precificador-Pro  (2026-08-25)

## Corpus Check
- 50 files · ~287,594 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 534 nodes · 931 edges · 35 communities (32 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4e7a69a2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Calculator State Management
- Freemium Pro Activation
- History Management
- App Routing & Views
- Authentication & Licensing
- Formatting & Export
- Test Infrastructure
- PWA Manifest
- App Core Helpers
- Service Worker
- Resumo de Implementação — Painel Admin com Convites
- Design: Precificador Multi-Plataforma PRO 2026
- Troubleshooting: Botão "Calcular" não renderiza resultado
- Checklist de Testes
- Setup — Painel Admin com Convites
- lote-dom-smoke-test.mjs
- Precificador Marketplace 2026
- debug-calcular.js
- VISAO_DADOS — PrecificaPro como "boi de piranha" (o mapa da estratégia)
- manifest.json
- test-auth-flow.js
- 🗺️ ARQUITETURA DO PRECIFICAPRO — a estrutura DEFINIDA (criado 17/08/2026)
- package.json
- test-signup.mjs
- README.md
- index.ts
- freemium.js
- admin.js

## God Nodes (most connected - your core abstractions)
1. `getSupabase()` - 36 edges
2. `showToast()` - 17 edges
3. `_initCalcView()` - 12 edges
4. `Design: Precificador Multi-Plataforma PRO 2026` - 12 edges
5. `Edge Function: send-invite` - 12 edges
6. `getCurrentUserId()` - 11 edges
7. `_loadAndRender()` - 11 edges
8. `calcular()` - 10 edges
9. `initAuth()` - 10 edges
10. `initOnboarding()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `testCenario()` --calls--> `calcular()`  [EXTRACTED]
  tests/test-frete-condicional.js → js/calculator.js
- `_bindProActivation()` --calls--> `showToast()`  [EXTRACTED]
  js/freemium.js → js/ui.js
- `registerCalculo()` --calls--> `showToast()`  [EXTRACTED]
  js/freemium.js → js/ui.js
- `_baixarResultados()` --calls--> `showToast()`  [EXTRACTED]
  js/lote.js → js/ui.js
- `_handleFileUpload()` --calls--> `showToast()`  [EXTRACTED]
  js/lote.js → js/ui.js

## Import Cycles
- None detected.

## Communities (35 total, 3 thin omitted)

### Community 0 - "Calculator State Management"
Cohesion: 0.12
Nodes (41): _aplicarSugestaoImposto(), _ATIVIDADE_LABEL, _bindCalcInputChange(), _bindComparInputChange(), _bindGlobalModals(), _buildFilterChips(), _clearCalcResult(), closeModalSalvar() (+33 more)

### Community 1 - "Freemium Pro Activation"
Cohesion: 0.16
Nodes (25): getCurrentUserEmail(), getCurrentUserId(), refreshOnboardingStatus(), _currentRoute(), _firstIncompleteStep(), _handleAvancar(), _handleVoltar(), _hideError() (+17 more)

### Community 2 - "History Management"
Cohesion: 0.22
Nodes (15): boot(), PLATAFORMAS, isLoggedIn(), isOnboardingComplete(), getViews(), HIDE_HEADER_ROUTES, initRouter(), navigate() (+7 more)

### Community 3 - "App Routing & Views"
Cohesion: 0.19
Nodes (19): isAdmin(), BRL, formatBRL(), formatPct(), PCT, _currentRoute(), _esc(), _filtros() (+11 more)

### Community 4 - "Authentication & Licensing"
Cohesion: 0.13
Nodes (29): _categorias, CEP_REGIOES, _currentRoute(), deriveRegiaoFromCep(), _esc(), _handleApagarProduto(), _handleCalcularProduto(), _handleEditarProduto() (+21 more)

### Community 5 - "Formatting & Export"
Cohesion: 0.07
Nodes (40): _ALIQUOTAS_PRESUMIDO, _ALIQUOTAS_SIMPLES, calcular(), calcularComDesconto(), calcularFretePorRegra(), comparar(), identificarFaixa(), mapPlataformaToInputs() (+32 more)

### Community 6 - "Test Infrastructure"
Cohesion: 0.23
Nodes (13): _barra(), BASE_INPUTS, brl(), CALC_INPUTS_ML, dim(), __dirname, err(), h1() (+5 more)

### Community 7 - "PWA Manifest"
Cohesion: 0.09
Nodes (18): assert(), calculadas, casosIndividuais, comErro, contadorAntes, contadorDepois, csvExportado, __dirname (+10 more)

### Community 9 - "App Core Helpers"
Cohesion: 0.10
Nodes (20): 1. Tabela `invites_log` (opcional), 2. Tabela `profiles` (deve existir), 400 Bad Request, 401 Unauthorized, 403 Forbidden, Como fazer deploy, Descrição, Edge Function: send-invite (+12 more)

### Community 12 - "Resumo de Implementação — Painel Admin com Convites"
Cohesion: 0.11
Nodes (18): 1️⃣ Deploy da Edge Function (HIGH PRIORITY), 2️⃣ Criar tabela de auditoria (OPCIONAL), 3️⃣ Executar Testes Manuais, 4️⃣ Possíveis Melhorias Futuras, 📂 Arquivos Alterados / Criados, ⏳ Backend (Estrutura criada, Deploy pendente), ✅ Checklist de Implementação, Como debugar (+10 more)

### Community 13 - "Design: Precificador Multi-Plataforma PRO 2026"
Cohesion: 0.11
Nodes (17): 1. Comparar (`#/comparar`), 2. Calcular (`#/calcular/:platform`), 3. Histórico (`#/historico`), Arquitetura, Contexto, Decisões de produto, Design: Precificador Multi-Plataforma PRO 2026, Estrutura de arquivos (+9 more)

### Community 14 - "Troubleshooting: Botão "Calcular" não renderiza resultado"
Cohesion: 0.11
Nodes (17): Causa 1: Service Worker servindo código antigo (50%), Causa 2: Elemento não existe ou foi alterado (20%), Causa 3: Handler não registrado (15%), Causa 4: Browser problema (10%), Causa 5: Lógica silenciosamente falhando (5%), Causas possíveis (ordenadas por probabilidade), ✓ Elementos HTML existem, ✓ Freemium não bloqueia (+9 more)

### Community 15 - "Checklist de Testes"
Cohesion: 0.12
Nodes (16): Checklist de Testes, Checklist Final, Debug: Verificar role do usuário, Debug: Verificar view admin, Debug: Verificar visibilidade da tab, Próximos Passos, Resultados, ✅ Teste 1: Login como Admin (+8 more)

### Community 16 - "Setup — Painel Admin com Convites"
Cohesion: 0.13
Nodes (14): 1. Acesso ao projeto Supabase, 2. Criar a função via CLI ou Dashboard, 3. Atualizar permissões RLS (opcional), 4. Testar a implementação, Como criar a Edge Function no Supabase, Opção A: Via Dashboard Supabase (mais rápido), Opção B: Via CLI (Supabase CLI), Próximos passos (+6 more)

### Community 17 - "lote-dom-smoke-test.mjs"
Cohesion: 0.15
Nodes (9): assert(), __dirname, elements, err(), fakeFile, inputOriginalClick, ok(), PLATAFORMAS (+1 more)

### Community 18 - "Precificador Marketplace 2026"
Cohesion: 0.17
Nodes (11): Arquitetura resumida, Escopo, Mercado Livre, O que falta / pendências, O que foi implementado (sessão Jun/2026), Precificador Marketplace 2026, Regra de deploy, Shopee (vigente desde 01/03/2026) (+3 more)

### Community 19 - "debug-calcular.js"
Cohesion: 0.17
Nodes (11): btnCalcular, calcResult, __dirname, dom, html, htmlPath, inputs, platSelect (+3 more)

### Community 20 - "VISAO_DADOS — PrecificaPro como "boi de piranha" (o mapa da estratégia)"
Cohesion: 0.17
Nodes (11): 1. O FLUXO EM 3 CAMADAS, 2. CAMADA 1 — CADASTRO (obrigatório para usar — 3 passos, sem espantar), 3. CAMADA 2 — USO (o ouro — coleta automática, sem o usuário fazer nada), 4.1. Lead scoring automático (prioridade), 4.2. Cruzamentos estratégicos, 4.3. LGPD (a régua), 4. CAMADA 3 — INTELIGÊNCIA (o que a Ruah ganha), 5. UPGRADE DO PRODUTO (a consequência natural — o cadastro melhora o cálculo) (+3 more)

### Community 21 - "manifest.json"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, name, orientation, scope, short_name (+2 more)

### Community 22 - "test-auth-flow.js"
Cohesion: 0.18
Nodes (10): appCode, appJsPath, authCode, authJsPath, __dirname, initAuthIndex, initRouterIndex, loginMatch (+2 more)

### Community 23 - "🗺️ ARQUITETURA DO PRECIFICAPRO — a estrutura DEFINIDA (criado 17/08/2026)"
Cohesion: 0.20
Nodes (9): 1. VISÃO GERAL, 2. OS ARQUIVOS (as responsabilidades!), 3. O FLUXO DO BOOT (a ordem — o app.js!), 4. O FLUXO DO AUTH (o auth.js!), 5. AS ROTAS (o router.js!), 6. AS VIEWS (o index.html!), 7. OS PONTOS DE ATENÇÃO (as lições de 16/08!), 8. O QUE NÃO MEXER SEM O MAPA (+1 more)

### Community 24 - "package.json"
Cohesion: 0.25
Nodes (7): description, name, scripts, test, test:smoke, type, version

### Community 25 - "test-signup.mjs"
Cohesion: 0.29
Nodes (6): checks, html, htmlPath, jsChecks, uiLogin, uiLoginPath

### Community 34 - "freemium.js"
Cohesion: 0.15
Nodes (23): formatDate(), formatGroupLabel(), _bindProActivation(), canCalculate(), _checkPro(), getUsageCount(), initFreemium(), isPro() (+15 more)

### Community 35 - "admin.js"
Cohesion: 0.08
Nodes (51): _esc(), _handleSendInvite(), initAdminPanel(), _isValidEmail(), _loadConvidados(), _loadLeadScore(), _auth, AUTH_LISTENERS (+43 more)

## Knowledge Gaps
- **205 isolated node(s):** `_PLATAFORMAS`, `_REGIME_LABEL`, `_ATIVIDADE_LABEL`, `APP_SHELL`, `_ALIQUOTAS_SIMPLES` (+200 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getCurrentUserId()` connect `Freemium Pro Activation` to `admin.js`, `Authentication & Licensing`, `Formatting & Export`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `showToast()` connect `Authentication & Licensing` to `Calculator State Management`, `freemium.js`, `Formatting & Export`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `_initCalcView()` (e.g. with `_handleCalcular()` and `openModalSalvar()`) actually correct?**
  _`_initCalcView()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `_PLATAFORMAS`, `_REGIME_LABEL`, `_ATIVIDADE_LABEL` to the rest of the system?**
  _205 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Calculator State Management` be split into smaller, more focused modules?**
  _Cohesion score 0.11614401858304298 - nodes in this community are weakly interconnected._
- **Should `Authentication & Licensing` be split into smaller, more focused modules?**
  _Cohesion score 0.13068181818181818 - nodes in this community are weakly interconnected._
- **Should `Formatting & Export` be split into smaller, more focused modules?**
  _Cohesion score 0.07493061979648474 - nodes in this community are weakly interconnected._