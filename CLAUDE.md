# Precificador Marketplace 2026

## Status atual
- App SPA completo: 3 views (Calcular, Comparar, Histórico)
- Motor de cálculo validado (smoke-test 5/5 plataformas)
- PWA com service worker (cache psp-v2, offline-first)
- Deploy automático via GitHub Actions → precificador.ruahtecnologia.com.br

## Escopo
Precificador cobrindo 5 plataformas: ML, Shopee, Amazon, TikTok, Shein
Funcionalidades: modo comparação, calculadora individual, histórico CSV

## Regra de deploy

Após qualquer alteração de código, sempre rodar:

```bash
git add . && git commit -m 'descrição da alteração' && git push origin main
```

O deploy é automático via GitHub Actions após o push.

## O que foi implementado (sessão Jun/2026)

### Mercado Livre
- Tipos de anúncio: Clássico (11%) e Premium (19%)
- 4 opções de logística: Full, Drop Off (sem taxa fixa), Normal e Flex (R$4 abaixo de R$79,99)
- Chave combinada `tipoAnuncio_logistica` no objeto `faixas`
- Campanha = Product Ads (2,5%) exibido como linha separada no extrato
- Select de Logística adicionado no HTML e gerenciado por `_updateLogisticaSelect()`
- Aviso obrigatório em amarelo: "⚠️ Comissões podem variar por categoria"

### Shopee (vigente desde 01/03/2026)
- CNPJ: 16% / 15% / 13% / 12% por faixa de preço
- CPF iniciante (<450 pedidos/90d): taxa FIXA em R$ (R$4 / R$16 / R$20 / R$26) — sem percentual
- CPF experiente (>450 pedidos/90d): % do CNPJ + R$3 adicional por item
- Linha de comissão R$0 filtrada automaticamente do extrato

### Sistema de avisos de plataforma
- `plat.aviso` + `plat.avisoTipo` ('warning' | 'error') nas configs de cada plataforma
- CSS: `.plat-aviso` (amarelo) e `.plat-aviso--error` (vermelho)
- Amazon/TikTok: aviso amarelo (estimativa)
- Shein: aviso vermelho (não confirmado — portal inacessível)

## O que falta / pendências

| Plataforma | Pendência |
|---|---|
| Amazon | Taxas reais por categoria — validar no Seller Central BR (requer login) |
| TikTok | Confirmar taxa atual em seller-br.tiktok.com (requer login) |
| Shein | Portal do seller não acessível — contatar suporte Shein BR |
| Comparador | View #/comparar não reflete taxa fixa em R$ (CPF iniciante Shopee) |

## Arquitetura resumida

```
js/
  app.js          — entry point, injeta plataformas no UI
  ui.js           — 3 views, renderResultHero, renderExtrato, renderComparacao
  calculator.js   — mapPlataformaToInputs, calcular, calcularComDesconto, comparar
  state.js        — estado global (setState = Object.assign)
  formatter.js    — formatBRL, formatPct, formatDate, parseInputValue
  history.js      — localStorage, CSV export
  freemium.js     — 30 cálculos grátis, SHA-256 PRO

platforms/
  mercadolivre.js — 8 faixas combinadas (tipoAnuncio_logistica)
  shopee.js       — 3 tipos de vendedor, faixas por preço
  amazon.js       — FBA/FBM, estimativas
  tiktok.js       — taxa única, fase expansão
  shein.js        — taxa estimada, aviso vermelho
```
