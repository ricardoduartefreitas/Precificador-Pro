// tests/lote-dom-smoke-test.mjs — PrecificaPRO
// Complementa lote-smoke-test.mjs: exercita a camada de DOM real de js/lote.js
// (initLote → wiring de eventos → upload simulado → renderização da tabela →
// download do template e dos resultados) usando um stub mínimo de document/
// FileReader/URL — não reimplementa lote.js, só simula o navegador ao redor dele.
//
// Rode com: node tests/lote-dom-smoke-test.mjs
// (processo separado do lote-smoke-test.mjs para não conflitar com o stub de DOM)

import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const RESET = '\x1b[0m', GREEN = '\x1b[32m', RED = '\x1b[31m', CYAN = '\x1b[36m', BOLD = '\x1b[1m', DIM = '\x1b[2m';
const ok  = (msg) => console.log(`${GREEN}✓${RESET} ${msg}`);
const err = (msg) => console.log(`${RED}✗ ERRO: ${msg}${RESET}`);
const h1  = (msg) => console.log(`\n${BOLD}${CYAN}══ ${msg} ══${RESET}`);
const dim = (msg) => console.log(`${DIM}  ${msg}${RESET}`);

let falhas = 0;
function assert(cond, msg) { if (cond) ok(msg); else { err(msg); falhas++; } }

// ─── stubs mínimos de navegador ───────────────────────────────────────────
global.localStorage = (() => {
  const data = {};
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
  };
})();

function makeFakeElement(id) {
  const listeners = {};
  return {
    id,
    value: '',
    files: [],
    innerHTML: '',
    textContent: '',
    className: '',
    style: {},
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); },
    },
    addEventListener(evt, fn) { (listeners[evt] ||= []).push(fn); },
    _fire(evt, e) { (listeners[evt] || []).forEach((fn) => fn(e)); },
    click() { this._fire('click', { target: this }); },
  };
}

const elements = {};
['btn-lote-template', 'btn-lote-importar', 'lote-file-input', 'btn-lote-exportar', 'lote-tabela-wrapper', 'lote-tabela-tbody']
  .forEach((id) => { elements[id] = makeFakeElement(id); });

global.document = {
  getElementById: (id) => elements[id] || null,
  createElement: (tag) => makeFakeElement(`<${tag}>`),
};

global.FileReader = class {
  readAsText(file) {
    // síncrono o bastante para o teste — simula o evento onload do navegador real
    queueMicrotask(() => { this.result = file._content; this.onload?.(); });
  }
};

let blobsCriados = 0;
global.Blob = class {
  constructor(parts, opts) { this.parts = parts; this.type = opts?.type; blobsCriados++; }
};
global.URL.createObjectURL = () => 'blob:fake-url';
global.URL.revokeObjectURL = () => {};

// ─── importa o código de produção REAL (agora que os stubs existem) ──────
const { initLote } = await import(path.join(root, 'js/lote.js'));

const ML     = (await import(path.join(root, 'platforms/mercadolivre.js'))).default;
const Shopee = (await import(path.join(root, 'platforms/shopee.js'))).default;
const Amazon = (await import(path.join(root, 'platforms/amazon.js'))).default;
const TikTok = (await import(path.join(root, 'platforms/tiktok.js'))).default;
const Shein  = (await import(path.join(root, 'platforms/shein.js'))).default;
const PLATAFORMAS = [ML, Shopee, Amazon, TikTok, Shein];

h1('1. initLote — wiring dos event listeners nos elementos do DOM');
initLote(PLATAFORMAS);
assert(elements['btn-lote-template']._fire !== undefined, 'initLote() rodou sem lançar exceção');

h1('2. Baixar modelo CSV — clique real no botão dispara download');
elements['btn-lote-template'].click();
assert(blobsCriados === 1, `clique em "Baixar modelo CSV" criou 1 Blob (obtido: ${blobsCriados})`);

h1('3. Importar planilha — clique delega para o input de arquivo oculto');
let cliqueDelegado = false;
const inputOriginalClick = elements['lote-file-input'].click.bind(elements['lote-file-input']);
elements['lote-file-input'].click = () => { cliqueDelegado = true; inputOriginalClick(); };
elements['btn-lote-importar'].click();
assert(cliqueDelegado, 'clique em "Importar planilha" aciona o <input type=file> oculto');

h1('4. Upload simulado (change event) — parseia e calcula, popula a tabela');

const CSV_TESTE =
`produto;custo;peso_kg;margem;plataforma;tipo_anuncio
Fone Bluetooth;35,00;0,3;25;tiktok;padrao
Capinha Celular;12,50;0,1;30;shopee;cnpj
Carregador Turbo;28,90;0,2;20;mercadolivre;classico_full
Sem Custo;;0,2;20;tiktok;padrao
Margem Inválida;40,00;0,3;200;tiktok;padrao`;

const fakeFile = { name: 'teste.csv', _content: CSV_TESTE };
elements['lote-file-input'].files = [fakeFile];
elements['lote-file-input']._fire('change', { target: elements['lote-file-input'] });

// _handleFileUpload usa FileReader assíncrono (onload via microtask) — aguarda o tick
await new Promise((resolve) => setTimeout(resolve, 20));

assert(elements['lote-tabela-wrapper'].classList.contains('hidden') === false, 'tabela de resultados fica visível (.hidden removida) após o upload');

const tbodyHTML = elements['lote-tabela-tbody'].innerHTML;
const linhasTabela = (tbodyHTML.match(/<tr>/g) || []).length;
assert(linhasTabela === 5, `tabela renderizou 5 linhas (3 ok + 2 erro) (obtido: ${linhasTabela})`);
assert((tbodyHTML.match(/lote-status--ok/g) || []).length === 3, 'exatamente 3 células com classe lote-status--ok');
assert((tbodyHTML.match(/lote-status--erro/g) || []).length === 2, 'exatamente 2 células com classe lote-status--erro');
assert(tbodyHTML.includes('erro: custo vazio'), 'texto do erro "custo vazio" aparece na célula renderizada');
assert(tbodyHTML.includes('Sem Custo') && tbodyHTML.includes('Margem Inválida'), 'produtos com erro aparecem na tabela (nunca somem)');
assert(elements['lote-file-input'].value === '', 'input de arquivo é resetado após o upload (permite reimportar o mesmo arquivo)');

dim('trecho da tabela renderizada:');
console.log(DIM + tbodyHTML.trim().split('\n').slice(0, 8).join('\n') + RESET);

h1('5. Baixar resultados CSV — clique real após o lote processado');
const blobsAntes = blobsCriados;
elements['btn-lote-exportar'].click();
assert(blobsCriados === blobsAntes + 1, 'clique em "Baixar resultados CSV" cria um novo Blob de download');

h1('RESULTADO');
if (falhas === 0) {
  console.log(`${BOLD}${GREEN}TODOS OS TESTES PASSARAM${RESET}\n`);
  process.exit(0);
} else {
  console.log(`${BOLD}${RED}${falhas} TESTE(S) FALHARAM${RESET}\n`);
  process.exit(1);
}
