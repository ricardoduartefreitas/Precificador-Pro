// tests/lote-smoke-test.mjs — PrecificaPRO
// Teste funcional REAL da FASE 1 (conta em lote via CSV) — importa o código de
// PRODUÇÃO (js/lote.js, js/calculator.js, js/freemium.js, platforms/*.js) e o
// exercita de ponta a ponta: parseCSV → processarLinha (motor real) → toCSV.
// Não reimplementa nenhuma regra — só orquestra o que já está no bundle.
//
// Rode com: node tests/lote-smoke-test.mjs

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const RESET = '\x1b[0m', GREEN = '\x1b[32m', RED = '\x1b[31m', YELLOW = '\x1b[33m', CYAN = '\x1b[36m', BOLD = '\x1b[1m', DIM = '\x1b[2m';
const ok  = (msg) => console.log(`${GREEN}✓${RESET} ${msg}`);
const err = (msg) => console.log(`${RED}✗ ERRO: ${msg}${RESET}`);
const h1  = (msg) => console.log(`\n${BOLD}${CYAN}══ ${msg} ══${RESET}`);
const dim = (msg) => console.log(`${DIM}  ${msg}${RESET}`);

let falhas = 0;
function assert(cond, msg) {
  if (cond) { ok(msg); } else { err(msg); falhas++; }
}

// ─── stub mínimo de localStorage (Node não tem) — só para exercitar o freemium.js REAL ──
class LocalStorageStub {
  constructor() { this._data = {}; }
  getItem(k)    { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; }
  setItem(k, v) { this._data[k] = String(v); }
  removeItem(k) { delete this._data[k]; }
}
global.localStorage = new LocalStorageStub();

// showToast/openOverlayPro/updatePlanBadge (ui.js) tocam document só dentro de function
// bodies — como lote.js/freemium.js só chamam essas funções via clique/evento (que este
// teste não dispara), a importação do módulo real não precisa de DOM.

const { calcular, mapPlataformaToInputs } = await import(path.join(root, 'js/calculator.js'));
const { processarLinha, parseCSV, toCSV } = await import(path.join(root, 'js/lote.js'));
const { canCalculate, getUsageCount, registerCalculo } = await import(path.join(root, 'js/freemium.js'));

const ML     = (await import(path.join(root, 'platforms/mercadolivre.js'))).default;
const Shopee = (await import(path.join(root, 'platforms/shopee.js'))).default;
const Amazon = (await import(path.join(root, 'platforms/amazon.js'))).default;
const TikTok = (await import(path.join(root, 'platforms/tiktok.js'))).default;
const Shein  = (await import(path.join(root, 'platforms/shein.js'))).default;

const PLATAFORMAS = [ML, Shopee, Amazon, TikTok, Shein]; // mesma composição de app.js

// ─── CSV de teste (exatamente o cenário do briefing) ─────────────────────
// 3 linhas válidas + 1 com erro (custo vazio) + 1 com margem=200 (inválida)
const CSV_TESTE =
`produto;custo;peso_kg;margem;plataforma;tipo_anuncio
Fone Bluetooth;35,00;0,3;25;tiktok;padrao
Capinha Celular;12,50;0,1;30;shopee;cnpj
Carregador Turbo;28,90;0,2;20;mercadolivre;classico_full
Sem Custo;;0,2;20;tiktok;padrao
Margem Inválida;40,00;0,3;200;tiktok;padrao`;

h1('1. parseCSV — parsing real do CSV (BOM + ; + decimal com vírgula)');

const comBOM = '﻿' + CSV_TESTE;
const linhas = parseCSV(comBOM);
assert(linhas.length === 5, `parseCSV extraiu 5 linhas de dados (obtido: ${linhas.length})`);
assert(linhas[0].produto === 'Fone Bluetooth', `linha 0 produto correto (obtido: "${linhas[0].produto}")`);
assert(linhas[0].custo === '35,00', `linha 0 custo bruto preservado como string (obtido: "${linhas[0].custo}")`);
assert(linhas[3].custo === '', `linha 3 (custo vazio) reconhecida como string vazia`);
assert(Object.keys(linhas[0]).join(',') === 'produto,custo,peso_kg,margem,plataforma,tipo_anuncio', 'header mapeado corretamente');

h1('2. processarLinha — motor REAL (calcular()/mapPlataformaToInputs()) linha a linha');

const contadorAntes = getUsageCount();
dim(`contador de cálculos ANTES do lote: ${contadorAntes}`);

const resultados = linhas.map((linha) => processarLinha(linha, PLATAFORMAS));

resultados.forEach((r, i) => {
  dim(`linha ${i} [${linhas[i].produto || '(vazio)'}] → status="${r.status}"` +
      (r.status === 'ok' ? ` precoVenda=${r.precoVenda?.toFixed(2)} lucro=${r.lucro?.toFixed(2)}` : ''));
});

