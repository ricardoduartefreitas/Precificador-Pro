// tests/smoke-test.js — PrecificaPRO
// Smoke test: verifica que calcular() e comparar() retornam resultados válidos
// para cada plataforma. Rode com: node tests/smoke-test.js

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// ─── helpers de console ───────────────────────────────────────────────────
const RESET  = '\x1b[0m';
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';

const ok  = (msg) => console.log(`${GREEN}✓${RESET} ${msg}`);
const err = (msg) => console.log(`${RED}✗ ERRO: ${msg}${RESET}`);
const h1  = (msg) => console.log(`\n${BOLD}${CYAN}══ ${msg} ══${RESET}`);
const h2  = (msg) => console.log(`\n${YELLOW}── ${msg}${RESET}`);
const dim = (msg) => console.log(`${DIM}  ${msg}${RESET}`);

const brl = (n) => `R$ ${Number(n).toFixed(2).replace('.', ',')}`;
const pct = (n) => `${Number(n).toFixed(1)}%`;

// ─── inputs base do teste ────────────────────────────────────────────────
const BASE_INPUTS = {
  custoProduto:     50,
  custoFrete:       10,
  custosAdicionais:  0,
  margemLucro:      20,
  imposto:           6,
};

// inputs para calcular() individual (requer comissao e taxaAnuncio explícitos)
const CALC_INPUTS_ML = {
  ...BASE_INPUTS,
  comissaoPlataforma: 14,
  taxaAnuncio:        16,
};

