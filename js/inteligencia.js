// inteligencia.js — PrecificaPRO (FASE 3 — Relatório de Inteligência de Mercado)
// Responsabilidade: view admin-only #/inteligencia — onde a margem está sendo deixada na mesa.
// Agregação vem de funções SQL (get_inteligencia_mercado/get_inteligencia_ajustes) já com a
// régua de anonimato aplicada (HAVING n_usuarios >= 5). Reaplicamos o filtro aqui como
// DUPLA PROTEÇÃO — mesmo que a função mude um dia, nenhum grupo com <5 usuários é exibido.

import { getInteligenciaMercado, getInteligenciaAjustes } from './supabase.js';
import { isAdmin } from './auth.js';
import { formatBRL, formatPct } from './formatter.js';

const MIN_USUARIOS = 5; // régua de anonimato — mesma constante usada no SQL

const REGIOES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];

let _plataformas = [];

export async function initInteligencia(plataformas = []) {
  _plataformas = plataformas;

  if (!document.getElementById('view-inteligencia')) return; // markup ainda não existe (defensivo)
  if (!isAdmin()) return; // dupla proteção: só admin carrega/renderiza dados desta view

  _populateFiltros();

  const filtroPlataforma = document.getElementById('intel-filtro-plataforma');
  const filtroRegiao     = document.getElementById('intel-filtro-regiao');
  const filtroPeriodo    = document.getElementById('intel-filtro-periodo');

  [filtroPlataforma, filtroRegiao, filtroPeriodo].forEach((sel) => {
    if (sel) sel.addEventListener('change', () => {
      if (_currentRoute() === 'inteligencia') _loadInteligencia();
    });
  });

  window.addEventListener('hashchange', () => {
    if (_currentRoute() === 'inteligencia') _loadInteligencia();
  });

  if (_currentRoute() === 'inteligencia') {
    await _loadInteligencia();
  }
}

function _currentRoute() {
  return (window.location.hash || '').replace(/^#\/?/, '').split('?')[0] || 'calcular';
}

function _esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function _populateFiltros() {
  const selPlataforma = document.getElementById('intel-filtro-plataforma');
  if (selPlataforma && selPlataforma.options.length <= 1) {
    _plataformas.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.nome;
      selPlataforma.appendChild(opt);
    });
  }

  const selRegiao = document.getElementById('intel-filtro-regiao');
  if (selRegiao && selRegiao.options.length <= 1) {
    REGIOES.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r;
      selRegiao.appendChild(opt);
    });
  }
}

function _filtros() {
  const dias       = Number(document.getElementById('intel-filtro-periodo')?.value || 30);
  const plataforma = document.getElementById('intel-filtro-plataforma')?.value || null;
  const regiao     = document.getElementById('intel-filtro-regiao')?.value || null;
  return { dias, plataforma, regiao };
}

async function _loadInteligencia() {
  if (!isAdmin()) return; // dupla proteção — nunca busca dados se o usuário não é admin

  const { dias, plataforma, regiao } = _filtros();

  try {
    const [mercado, ajustes] = await Promise.all([
      getInteligenciaMercado({ dias, plataforma, regiao }),
      getInteligenciaAjustes({ dias, plataforma, regiao }),
    ]);

    // DUPLA PROTEÇÃO: mesmo que a função SQL um dia venha sem o HAVING, filtra de novo aqui.
    const mercadoSeguro = (mercado || []).filter((row) => Number(row.n_usuarios) >= MIN_USUARIOS);
    const ajustesSeguro = (ajustes || []).filter((row) => Number(row.n_usuarios) >= MIN_USUARIOS);

    _renderKpis(mercadoSeguro);
    _renderTabelaMercado(mercadoSeguro);
    _renderTabelaAjustes(ajustesSeguro);
  } catch (e) {
    console.error('❌ Erro ao carregar Inteligência de Mercado:', e);
  }
}

