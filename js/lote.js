// lote.js — PrecificaPRO
// Responsabilidade: precificação em lote via CSV (baixar modelo → importar → calcular → exportar)
// FASE 1: tudo em memória do navegador — sem banco de dados
// Reusa o motor calcular()/mapPlataformaToInputs() já validado — NÃO reimplementa fórmula

import { calcular, mapPlataformaToInputs } from './calculator.js';
import { canCalculate, registerCalculo, showUpgradeOverlay } from './freemium.js';
import { showToast } from './ui.js';
import { getCurrentUserId } from './auth.js';
import { listProdutos, createProduto, createLote, insertLoteItens, insertCalculo } from './supabase.js';

const TEMPLATE_HEADER = ['produto', 'custo', 'peso_kg', 'margem', 'plataforma', 'tipo_anuncio'];
const RESULT_HEADER   = ['produto', 'plataforma', 'custo', 'preco_venda', 'preco_minimo', 'lucro', 'margem', 'status'];

const PLATAFORMAS_VALIDAS = ['tiktok', 'shopee', 'mercadolivre', 'amazon', 'shein'];
const DEFAULT_PLATAFORMA  = 'tiktok';
const DEFAULT_MARGEM      = 20;

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

let _plataformas = [];
let _ultimoResultado = []; // linhas processadas (ok + erro) — usado na exportação

// ---------- INICIALIZAÇÃO ----------

export function initLote(plataformas = []) {
  _plataformas = plataformas;

  document.getElementById('btn-lote-template')?.addEventListener('click', _baixarTemplate);

  document.getElementById('btn-lote-importar')?.addEventListener('click', () => {
    document.getElementById('lote-file-input')?.click();
  });

  document.getElementById('lote-file-input')?.addEventListener('change', _handleFileUpload);
  document.getElementById('btn-lote-exportar')?.addEventListener('click', _baixarResultados);
}

// ---------- TEMPLATE ----------

function _baixarTemplate() {
  const csv = toCSV([
    TEMPLATE_HEADER,
    ['Exemplo Produto', '29.90', '0.3', '25', 'tiktok', 'padrao'],
  ]);
  _downloadCSV(csv, 'precificapro-modelo.csv');
}

// ---------- IMPORTAÇÃO ----------

function _handleFileUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const linhas = parseCSV(String(reader.result));
    _processarLote(linhas);
  };
  reader.onerror = () => showToast('Erro ao ler o arquivo', 'error');
  reader.readAsText(file, 'utf-8');

  // Permite reimportar o mesmo arquivo em seguida
  e.target.value = '';
}

export function parseCSV(texto) {
  const limpo = texto.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const linhas = limpo.split('\n').filter((l) => l.trim() !== '');
  if (!linhas.length) return [];

  // Separador padrão BR é ';'; aceita ',' como fallback se não houver ';' no cabeçalho
  const sep = linhas[0].includes(';') ? ';' : ',';

  const header = _parseLinhaCSV(linhas[0], sep).map((h) => h.trim().toLowerCase());
  return linhas.slice(1).map((linha) => {
    const campos = _parseLinhaCSV(linha, sep);
    const obj = {};
    header.forEach((h, i) => { obj[h] = campos[i] !== undefined ? campos[i].trim() : ''; });
    return obj;
  });
}

function _parseLinhaCSV(linha, sep) {
  // Parser simples com suporte a campos entre aspas (ex: "produto; com ponto-e-vírgula")
  const campos = [];
  let atual = '';
  let dentroAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (c === '"') {
      if (dentroAspas && linha[i + 1] === '"') { atual += '"'; i++; }
      else dentroAspas = !dentroAspas;
    } else if (c === sep && !dentroAspas) {
      campos.push(atual);
      atual = '';
    } else {
      atual += c;
    }
  }
  campos.push(atual);
  return campos;
}

// ---------- VALIDAÇÃO + CÁLCULO (linha a linha — erro NUNCA derruba o lote) ----------

function _processarLote(linhas) {
  if (!linhas.length) {
    showToast('Planilha vazia ou em formato inválido', 'error');
    return;
  }

  const resultados = linhas.map((linha) => processarLinha(linha, _plataformas));
  _ultimoResultado = resultados;
  _renderTabela(resultados);

  const ok    = resultados.filter((r) => r.status === 'ok').length;
  const erros = resultados.length - ok;
  const limiteAtingido = resultados.some((r) => r.status === 'erro: limite de cálculos grátis atingido');

  showToast(`Lote processado: ${ok} calculado(s), ${erros} com erro`, ok > 0 ? 'success' : 'error');

  if (limiteAtingido) {
    showUpgradeOverlay();
  }

  // FASE 2: liga o lote ao banco (produtos/lotes/lote_itens/calculos) — não bloqueia a UI
  _persistirLote(resultados).catch((err) => console.warn('⚠️ Falha ao persistir lote:', err.message));
}