// ─── main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${BOLD}PrecificaPRO — Smoke Test${RESET}`);
  console.log(`Node ${process.version}  |  ${new Date().toLocaleString('pt-BR')}`);

  // Importação dinâmica dos módulos ESM
  const [
    { calcular, calcularComDesconto, comparar, mapPlataformaToInputs },
    { default: ml },
    { default: shopee },
    { default: amazon },
    { default: tiktok },
    { default: shein },
  ] = await Promise.all([
    import(`${root}/js/calculator.js`),
    import(`${root}/platforms/mercadolivre.js`),
    import(`${root}/platforms/shopee.js`),
    import(`${root}/platforms/amazon.js`),
    import(`${root}/platforms/tiktok.js`),
    import(`${root}/platforms/shein.js`),
  ]);

  const plataformas = [ml, shopee, amazon, tiktok, shein];

  // ═══════════════════════════════════════════════════════════════
  // BLOCO 1 — calcular() com inputs fixos (ML como referência)
  // ═══════════════════════════════════════════════════════════════
  h1('BLOCO 1 — calcular() individual (ML, CNPJ, faixa R$80–R$199)');

  console.log(`\n  Inputs: custoProduto=${BASE_INPUTS.custoProduto} | custoFrete=${BASE_INPUTS.custoFrete} | margem=${BASE_INPUTS.margemLucro}% | imposto=${BASE_INPUTS.imposto}%`);
  console.log(`  Taxas ML CNPJ: comissão=14% | taxaAnuncio=R$16`);

  const r1 = calcular(CALC_INPUTS_ML);

  if (!r1) {
    err('calcular() retornou null para inputs ML válidos');
  } else {
    ok('calcular() retornou resultado não-nulo');
    console.log(`\n  ${BOLD}precoVenda:${RESET}      ${GREEN}${brl(r1.precoVenda)}${RESET}`);
    console.log(`  ${BOLD}precoMinimo:${RESET}     ${brl(r1.precoMinimo)}`);
    console.log(`  ${BOLD}lucroLiquido:${RESET}    ${GREEN}${brl(r1.lucroLiquido)}${RESET}`);
    console.log(`  ${BOLD}lucroPercentual:${RESET} ${pct(r1.lucroPercentual)}`);
    console.log(`  ${BOLD}custoTotal:${RESET}      ${brl(r1.custoTotal)}`);
    console.log(`\n  Breakdown:`);
    dim(`comissaoValor:    ${brl(r1.breakdown.comissaoValor)}`);
    dim(`impostoValor:     ${brl(r1.breakdown.impostoValor)}`);
    dim(`taxaAnuncioValor: ${brl(r1.breakdown.taxaAnuncioValor)}`);
    dim(`freteValor:       ${brl(r1.breakdown.freteValor)}`);
    dim(`margemValor:      ${brl(r1.breakdown.margemValor)}`);
    dim(`totalDeducoes:    ${brl(r1.breakdown.totalDeducoes)}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // BLOCO 2 — calcularComDesconto() 15% de campanha
  // ═══════════════════════════════════════════════════════════════
  h1('BLOCO 2 — calcularComDesconto() com 15% de desconto');

  const r2 = calcularComDesconto(CALC_INPUTS_ML, 15);

  if (!r2) {
    err('calcularComDesconto() retornou null para desconto 15%');
  } else {
    ok('calcularComDesconto() retornou resultado não-nulo');
    console.log(`\n  Preço sem desconto:  ${brl(r2.precoSemDesconto)}`);
    console.log(`  Desconto (15%):     -${brl(r2.breakdown.descontoValor)}`);
    console.log(`  ${BOLD}Preço com desconto:  ${GREEN}${brl(r2.precoVenda)}${RESET}`);
    console.log(`  lucroLiquido:        ${brl(r2.lucroLiquido)}`);
    console.log(`  lucroPercentual:     ${pct(r2.lucroPercentual)}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // BLOCO 3 — calcular() individual para cada plataforma
  // ═══════════════════════════════════════════════════════════════
  h1('BLOCO 3 — calcular() individual por plataforma');

  for (const plat of plataformas) {
    h2(plat.nome);

    const tipoVendedor = Object.keys(plat.faixas)[0];
    const inputs = mapPlataformaToInputs(BASE_INPUTS, plat, tipoVendedor, false);

    if (!inputs) {
      err(`${plat.nome} — mapPlataformaToInputs() retornou null`);
      continue;
    }

    const r = calcular(inputs);

    if (!r) {
      err(`${plat.nome} retornou null`);
    } else {
      ok(`${plat.nome} (${tipoVendedor}) — faixa: ${inputs._faixaLabel}`);
      console.log(`   precoVenda:      ${GREEN}${brl(r.precoVenda)}${RESET}`);
      console.log(`   lucroLiquido:    ${GREEN}${brl(r.lucroLiquido)}${RESET}`);
      console.log(`   lucroPercentual: ${pct(r.lucroPercentual)}`);
      dim(`comissão: ${pct(inputs.comissaoPlataforma)} | taxaAnuncio: ${brl(inputs.taxaAnuncio)} | imposto: ${pct(inputs.imposto)}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // BLOCO 4 — comparar() com as 5 plataformas simultaneamente
  // ═══════════════════════════════════════════════════════════════
  h1('BLOCO 4 — comparar() ranking das 5 plataformas');

  const ranking = comparar(BASE_INPUTS, plataformas, null, false);

  if (!ranking || ranking.length === 0) {
    err('comparar() retornou array vazio ou null');
  } else {
    ok(`comparar() retornou ${ranking.length} resultados`);

    const maxLucro = ranking[0].lucroLiquido;

    console.log('');
    ranking.forEach((r, i) => {
      const pos   = i === 0 ? `${BOLD}${GREEN}#1 🏆${RESET}` : `${DIM}#${i + 1}${RESET}`;
      const barra = _barra(r.lucroLiquido, maxLucro, 20);
      const nome  = String(r.nome).padEnd(14);
      console.log(`  ${pos}  ${nome}  ${GREEN}${brl(r.precoVenda).padStart(11)}${RESET}  lucro ${GREEN}${brl(r.lucroLiquido).padStart(10)}${RESET}  margem ${pct(r.lucroPercentual).padStart(6)}  ${barra}`);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // BLOCO 5 — casos de validação (inputs inválidos)
  // ═══════════════════════════════════════════════════════════════
  h1('BLOCO 5 — validação de inputs inválidos');

  const casos = [
    { label: 'null',                        input: null,                                           esperado: null },
    { label: 'taxas somam 100%',            input: { ...CALC_INPUTS_ML, margemLucro: 80, imposto: 20 }, esperado: null },
    { label: 'campo negativo',              input: { ...CALC_INPUTS_ML, custoProduto: -1 },         esperado: null },
    { label: 'campo string',               input: { ...CALC_INPUTS_ML, custoFrete: 'abc' },         esperado: null },
    { label: 'desconto >= 100%',           input: CALC_INPUTS_ML,                                   desconto: 100 },
  ];

  for (const caso of casos) {
    if (caso.desconto !== undefined) {
      const r = calcularComDesconto(caso.input, caso.desconto);
      r === null
        ? ok(`calcularComDesconto("${caso.label}") → null (esperado)`)
        : err(`calcularComDesconto("${caso.label}") deveria retornar null, retornou ${JSON.stringify(r)}`);
    } else {
      const r = calcular(caso.input);
      r === null
        ? ok(`calcular("${caso.label}") → null (esperado)`)
        : err(`calcular("${caso.label}") deveria retornar null, retornou ${JSON.stringify(r)}`);
    }
  }

  // ─── sumário ───────────────────────────────────────────────────
  console.log(`\n${BOLD}${'─'.repeat(56)}${RESET}`);
  console.log(`${GREEN}${BOLD}Smoke test concluído.${RESET}\n`);
}

function _barra(valor, max, tamanho) {
  if (max <= 0) return '';
  const preenchido = Math.round((valor / max) * tamanho);
  return `${GREEN}${'█'.repeat(Math.max(0, preenchido))}${DIM}${'░'.repeat(tamanho - Math.max(0, preenchido))}${RESET}`;
}

main().catch((e) => {
  console.error(`\n${RED}Erro fatal no smoke test:${RESET}`, e);
  process.exit(1);
});