function _renderKpis(rows) {
  const totalCalculos = rows.reduce((acc, r) => acc + Number(r.n_calculos || 0), 0);

  const gapMedioGeral = rows.length
    ? rows.reduce((acc, r) => acc + Number(r.gap_margem || 0), 0) / rows.length
    : 0;

  const topCategoria = [...rows].sort((a, b) => Number(b.margem_aceita_media) - Number(a.margem_aceita_media))[0];
  const topPlataforma = [...rows].sort((a, b) => Number(b.margem_aceita_media) - Number(a.margem_aceita_media))[0];

  const elTotal    = document.getElementById('intel-kpi-total');
  const elGap      = document.getElementById('intel-kpi-gap');
  const elCategoria = document.getElementById('intel-kpi-top-categoria');
  const elPlataforma = document.getElementById('intel-kpi-top-plataforma');

  if (elTotal) elTotal.textContent = String(totalCalculos);
  if (elGap) elGap.textContent = rows.length ? formatPct(gapMedioGeral) : '—';
  if (elCategoria) elCategoria.textContent = topCategoria ? topCategoria.categoria : '—';
  if (elPlataforma) elPlataforma.textContent = topPlataforma ? _nomePlataforma(topPlataforma.plataforma) : '—';
}

function _nomePlataforma(id) {
  const p = _plataformas.find((pl) => pl.id === id);
  return p ? p.nome : id;
}

function _renderTabelaMercado(rows) {
  const tbody = document.getElementById('intel-tabela-tbody');
  const tabela = document.getElementById('intel-tabela');
  const vazio = document.getElementById('intel-tabela-vazio');
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = '';
    if (tabela) tabela.classList.add('hidden');
    if (vazio) vazio.classList.remove('hidden');
    return;
  }

  if (tabela) tabela.classList.remove('hidden');
  if (vazio) vazio.classList.add('hidden');

  // Ordenado por gap DESC — onde a margem está sendo mais deixada na mesa primeiro
  const ordenado = [...rows].sort((a, b) => Number(b.gap_margem) - Number(a.gap_margem));

  tbody.innerHTML = ordenado.map((r) => `
    <tr>
      <td data-label="Categoria">${_esc(r.categoria)}</td>
      <td data-label="Plataforma">${_esc(_nomePlataforma(r.plataforma))}</td>
      <td data-label="Região">${_esc(r.regiao)}</td>
      <td data-label="Nº cálculos">${_esc(r.n_calculos)}</td>
      <td data-label="Custo médio">${formatBRL(Number(r.custo_medio))}</td>
      <td data-label="Margem desejada">${formatPct(Number(r.margem_desejada_media))}</td>
      <td data-label="Margem aceita">${formatPct(Number(r.margem_aceita_media))}</td>
      <td data-label="Gap">${formatPct(Number(r.gap_margem))}</td>
      <td data-label="Taxa de aceite">${formatPct(Number(r.taxa_aceite) * 100)}</td>
    </tr>
  `).join('');
}

function _renderTabelaAjustes(rows) {
  const tbody = document.getElementById('intel-ajustes-tabela-tbody');
  const tabela = document.getElementById('intel-ajustes-tabela');
  const vazio = document.getElementById('intel-ajustes-vazio');
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML = '';
    if (tabela) tabela.classList.add('hidden');
    if (vazio) vazio.classList.remove('hidden');
    return;
  }

  if (tabela) tabela.classList.remove('hidden');
  if (vazio) vazio.classList.add('hidden');

  tbody.innerHTML = rows.map((r) => `
    <tr>
      <td data-label="Categoria">${_esc(r.categoria)}</td>
      <td data-label="Nº cálculos">${_esc(r.n_calculos)}</td>
      <td data-label="Sem ajuste">${_esc(r.sem_ajuste)}</td>
      <td data-label="Com ajuste">${_esc(r.com_ajuste)}</td>
      <td data-label="Gap médio (c/ ajuste)">${formatPct(Number(r.gap_medio_com_ajuste))}</td>
      <td data-label="Descartados">${_esc(r.descartados)}</td>
    </tr>
  `).join('');
}