// FASE 2: cria/reaproveita produtos, registra o lote e alimenta `calculos`
// (o dado de ouro da Fase 3). Roda em segundo plano — erro aqui não derruba a UI de lote.
async function _persistirLote(resultados) {
  const userId = getCurrentUserId();
  if (!userId) return; // usuário não logado (modo demo) — nada a persistir

  const okRows = resultados.filter((r) => r.status === 'ok');
  if (!okRows.length) return;

  // Mapa nome→produto (case-insensitive) para reaproveitar produtos já cadastrados
  const produtosExistentes = await listProdutos();
  const porNome = new Map(produtosExistentes.map((p) => [p.nome.trim().toLowerCase(), p]));

  const lote = await createLote({
    user_id: userId,
    nome: `Lote CSV ${new Date().toLocaleString('pt-BR')}`,
    total_itens: okRows.length,
  });

  const itens = [];
  const calculosPendentes = [];

  for (const r of okRows) {
    const chave = r.produto.trim().toLowerCase();
    let produto = porNome.get(chave);
    if (!produto) {
      produto = await createProduto({
        user_id: userId,
        nome: r.produto,
        categoria: 'Outros', // CSV não coleta categoria — ajustável depois em "Meus Produtos"
        custo: r.custo,
        peso_kg: r.pesoKg,
        plataforma: r.plataforma,
      });
      porNome.set(chave, produto);
    }

    itens.push({
      lote_id: lote.id,
      produto_id: produto.id,
      nome_original: r.produto,
      plataforma: r.plataforma,
      custo_entrada: r.custo,
      margem_entrada: r.margem,
      preco_sugerido: r.precoVenda,
      preco_minimo: r.precoMinimo,
      status: r.status,
    });

    calculosPendentes.push({
      user_id: userId,
      produto_id: produto.id,
      plataforma: r.plataforma,
      margem_inicial: r.margem,
      preco_inicial: r.precoVenda,
      margem_final: r.margem,
      preco_final: r.precoVenda,
      ajustes_count: 0,
      origem: 'lote',
    });
  }

  await insertLoteItens(itens);

  // Fire-and-forget: cada linha do lote vira uma linha em `calculos`
  for (const payload of calculosPendentes) {
    insertCalculo(payload).catch((err) => console.warn('⚠️ Falha ao registrar cálculo do lote:', err.message));
  }
}

// Exportada (além de usada internamente) para permitir teste direto da lógica real
// via Node, sem precisar de DOM — o mesmo padrão de calculator.js, que também
// exporta helpers puros usados só internamente pela UI.
export function processarLinha(linha, plataformas = _plataformas) {
  const base = {
    produto: (linha.produto || '').trim(),
    plataforma: '',
    custo: null,
    pesoKg: null,
    precoVenda: null,
    precoMinimo: null,
    lucro: null,
    margem: null,
    status: 'ok',
  };

  if (!base.produto) return { ...base, status: 'erro: produto vazio' };

  const custo = _parseNum(linha.custo);
  if (custo === null) return { ...base, status: 'erro: custo vazio' };
  if (isNaN(custo) || custo <= 0) return { ...base, status: 'erro: custo inválido' };
  base.custo = custo;

  const pesoRaw = _parseNum(linha.peso_kg);
  const pesoKg  = pesoRaw === null ? 0 : pesoRaw;
  if (isNaN(pesoKg) || pesoKg < 0) return { ...base, status: 'erro: peso_kg inválido' };
  base.pesoKg = pesoKg;

  const margemRaw = _parseNum(linha.margem);
  const margem    = margemRaw === null ? DEFAULT_MARGEM : margemRaw;
  if (isNaN(margem) || margem < 0) return { ...base, status: 'erro: margem inválida' };
  base.margem = margem;

  const plataformaId = (linha.plataforma || DEFAULT_PLATAFORMA).trim().toLowerCase() || DEFAULT_PLATAFORMA;
  if (!PLATAFORMAS_VALIDAS.includes(plataformaId)) {
    return { ...base, status: `erro: plataforma desconhecida "${plataformaId}"` };
  }
  base.plataforma = plataformaId;

  const plat = plataformas.find((p) => p.id === plataformaId);
  if (!plat) return { ...base, status: `erro: plataforma "${plataformaId}" não carregada` };

  const tipoVendedor = _resolveTipoVendedor(plat, linha.tipo_anuncio);
  if (!tipoVendedor) {
    return { ...base, status: `erro: tipo_anuncio inválido para ${plataformaId}` };
  }

  // Freemium: cada linha calculada conta no limite — mesmo caminho do cálculo individual
  if (!canCalculate()) {
    return { ...base, status: 'erro: limite de cálculos grátis atingido' };
  }

  const calcInputs = mapPlataformaToInputs({
    custoProduto:     custo,
    pesoKg,
    custosAdicionais: 0,
    imposto:          0,
    margemLucro:      margem,
  }, plat, tipoVendedor, false);

  if (!calcInputs) return { ...base, status: 'erro: não foi possível calcular as taxas' };

  const resultado = calcular(calcInputs);
  if (!resultado) return { ...base, status: 'erro: taxas somadas excedem 100% — revise a margem' };

  registerCalculo();

  return {
    ...base,
    precoVenda:  resultado.precoVenda,
    precoMinimo: resultado.precoMinimo,
    lucro:       resultado.lucroLiquido,
    status:      'ok',
  };
}

