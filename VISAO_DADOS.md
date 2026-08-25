# VISAO_DADOS — PrecificaPro como "boi de piranha" (o mapa da estratégia)

> **A visão do Ricardo (25/08/2026):** "Quanto mais pessoas usando o PrecificaPro, mais dados temos, e mais clientes em potencial teremos — para o Prep Center e para o Studio Live. O PrecificaPro vai ser nosso boi de piranha."
> **A régua:** os dados individuais ficam com a Ruah (nunca expostos) → viram inteligência → leads qualificados.

---

## 1. O FLUXO EM 3 CAMADAS

```
CAMADA 1 — CADASTRO (o que o usuário declara ao entrar)
  → CAMADA 2 — USO (o que ele revela calculando — o ouro!)
    → CAMADA 3 — INTELIGÊNCIA (o que a Ruah cruza e usa)
```

---

## 2. CAMADA 1 — CADASTRO (obrigatório para usar — 3 passos, sem espantar)

| Passo | Campo | Obrigatório | Uso futuro |
|---|---|---|---|
| **1. Identidade** | Nome | ✅ | Contato |
| | Email | ✅ | Login + contato |
| | Telefone/WhatsApp | ✅ | Contato + prospecção |
| **2. Fiscal** | **CNPJ** | ✅ | Validação + porte + formalidade |
| | **Regime tributário** (Simples / Lucro Real / Presumido) | ✅ | **Cálculo de imposto automático** + perfil |
| | Atividade principal (Anexo do Simples: comércio/indústria/serviço) | ✅ | Alíquota real do Simples |
| **3. Operação** | Quais plataformas vende (TikTok/Shopee/ML/Amazon/Shein) | ✅ | Perfil + lead do Prep Center |
| | Quantos SKUs (<10 / 10-50 / 50-200 / +200) | ✅ | Tamanho da operação |
| | Quantos pedidos/dia (<10 / 10-30 / 30-100 / +100) | ✅ | **O GANCHO — define necessidade de fulfillment** |
| | Cidade/UF | ✅ | Proximidade do Prep Center Goiânia |
| **4. Bônus (opcional)** | Tem funcionário p/ embalar? | ❌ | Dor do fulfillment |
| | Usa outro precificador? | ❌ | Concorrência + gancho de migração |

**⚠️ A régua do cadastro:** NUNCA um formulário gigante — 3 passos curtos (Identidade → Fiscal → Operação), cada passo salvo automaticamente. O usuário completa em <2 min.

---

## 3. CAMADA 2 — USO (o ouro — coleta automática, sem o usuário fazer nada)

- **Cada cálculo salvo:** produto, custo, peso, margem, plataforma, resultado (preço, lucro, breakdown)
- **Produtos calculados com frequência** → os SKUs reais que ele vende
- **Peso informado** → dado logístico (crítico para o Prep Center — define embalagem/frete)
- **Histórico de margens** → perfil de rentabilidade dele
- **Ajustes pós-cálculo** (o ouro da memória): o que ele MUDOU no resultado = o que ele realmente precisa (ex.: baixou a margem = precisa vender mais barato = opera no volume)
- **Regime tributário aplicado** → imposto real por regime

---

## 4. CAMADA 3 — INTELIGÊNCIA (o que a Ruah ganha)

### 4.1. Lead scoring automático (prioridade)
| Critério | Pontos | Ação |
|---|---|---|
| Pedidos/dia > 30 | +3 | **Lead quente Prep Center** |
| Vende TikTok/Shopee | +2 | Marketplace com fulfillment ativo |
| Cidade Goiânia/GO/região | +3 | Proximidade do galpão |
| CNPJ Simples | +2 | Empresa formal |
| Peso médio > 1kg | +1 | Precisa de embalagem especial |
| Total ≥ 6 | 🟢 | Prospeção ativa (WhatsApp) |
| Total 4-5 | 🟡 | Nutrir (email/WhatsApp) |
| Total < 4 | ⚪ | Mão fria |

### 4.2. Cruzamentos estratégicos
- **Prep Center:** pedidos/dia alto + volume + cidade = precisa de fulfillment
- **Studio Live:** quem calcula custo baixo com volume alto = precisa de produção/escala
- **Painel interno Ruah:** mapa dos vendedores por cidade/plataforma/volume — o mapa do mercado

### 4.3. LGPD (a régua)
- Dados individuais NUNCA expostos publicamente
- Termo de consentimento no cadastro (o checkbox já existe)
- Uso interno pela Ruah para contato comercial (base legítima)

---

## 5. UPGRADE DO PRODUTO (a consequência natural — o cadastro melhora o cálculo)

- **Imposto automático por regime tributário:**
  - Simples Nacional: alíquota por anexo/faixa (o usuário não sabe — as regras sabem)
  - Lucro Presumido: ~11,33% (PIS/COFINS/IRPJ/CSLL)
  - Lucro Real: presunção mínima
- **Hoje:** o campo imposto (%) é manual → **com o regime, a plataforma sugere o imposto correto automaticamente** (mantendo o campo editável para ajuste fino)
- **Isso é um upgrade real:** o cadastro deixa de ser "burocracia" e vira "o produto acertando o imposto sozinho"

---

## 6. IMPLEMENTAÇÃO (escopo p/ o CC)

- [ ] Cadastro estendido: campos CNPJ + regime + atividade + plataformas + SKUs + pedidos/dia + cidade (a tabela `profiles` do Supabase)
- [ ] Fluxo de 3 passos no aceite/primeiro login (salvar parcialmente)
- [ ] Validação de CNPJ (dígito verificador — a régua: validar antes de salvar)
- [ ] Coleta automática dos cálculos (a tabela de histórico já existe — adicionar metadados: peso, plataforma, ajustes)
- [ ] Lead scoring (campo score no profiles + regras)
- [ ] Painel interno Ruah (admin): mapa/tabela dos usuários com score (SÓ admin — a régua: dados internos)
- [ ] Imposto automático por regime (calculator.js — receber regime no input)
- [ ] Teste funcional de ponta a ponta (cadastro → cálculo → coleta → painel) ANTES de declarar pronto

---

## 7. O QUE NÃO FAZER (as réguas)
- ❌ NUNCA expor dados individuais publicamente (LGPD)
- ❌ NUNCA vender os dados
- ❌ NUNCA espantar com formulário gigante (3 passos máx)
- ❌ NUNCA bloquear o cálculo se o usuário pular o opcional (só o obrigatório trava)
- ❌ NUNCA ligar para os leads sem contexto (o primeiro contato deve citar a plataforma que ele usa)
