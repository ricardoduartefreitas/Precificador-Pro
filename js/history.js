// history.js — PrecificaPRO
// Responsabilidade: CRUD do histórico de cálculos no localStorage + exportação CSV
// Limite: 200 registros (FIFO — o mais antigo é removido ao atingir o limite)

import { storageGet, storageSet } from './storage.js';
import { formatDate, formatGroupLabel } from './formatter.js';

const KEY     = 'history';
const MAX     = 200;

// ---------- LEITURA ----------

export function getHistory() {
  return storageGet(KEY, []);
}

export function getHistoryFiltered({ plataforma = 'todos', search = '' } = {}) {
  let entries = getHistory();

  if (plataforma !== 'todos') {
    entries = entries.filter((e) =>
      e.tipo === 'comparacao'
        ? plataforma === 'comparacao'
        : e.plataforma === plataforma
    );
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    entries = entries.filter((e) => e.produto.toLowerCase().includes(q));
  }

  return entries;
}

// ---------- ESCRITA ----------

export function saveEntry(entry) {
  const history = getHistory();

  const record = {
    id: _uuid(),
    data: Date.now(),
    ...entry,
  };

  history.unshift(record);

  if (history.length > MAX) {
    history.splice(MAX);
  }

  storageSet(KEY, history);
  return record;
}

export function clearHistory() {
  storageSet(KEY, []);
}

// ---------- STATS ----------

export function getStats() {
  const entries = getHistory();

  if (!entries.length) {
    return { total: 0, maxLucro: null, mediasMargem: null };
  }

  const individuais = entries.filter((e) => e.tipo === 'individual');

  const maxLucro = individuais.length
    ? Math.max(...individuais.map((e) => e.resultado?.lucroLiquido ?? 0))
    : null;

  const mediaMargem = individuais.length
    ? individuais.reduce((acc, e) => acc + (e.resultado?.margemReal ?? 0), 0) / individuais.length
    : null;

  return { total: entries.length, maxLucro, mediaMargem };
}

// ---------- AGRUPAMENTO POR DATA ----------

export function groupByDate(entries) {
  const groups = {};
  entries.forEach((e) => {
    const label = formatGroupLabel(e.data);
    if (!groups[label]) groups[label] = [];
    groups[label].push(e);
  });
  return groups;
}

// ---------- EXPORTAÇÃO CSV ----------

export function exportCSV(entries) {
  const header = ['Data', 'Produto', 'Plataforma', 'Tipo Vendedor', 'Custo', 'Margem Desejada', 'Preço Venda', 'Lucro Líquido', 'Margem Real %', 'Preço Mínimo'];

  const rows = [];
  entries.forEach((e) => {
    if (e.tipo === 'individual') {
      rows.push([
        formatDate(e.data),
        e.produto,
        e.plataforma,
        e.tipoVendedor || '',
        e.inputs?.custo ?? '',
        e.inputs?.margem ?? '',
        e.resultado?.precoVenda ?? '',
        e.resultado?.lucroLiquido ?? '',
        e.resultado?.lucroPercentual ?? '',
        e.resultado?.precoMinimo ?? '',
      ]);
    } else if (e.tipo === 'comparacao') {
      (e.resultados || []).forEach((r) => {
        rows.push([
          formatDate(e.data),
          e.produto,
          r.plataforma,
          '',
          e.inputs?.custo ?? '',
          e.inputs?.margem ?? '',
          r.precoVenda ?? '',
          r.lucroLiquido ?? '',
          r.lucroPercentual ?? '',
          r.precoMinimo ?? '',
        ]);
      });
    }
  });

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `precificapro-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- UTILITÁRIO ----------

function _uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