const calculadas = resultados.filter((r) => r.status === 'ok');
const comErro     = resultados.filter((r) => r.status !== 'ok');

assert(calculadas.length === 3, `exatamente 3 linhas calculadas com sucesso (obtido: ${calculadas.length})`);
assert(comErro.length === 2, `exatamente 2 linhas com erro (obtido: ${comErro.length})`);
assert(resultados[3].status === 'erro: custo vazio', `linha "Sem Custo" marcada com o erro certo (obtido: "${resultados[3].status}")`);
assert(resultados[4].status.startsWith('erro:'), `linha "Margem Inválida" (200%) marcada com erro (obtido: "${resultados[4].status}")`);
assert(resultados[3].produto === 'Sem Custo' && resultados[4].produto === 'Margem Inválida', 'linhas de erro preservam o nome do produto (nunca somem do lote)');

h1('3. Equivalência com o cálculo individual (mesmo motor, mesmo resultado)');

// Reproduz o MESMO caminho que _handleCalcular() usa na tela individual, para as
// 3 linhas válidas, e compara número a número com o que processarLinha() produziu.
const casosIndividuais = [
  { linha: linhas[0], resultado: resultados[0], plat: TikTok,  tipo: 'padrao' },
  { linha: linhas[1], resultado: resultados[1], plat: Shopee,  tipo: 'cnpj' },
  { linha: linhas[2], resultado: resultados[2], plat: ML,      tipo: 'classico_full' },
];

for (const { linha, resultado, plat, tipo } of casosIndividuais) {
  const custo  = parseFloat(linha.custo.replace(',', '.'));
  const peso   = parseFloat(linha.peso_kg.replace(',', '.'));
  const margem = parseFloat(linha.margem.replace(',', '.'));

  const inputsIndividual = mapPlataformaToInputs({
    custoProduto: custo, pesoKg: peso, custosAdicionais: 0, imposto: 0, margemLucro: margem,
  }, plat, tipo, false);
  const resultadoIndividual = calcular(inputsIndividual);

  const bate = Math.abs(resultadoIndividual.precoVenda - resultado.precoVenda) < 0.001 &&
               Math.abs(resultadoIndividual.lucroLiquido - resultado.lucro) < 0.001;
  assert(bate, `${plat.id}/${tipo} (${linha.produto}): preço do lote (${resultado.precoVenda?.toFixed(2)}) ` +
    `== preço do cálculo individual (${resultadoIndividual.precoVenda?.toFixed(2)})`);
}

h1('4. Freemium — cada linha calculada conta no limite (mesmo canCalculate()/registerCalculo())');

const contadorDepois = getUsageCount();
assert(contadorDepois === contadorAntes + 3, `contador incrementou exatamente +3 (linhas OK) — antes=${contadorAntes} depois=${contadorDepois}`);
assert(canCalculate() === true, 'canCalculate() ainda permite novos cálculos (limite de dev não atingido)');

h1('5. toCSV — exportação dos resultados (BOM + ; + round-trip via parseCSV)');

const RESULT_HEADER = ['produto', 'plataforma', 'custo', 'preco_venda', 'preco_minimo', 'lucro', 'margem', 'status'];
const rows = resultados.map((r) => [r.produto, r.plataforma, r.custo ?? '', r.precoVenda ?? '', r.precoMinimo ?? '', r.lucro ?? '', r.margem ?? '', r.status]);
const csvExportado = toCSV([RESULT_HEADER, ...rows]);

assert(typeof csvExportado === 'string' && csvExportado.includes(';'), 'toCSV gera string delimitada por ";"');
assert(csvExportado.split('\n').length === 6, `toCSV gera 6 linhas (1 header + 5 dados) (obtido: ${csvExportado.split('\n').length}`);
assert(csvExportado.includes('"erro: custo vazio"'), 'linha de erro aparece no CSV exportado (nunca desaparece)');

// Round-trip: exportar → reimportar deve preservar os dados essenciais
const reimportado = parseCSV(csvExportado);
assert(reimportado.length === 5, 'CSV exportado é reimportável (5 linhas de dados preservadas)');
assert(reimportado[0].produto === 'Fone Bluetooth' && reimportado[0].status === 'ok', 'round-trip preserva produto/status da linha 0');

h1('RESULTADO');
if (falhas === 0) {
  console.log(`${BOLD}${GREEN}TODOS OS TESTES PASSARAM${RESET}\n`);
  process.exit(0);
} else {
  console.log(`${BOLD}${RED}${falhas} TESTE(S) FALHARAM${RESET}\n`);
  process.exit(1);
}