// Resolve a chave de faixas (tipoVendedor) aceitando o valor da coluna tipo_anuncio,
// aliases conhecidos, ou o default da plataforma quando a coluna vem vazia.
function _resolveTipoVendedor(plat, raw) {
  const val = (raw || '').trim().toLowerCase();
  const faixasKeys = Object.keys(plat.faixas || {});

  if (!val) return _defaultTipoVendedor(plat);
  if (faixasKeys.includes(val)) return val;

  // Aliases: cobrem valores usados na UI/comparador que não são chaves diretas de faixas
  if (plat.id === 'shopee' && val === 'cpf_iniciante') return 'cnpj';
  if (plat.id === 'mercadolivre' && (val === 'classico' || val === 'premium')) return `${val}_full`;

  return null;
}

function _defaultTipoVendedor(plat) {
  if (plat.id === 'mercadolivre') return 'classico_full';
  if (plat.id === 'shopee')       return 'cnpj';
  if (plat.id === 'amazon')       return 'fba';
  if (plat.id === 'shein')        return 'geral';
  return Object.keys(plat.faixas || {})[0] || null; // tiktok: 'padrao'
}

// Converte string (vírgula OU ponto decimal) para número.
// null = campo vazio (não fornecido) · NaN = fornecido mas inválido
function _parseNum(raw) {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  if (s === '') return null;
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? NaN : n;
}

// ---------- RENDERIZAÇÃO ----------

function _renderTabela(resultados) {
  const wrapper = document.getElementById('lote-tabela-wrapper');
  const tbody   = document.getElementById('lote-tabela-tbody');
  if (!wrapper || !tbody) return;

  tbody.innerHTML = resultados.map((r) => {
    const ok = r.status === 'ok';
    const platLabel = _plataformas.find((p) => p.id === r.plataforma)?.nome || r.plataforma || '—';
    return `
      <tr>
        <td>${_esc(r.produto)}</td>
        <td data-label="Plataforma">${_esc(platLabel)}</td>
        <td data-label="Custo">${r.custo !== null ? BRL.format(r.custo) : '—'}</td>
        <td data-label="Preço venda">${ok ? BRL.format(r.precoVenda) : '—'}</td>
        <td data-label="Preço mínimo">${ok ? BRL.format(r.precoMinimo) : '—'}</td>
        <td data-label="Lucro">${ok ? BRL.format(r.lucro) : '—'}</td>
        <td class="lote-status ${ok ? 'lote-status--ok' : 'lote-status--erro'}" data-label="Status">${_esc(ok ? 'OK' : r.status)}</td>
      </tr>
    `;
  }).join('');

  wrapper.classList.remove('hidden');
}

function _esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// ---------- EXPORTAÇÃO ----------

function _baixarResultados() {
  if (!_ultimoResultado.length) {
    showToast('Nada para exportar — importe uma planilha primeiro', 'error');
    return;
  }

  const rows = _ultimoResultado.map((r) => [
    r.produto,
    r.plataforma,
    r.custo ?? '',
    r.precoVenda ?? '',
    r.precoMinimo ?? '',
    r.lucro ?? '',
    r.margem ?? '',
    r.status,
  ]);

  const csv = toCSV([RESULT_HEADER, ...rows]);
  _downloadCSV(csv, `precificapro-lote-${Date.now()}.csv`);
}

// ---------- UTILITÁRIOS CSV (BOM UTF-8 + ';' — padrão Excel BR) ----------

export function toCSV(rows) {
  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
}

function _downloadCSV(csv, filename) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
