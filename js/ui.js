// ui.js — PrecificaPRO
// Integração completa das 3 views com todos os módulos existentes

import { getState, setState, setInput, getInputs } from './state.js';
import { formatBRL, formatPct, formatDate, parseInputValue } from './formatter.js';
import { calcular, calcularComDesconto, comparar, mapPlataformaToInputs } from './calculator.js';
import { saveEntry, getHistoryFiltered, clearHistory, groupByDate, getStats, exportCSV } from './history.js';
import { canCalculate, registerCalculo, isPro, showUpgradeOverlay } from './freemium.js';

// Plataformas injetadas por app.js via initUI()
let _PLATAFORMAS = [];

// ─── EXPORTS EXIGIDOS POR freemium.js ────────────────────────────────────────

let _toastTimer = null;

export function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast ${type}`.trim();
  el.classList.remove('hidden');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add('hidden'), 2800);
}

export function updatePlanBadge(pro) {
  const badge = document.getElementById('plan-badge');
  if (!badge) return;
  badge.textContent = pro ? 'PRO' : 'FREE';
  badge.classList.toggle('pro', pro);
}

export function openOverlayPro() {
  document.getElementById('overlay-pro')?.classList.remove('hidden');
}

export function closeOverlayPro() {
  document.getElementById('overlay-pro')?.classList.add('hidden');
}

export function openModalSalvar() {
  const modal = document.getElementById('modal-salvar');
  const input = document.getElementById('modal-produto-nome');
  if (!modal || !input) return;
  input.value = '';
  modal.classList.remove('hidden');
  input.focus();
}

export function closeModalSalvar() {
  document.getElementById('modal-salvar')?.classList.add('hidden');
}

// ─── INICIALIZAÇÃO ────────────────────────────────────────────────────────────

export function initUI(plataformas = []) {
  _PLATAFORMAS = plataformas;

  _bindGlobalModals();
  _initCalcView();
  _initComparView();
  _initHistoricoView();
}

// ─── MODAIS GLOBAIS ───────────────────────────────────────────────────────────

function _bindGlobalModals() {
  document.getElementById('btn-modal-cancelar')?.addEventListener('click', closeModalSalvar);
  document.getElementById('btn-modal-confirmar')?.addEventListener('click', _confirmSave);
  document.getElementById('btn-fechar-overlay')?.addEventListener('click', closeOverlayPro);

  document.getElementById('modal-salvar')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModalSalvar();
  });
  document.getElementById('overlay-pro')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeOverlayPro();
  });

  document.getElementById('modal-produto-nome')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') _confirmSave();
  });
}

function _confirmSave() {
  const nome = document.getElementById('modal-produto-nome')?.value.trim();
  if (!nome) {
    showToast('Digite o nome do produto', 'error');
    return;
  }
  const state = getState();
  if (!state.lastResult) {
    showToast('Calcule primeiro antes de salvar', 'error');
    return;
  }
  saveEntry({
    tipo:         'individual',
    produto:      nome,
    plataforma:   state.activePlatform,
    tipoVendedor: state.sellerType,
    inputs:       getInputs(),
    resultado:    state.lastResult,
  });
  closeModalSalvar();
  showToast('Salvo no histórico', 'success');
}

// ─── TELA 1: CALCULAR ────────────────────────────────────────────────────────

function _initCalcView() {
  const platSelect = document.getElementById('calc-plataforma');
  const tipoSelect = document.getElementById('calc-tipo-vendedor');
  if (!platSelect) return;

  // Popula o select de plataformas
  _PLATAFORMAS.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.nome;
    platSelect.appendChild(opt);
  });

  // Plataforma ativa salva no estado
  const state = getState();
  platSelect.value = state.activePlatform || _PLATAFORMAS[0]?.id;
  _updateSellerTypeSelect(tipoSelect, _findPlat(platSelect.value));

  platSelect.addEventListener('change', () => {
    const plat = _findPlat(platSelect.value);
    setState({ activePlatform: platSelect.value });
    _updateSellerTypeSelect(tipoSelect, plat);
    _clearCalcResult();
  });

  // Campanha toggle
  const campanhaCheck  = document.getElementById('calc-campanha');
  const descontoWrapper = document.getElementById('desconto-wrapper');
  campanhaCheck?.addEventListener('change', () => {
    if (descontoWrapper) descontoWrapper.style.display = campanhaCheck.checked ? '' : 'none';
    setInput('campanha', campanhaCheck.checked);
  });

  // Pré-preenche com estado salvo
  _fillCalcFields();
  _bindCalcInputChange();

  document.getElementById('btn-calcular')?.addEventListener('click', _handleCalcular);
  document.getElementById('btn-salvar')?.addEventListener('click', openModalSalvar);
  document.getElementById('btn-limpar')?.addEventListener('click', _clearCalcResult);
}

function _fillCalcFields() {
  const s = getInputs();
  _setVal('calc-custo',   s.custo);
  _setVal('calc-frete',   s.frete);
  _setVal('calc-extras',  s.extras);
  _setVal('calc-margem',  s.margem);
  _setVal('calc-imposto', s.imposto ?? 0);
  const camp = document.getElementById('calc-campanha');
  if (camp) camp.checked = !!s.campanha;
}

function _bindCalcInputChange() {
  const map = {
    'calc-custo':    'custo',
    'calc-frete':    'frete',
    'calc-extras':   'extras',
    'calc-margem':   'margem',
    'calc-imposto':  'imposto',
    'calc-desconto': 'desconto',
  };
  Object.entries(map).forEach(([id, key]) => {
    document.getElementById(id)?.addEventListener('input', (e) => {
      setInput(key, parseInputValue(e.target.value));
    });
  });
}

function _updateSellerTypeSelect(select, plat) {
  const wrapper = document.getElementById('seller-type-wrapper');
  if (!select || !plat) return;

  select.innerHTML = '';

  if (!plat.tiposVendedor?.length) {
    if (wrapper) wrapper.style.display = 'none';
    setState({ sellerType: Object.keys(plat.faixas)[0] });
    return;
  }

  if (wrapper) wrapper.style.display = '';
  plat.tiposVendedor.forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t.key;
    opt.textContent = t.label;
    select.appendChild(opt);
  });

  const state     = getState();
  const validKey  = plat.tiposVendedor.find((t) => t.key === state.sellerType);
  select.value    = validKey ? state.sellerType : plat.tiposVendedor[0].key;
  setState({ sellerType: select.value });

  select.onchange = () => setState({ sellerType: select.value });
}

function _handleCalcular() {
  if (!canCalculate()) {
    showUpgradeOverlay();
    return;
  }

  const state      = getState();
  const plat       = _findPlat(state.activePlatform) || _PLATAFORMAS[0];
  const tipoVend   = state.sellerType || Object.keys(plat.faixas)[0];

  const base = {
    custoProduto:     parseInputValue(document.getElementById('calc-custo')?.value),
    custoFrete:       parseInputValue(document.getElementById('calc-frete')?.value),
    custosAdicionais: parseInputValue(document.getElementById('calc-extras')?.value),
    margemLucro:      parseInputValue(document.getElementById('calc-margem')?.value),
    imposto:          parseInputValue(document.getElementById('calc-imposto')?.value),
  };

  const calcInputs = mapPlataformaToInputs(base, plat, tipoVend, !!state.inputs.campanha);
  if (!calcInputs) {
    showToast('Verifique os valores inseridos', 'error');
    return;
  }

  const desconto = state.inputs.campanha
    ? parseInputValue(document.getElementById('calc-desconto')?.value)
    : 0;

  const resultado = desconto > 0
    ? calcularComDesconto(calcInputs, desconto)
    : calcular(calcInputs);

  if (!resultado) {
    showToast('Taxas somadas excedem 100% — revise os percentuais', 'error');
    return;
  }

  resultado._faixa    = calcInputs._faixaLabel;
  resultado._platNome = plat.nome;
  resultado._platCor  = plat.cor;

  registerCalculo();
  setState({ lastResult: resultado, activePlatform: plat.id, sellerType: tipoVend });

  renderResultHero(resultado);
  renderExtrato(resultado);
  document.getElementById('calc-actions')?.classList.remove('hidden');

  setTimeout(() => {
    document.getElementById('calc-result')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 50);
}

function _clearCalcResult() {
  document.getElementById('calc-result')?.classList.add('hidden');
  document.getElementById('calc-extrato')?.classList.add('hidden');
  document.getElementById('calc-actions')?.classList.add('hidden');
  setState({ lastResult: null });
}

// ─── TELA 2: COMPARAR ────────────────────────────────────────────────────────

function _initComparView() {
  if (!document.getElementById('btn-comparar')) return;

  window.addEventListener('hashchange', () => {
    if (_currentRoute() === 'comparar') _fillComparFields();
  });

  _fillComparFields();
  _bindComparInputChange();

  document.getElementById('btn-comparar')?.addEventListener('click', _handleComparar);
}

function _fillComparFields() {
  const s = getInputs();
  _setVal('cmp-custo',   s.custo);
  _setVal('cmp-frete',   s.frete);
  _setVal('cmp-extras',  s.extras);
  _setVal('cmp-margem',  s.margem);
  _setVal('cmp-imposto', s.imposto ?? 0);
}

function _bindComparInputChange() {
  const map = {
    'cmp-custo':   'custo',
    'cmp-frete':   'frete',
    'cmp-extras':  'extras',
    'cmp-margem':  'margem',
    'cmp-imposto': 'imposto',
  };
  Object.entries(map).forEach(([id, key]) => {
    document.getElementById(id)?.addEventListener('input', (e) => {
      setInput(key, parseInputValue(e.target.value));
    });
  });
}

function _handleComparar() {
  if (!canCalculate()) {
    showUpgradeOverlay();
    return;
  }

  const base = {
    custoProduto:     parseInputValue(document.getElementById('cmp-custo')?.value),
    custoFrete:       parseInputValue(document.getElementById('cmp-frete')?.value),
    custosAdicionais: parseInputValue(document.getElementById('cmp-extras')?.value),
    margemLucro:      parseInputValue(document.getElementById('cmp-margem')?.value),
    imposto:          parseInputValue(document.getElementById('cmp-imposto')?.value),
  };

  const resultados = comparar(base, _PLATAFORMAS, null, false);

  if (!resultados?.length) {
    showToast('Nenhum resultado — verifique os valores', 'error');
    return;
  }

  registerCalculo();
  setState({ lastComparison: resultados });
  renderComparacao(resultados);

  setTimeout(() => {
    document.getElementById('cmp-winner')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 50);
}

// ─── TELA 3: HISTÓRICO ───────────────────────────────────────────────────────

const FREE_HISTORY_LIMIT = 5;

function _initHistoricoView() {
  if (!document.getElementById('history-list')) return;

  window.addEventListener('hashchange', () => {
    if (_currentRoute() === 'historico') _renderHistorico();
  });

  _buildFilterChips();

  document.getElementById('history-search')?.addEventListener('input', (e) => {
    setState({ historySearch: e.target.value });
    _renderHistoricoList();
  });

  document.getElementById('btn-export-csv')?.addEventListener('click', () => {
    if (!isPro()) {
      showToast('Exportação CSV disponível apenas no plano PRO', 'error');
      openOverlayPro();
      return;
    }
    const state   = getState();
    const entries = getHistoryFiltered({
      plataforma: state.historyFilter || 'todos',
      search:     state.historySearch || '',
    });
    if (!entries.length) {
      showToast('Histórico vazio', '');
      return;
    }
    exportCSV(entries);
    showToast('CSV exportado', 'success');
  });

  document.getElementById('btn-clear-history')?.addEventListener('click', () => {
    if (!confirm('Limpar todo o histórico? Esta ação não pode ser desfeita.')) return;
    clearHistory();
    _renderHistorico();
    showToast('Histórico limpo', '');
  });
}

function _buildFilterChips() {
  const container = document.getElementById('filter-chips');
  if (!container) return;

  const filters = [
    { key: 'todos', label: 'Todos' },
    ..._PLATAFORMAS.map((p) => ({ key: p.id, label: p.nome })),
    { key: 'comparacao', label: 'Comparações' },
  ];

  filters.forEach(({ key, label }) => {
    const btn = document.createElement('button');
    btn.className = `chip${key === 'todos' ? ' active' : ''}`;
    btn.textContent = label;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      setState({ historyFilter: key });
      _renderHistoricoList();
    });
    container.appendChild(btn);
  });
}

function _renderHistorico() {
  _renderStats();
  _renderHistoricoList();
}

function _renderStats() {
  const stats = getStats();
  _setTxt('stat-total',        stats.total);
  _setTxt('stat-max-lucro',    stats.maxLucro   != null ? formatBRL(stats.maxLucro)    : '—');
  _setTxt('stat-media-margem', stats.mediaMargem != null ? formatPct(stats.mediaMargem) : '—');
}

function _renderHistoricoList() {
  const container = document.getElementById('history-list');
  if (!container) return;

  const state   = getState();
  const entries = getHistoryFiltered({
    plataforma: state.historyFilter || 'todos',
    search:     state.historySearch || '',
  });

  if (!entries.length) {
    container.innerHTML = `
      <p class="text-muted" style="text-align:center;padding:2rem 0">
        Nenhum registro encontrado
      </p>`;
    return;
  }

  const pro    = isPro();
  const groups = groupByDate(entries);
  let html     = '';
  let count    = 0;
  let locked   = false;

  for (const [label, items] of Object.entries(groups)) {
    let groupHtml = '';
    for (const entry of items) {
      count++;
      if (!pro && count > FREE_HISTORY_LIMIT) {
        locked = true;
        break;
      }
      groupHtml += _renderEntry(entry);
    }
    if (groupHtml) {
      html += `<p class="history-group-label">${_esc(label)}</p>${groupHtml}`;
    }
    if (locked) break;
  }

  if (locked) {
    const remaining = entries.length - FREE_HISTORY_LIMIT;
    html += `
      <div class="history-pro-lock">
        <p class="history-pro-lock-msg">
          + ${remaining} registro${remaining > 1 ? 's' : ''} bloqueado${remaining > 1 ? 's' : ''}
        </p>
        <button class="btn btn--secondary" id="btn-unlock-history">Desbloquear PRO</button>
      </div>`;
  }

  container.innerHTML = html;

  // Evento do botão de unlock gerado dinamicamente
  document.getElementById('btn-unlock-history')?.addEventListener('click', openOverlayPro);
}

function _renderEntry(entry) {
  const platObj = _findPlat(entry.plataforma);
  const cor     = platObj?.cor || 'var(--accent-blue)';
  const r       = entry.resultado;

  if (entry.tipo === 'comparacao') {
    const top = entry.resultados?.[0];
    return `
      <div class="history-entry history-entry--comparacao">
        <div class="history-entry-header">
          <span class="history-entry-nome">${_esc(entry.produto)}</span>
          <span class="history-entry-data text-muted">${formatDate(entry.data)}</span>
        </div>
        <p class="history-entry-meta text-muted">
          Comparação · 5 plataformas${top ? ` · Melhor: ${_esc(top.nome)}` : ''}
        </p>
      </div>`;
  }

  return `
    <div class="history-entry">
      <div class="history-entry-header">
        <span class="history-entry-nome">${_esc(entry.produto)}</span>
        <span class="history-entry-data text-muted">${formatDate(entry.data)}</span>
      </div>
      <div class="history-entry-body">
        <span class="history-entry-plat" style="color:${cor}">${_esc(platObj?.nome || entry.plataforma)}</span>
        ${r ? `
          <span class="history-entry-price">${formatBRL(r.precoVenda)}</span>
          <span class="history-entry-lucro text-green">
            lucro ${formatBRL(r.lucroLiquido)} · ${formatPct(r.lucroPercentual)}
          </span>` : ''}
      </div>
    </div>`;
}

// ─── RENDER: RESULT HERO ─────────────────────────────────────────────────────

export function renderResultHero(resultado) {
  const el = document.getElementById('calc-result');
  if (!el || !resultado) return;

  const pctPlat = resultado.precoVenda > 0
    ? (resultado.breakdown.totalDeducoes / resultado.precoVenda) * 100
    : 0;

  el.innerHTML = `
    <p class="result-preco-label">
      ${resultado._platNome ? `${_esc(resultado._platNome)} · ` : ''}Preço sugerido
    </p>
    ${resultado.desconto > 0 ? `<p class="result-preco-sem-desconto">${formatBRL(resultado.precoSemDesconto)}</p>` : ''}
    <p class="result-preco-valor">${formatBRL(resultado.precoVenda)}</p>
    <div class="result-grid">
      <div>
        <p class="result-item-label">Lucro líquido</p>
        <p class="result-item-value text-green">${formatBRL(resultado.lucroLiquido)}</p>
      </div>
      <div>
        <p class="result-item-label">Margem real</p>
        <p class="result-item-value">${formatPct(resultado.lucroPercentual)}</p>
      </div>
      <div>
        <p class="result-item-label">% plataforma</p>
        <p class="result-item-value text-red">${formatPct(pctPlat)}</p>
      </div>
    </div>
    <p class="result-faixa">
      ${resultado._faixa ? `Faixa: ${_esc(resultado._faixa)} · ` : ''}
      Preço mínimo: ${formatBRL(resultado.precoMinimo)}
    </p>
  `;

  el.classList.remove('hidden');
}

// ─── RENDER: EXTRATO ─────────────────────────────────────────────────────────

export function renderExtrato(resultado) {
  const container = document.getElementById('calc-extrato');
  const table     = document.getElementById('extrato-table');
  if (!container || !table || !resultado) return;

  const bd = resultado.breakdown;

  const rows = [
    { label: 'Valor de venda',    valor:  resultado.precoVenda,  classe: '' },
    { label: 'Custo do produto',  valor: -bd.custosProduto,       classe: 'row-deduction' },
    { label: 'Frete',             valor: -bd.freteValor,          classe: 'row-deduction' },
    { label: 'Outros custos',     valor: -bd.custosAdicionais,    classe: 'row-deduction' },
    { label: 'Comissão',          valor: -bd.comissaoValor,       classe: 'row-deduction' },
    { label: 'Taxa fixa anúncio', valor: -bd.taxaAnuncioValor,    classe: 'row-deduction' },
    { label: 'Imposto',           valor: -bd.impostoValor,        classe: 'row-deduction' },
    ...(resultado.desconto > 0 ? [{
      label:  `Desconto (${resultado.desconto}%)`,
      valor:  -bd.descontoValor,
      classe: 'row-deduction',
    }] : []),
    { label: 'Lucro líquido',     valor:  resultado.lucroLiquido, classe: 'row-total' },
  ];

  table.innerHTML = rows
    .filter((r) => Math.abs(r.valor) > 0 || r.classe === 'row-total')
    .map(({ label, valor, classe }) => `
      <tr class="${classe}">
        <td>${label}</td>
        <td>${valor < 0 ? '−&nbsp;' : ''}${formatBRL(Math.abs(valor))}</td>
      </tr>`)
    .join('');

  container.classList.remove('hidden');
}

// ─── RENDER: COMPARAÇÃO ──────────────────────────────────────────────────────

export function renderComparacao(resultados) {
  const winnerEl  = document.getElementById('cmp-winner');
  const rankingEl = document.getElementById('cmp-ranking');
  if (!winnerEl || !rankingEl || !resultados?.length) return;

  const [winner, ...rest] = resultados;
  const maxLucro  = winner.lucroLiquido;
  const pctWinner = winner.precoVenda > 0
    ? (winner.breakdown.totalDeducoes / winner.precoVenda) * 100
    : 0;

  winnerEl.innerHTML = `
    <span class="winner-badge">Melhor opção</span>
    <p class="ranking-platform" style="color:${winner.cor}">${_esc(winner.nome)}</p>
    <p class="result-preco-valor">${formatBRL(winner.precoVenda)}</p>
    <div class="result-grid">
      <div>
        <p class="result-item-label">Lucro</p>
        <p class="result-item-value text-green">${formatBRL(winner.lucroLiquido)}</p>
      </div>
      <div>
        <p class="result-item-label">Margem real</p>
        <p class="result-item-value">${formatPct(winner.lucroPercentual)}</p>
      </div>
      <div>
        <p class="result-item-label">% plataforma</p>
        <p class="result-item-value text-red">${formatPct(pctWinner)}</p>
      </div>
    </div>
    ${winner.faixa ? `<p class="result-faixa">Faixa: ${_esc(winner.faixa)}</p>` : ''}
  `;
  winnerEl.classList.remove('hidden');

  rankingEl.innerHTML = rest.map((r, i) => {
    const pct = maxLucro > 0 ? (r.lucroLiquido / maxLucro) * 100 : 0;
    return `
      <div class="ranking-card">
        <span class="ranking-pos">${i + 2}</span>
        <div class="ranking-info">
          <p class="ranking-platform" style="color:${r.cor}">${_esc(r.nome)}</p>
          <div class="ranking-bar">
            <div class="ranking-bar-fill"
                 style="width:${pct.toFixed(1)}%;background-color:${r.cor}"></div>
          </div>
        </div>
        <div class="ranking-price">
          <p class="ranking-price-value">${formatBRL(r.precoVenda)}</p>
          <p class="ranking-price-lucro">+${formatBRL(r.lucroLiquido)}</p>
        </div>
      </div>`;
  }).join('');

  rankingEl.classList.remove('hidden');
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function _findPlat(id) {
  return _PLATAFORMAS.find((p) => p.id === id) || null;
}

function _currentRoute() {
  return (window.location.hash || '').replace(/^#\//, '').split('/')[0] || 'calcular';
}

function _setVal(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined && val !== null) el.value = val;
}

function _setTxt(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function _esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
