// ui.js — PrecificaPRO
// Integração completa das 3 views com todos os módulos existentes

import { getState, setState, setInput, getInputs } from './state.js';
import { formatBRL, formatPct, formatDate, parseInputValue } from './formatter.js';
import { calcular, calcularComDesconto, comparar, mapPlataformaToInputs, identificarFaixa, obterFaixasFormatadas } from './calculator.js';
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
    _renderPlatformaRegras();
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
  _renderPlatformaRegras();

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
      // Atualiza o aviso de faixa em tempo real para custo, margem, frete, extras e imposto
      if (['calc-custo', 'calc-margem', 'calc-frete', 'calc-extras', 'calc-imposto'].includes(id)) {
        _updatePlatformaAvisoFaixa();
      }
    });
  });
}

function _updateSellerTypeSelect(select, plat) {
  const wrapper = document.getElementById('seller-type-wrapper');
  const labelEl = document.querySelector('label[for="calc-tipo-vendedor"]');
  if (!select || !plat) return;

  select.innerHTML = '';

  if (!plat.tiposVendedor?.length) {
    if (wrapper) wrapper.style.display = 'none';
    if (labelEl) labelEl.textContent = 'Tipo de vendedor';
    setState({ sellerType: Object.keys(plat.faixas)[0] });
    _updateLogisticaSelect(plat);
    return;
  }

  if (wrapper) wrapper.style.display = '';
  if (labelEl) labelEl.textContent = plat.labelTipoVendedor || 'Tipo de vendedor';

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

  select.onchange = () => {
    setState({ sellerType: select.value });
    _renderPlatformaRegras();
    _updatePlatformaAvisoFaixa();
    _clearCalcResult();
  };

  _updateLogisticaSelect(plat);
}

function _updateLogisticaSelect(plat) {
  const wrapper = document.getElementById('logistica-wrapper');
  const select  = document.getElementById('calc-logistica');
  if (!wrapper || !select) return;

  if (!plat?.tiposLogistica?.length) {
    wrapper.style.display = 'none';
    setState({ mlLogistica: null });
    return;
  }

  wrapper.style.display = '';
  select.innerHTML = '';

  plat.tiposLogistica.forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t.key;
    opt.textContent = t.label;
    select.appendChild(opt);
  });

  const state    = getState();
  const validKey = plat.tiposLogistica.find((t) => t.key === state.mlLogistica);
  select.value   = validKey ? state.mlLogistica : plat.tiposLogistica[0].key;
  setState({ mlLogistica: select.value });

  select.onchange = () => {
    setState({ mlLogistica: select.value });
    _renderPlatformaRegras();
    _updatePlatformaAvisoFaixa();
    _clearCalcResult();
  };
}

function _handleCalcular() {
  console.log('[CALC] Handler iniciado');

  if (!canCalculate()) {
    console.log('[CALC] Bloqueado: não pode calcular (limite free atingido)');
    showUpgradeOverlay();
    return;
  }

  const state    = getState();
  const plat     = _findPlat(state.activePlatform) || _PLATAFORMAS[0];
  const isML     = plat.id === 'mercadolivre';
  console.log('[CALC] Plataforma:', plat.nome, '| isML:', isML);

  // Para ML usa chave combinada tipoAnuncio_logistica; outras plataformas usam sellerType direto
  let tipoAnuncio, tipoVend;
  if (isML) {
    tipoAnuncio = state.sellerType || 'classico';
    const logistica = state.mlLogistica || 'full';
    tipoVend = `${tipoAnuncio}_${logistica}`;
  } else {
    tipoAnuncio = state.sellerType || Object.keys(plat.faixas)[0];
    tipoVend    = tipoAnuncio;
  }

  const base = {
    custoProduto:     parseInputValue(document.getElementById('calc-custo')?.value),
    pesoKg:           parseInputValue(document.getElementById('calc-peso')?.value),
    custosAdicionais: parseInputValue(document.getElementById('calc-extras')?.value),
    imposto:          parseInputValue(document.getElementById('calc-imposto')?.value),
    afiliadosPercent: parseInputValue(document.getElementById('calc-afiliados')?.value),
    adsPercent:       parseInputValue(document.getElementById('calc-ads-pct')?.value),
    adsFixo:          parseInputValue(document.getElementById('calc-ads-fixo')?.value),
    margemLucro:      parseInputValue(document.getElementById('calc-margem')?.value),
  };

  const calcInputs = mapPlataformaToInputs(base, plat, tipoVend, !!state.inputs.campanha);
  console.log('[CALC] calcInputs mapeado:', calcInputs ? 'OK' : 'NULL');
  if (!calcInputs) {
    console.log('[CALC] Erro: calcInputs é null');
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
    console.log('[CALC] Erro: resultado é null');
    showToast('Taxas somadas excedem 100% — revise os percentuais', 'error');
    return;
  }

  console.log('[CALC] Resultado calculado:', resultado.precoVenda);

  resultado._faixa           = calcInputs._faixaLabel;
  resultado._freteDescricao  = calcInputs._freteDescricao || '';
  resultado._platNome        = plat.nome;
  resultado._platCor         = plat.cor;
  resultado._platId          = plat.id;

  console.log('[CALC] Dados enriquecidos: faixa=' + resultado._faixa);

  if (isML) {
    const isCampanha   = !!state.inputs.campanha;
    const logistica    = state.mlLogistica || 'full';
    const comissaoBase = calcInputs.comissaoPlataforma - (isCampanha ? (plat.taxaCampanha || 0) : 0);
    const tipoLabel    = plat.tiposVendedor?.find((t) => t.key === tipoAnuncio)?.label || '';
    const logLabel     = plat.tiposLogistica?.find((l) => l.key === logistica)?.label || '';

    resultado._comissaoLabel     = `${tipoLabel} (${comissaoBase}%)`;
    resultado._showAviso         = true;
    resultado._avisoTexto        = '⚠️ Comissões podem variar por categoria. Valide em mercadolivre.com.br/tarifas antes de precificar.';
    resultado._avisoTipo         = 'warning';
    resultado._campanhaAtiva     = isCampanha;
    resultado._campanhaLabel     = `Product Ads (estimativa ${plat.taxaCampanha || 2.5}%)`;
    resultado._campanhaValor     = isCampanha
      ? Math.round(resultado.precoVenda * (plat.taxaCampanha || 0) / 100 * 100) / 100
      : 0;
    resultado._comissaoPuraValor = resultado.breakdown.comissaoValor - resultado._campanhaValor;

    if (resultado.breakdown.taxaAnuncioValor > 0) {
      resultado._taxaFixaLabel = `Taxa fixa ${logLabel} (abaixo R$79,99)`;
    }
  } else {
    // % de comissão (null quando for 0, ex: Shopee CPF iniciante usa só taxa fixa)
    resultado._comissaoLabel = calcInputs.comissaoPlataforma > 0
      ? `(${calcInputs.comissaoPlataforma}%)`
      : null;

    // Aviso genérico definido na configuração da plataforma
    if (plat.aviso) {
      resultado._showAviso  = true;
      resultado._avisoTexto = plat.aviso;
      resultado._avisoTipo  = plat.avisoTipo || 'warning';
    }

    // Shopee CPF iniciante: sem comissão %, taxa é fixa em R$ — label customizado
    if (plat.id === 'shopee' && tipoVend === 'cpf_iniciante') {
      resultado._taxaFixaLabel = `Taxa fixa Shopee CPF (${calcInputs._faixaLabel || ''})`;
    }

    // Shopee CPF experiente: adicional R$3/item — label customizado
    if (plat.id === 'shopee' && tipoVend === 'cpf_experiente') {
      resultado._taxaFixaLabel = 'Adicional CPF (R$3,00/item)';
    }
  }

  registerCalculo();
  console.log('[CALC] Cálculo registrado no freemium');

  setState({ lastResult: resultado, activePlatform: plat.id, sellerType: tipoAnuncio });
  console.log('[CALC] Estado atualizado');

  console.log('[CALC] Chamando renderResultHero...');
  renderResultHero(resultado);
  console.log('[CALC] renderResultHero completou');

  console.log('[CALC] Chamando renderExtrato...');
  renderExtrato(resultado);
  console.log('[CALC] renderExtrato completou');

  const actionsEl = document.getElementById('calc-actions');
  console.log('[CALC] Element calc-actions encontrado?', !!actionsEl);
  actionsEl?.classList.remove('hidden');
  console.log('[CALC] Renderização concluída');

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

  document.getElementById('cmp-shopee-tipo')?.addEventListener('change', (e) => {
    setState({ cmpShopeeTipo: e.target.value });
  });

  document.getElementById('cmp-amazon-tipo')?.addEventListener('change', (e) => {
    setState({ cmpAmazonTipo: e.target.value });
  });

  document.getElementById('btn-comparar')?.addEventListener('click', _handleComparar);
}

function _fillComparFields() {
  const s = getInputs();
  _setVal('cmp-custo',   s.custo);
  _setVal('cmp-peso',    s.peso);
  _setVal('cmp-extras',  s.extras);
  _setVal('cmp-margem',  s.margem);
  _setVal('cmp-imposto', s.imposto ?? 0);
}

function _bindComparInputChange() {
  const map = {
    'cmp-custo':   'custo',
    'cmp-peso':    'peso',
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
    pesoKg:           parseInputValue(document.getElementById('cmp-peso')?.value),
    custosAdicionais: parseInputValue(document.getElementById('cmp-extras')?.value),
    margemLucro:      parseInputValue(document.getElementById('cmp-margem')?.value),
    imposto:          parseInputValue(document.getElementById('cmp-imposto')?.value),
  };

  const state2 = getState();
  const tipoMap = {
    shopee: state2.cmpShopeeTipo || 'cnpj',
    amazon: state2.cmpAmazonTipo || 'fba',
  };
  const resultados = comparar(base, _PLATAFORMAS, null, false, tipoMap);

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
  console.log('[RENDER] renderResultHero: elemento encontrado?', !!el);
  console.log('[RENDER] renderResultHero: resultado válido?', !!resultado);
  if (!el || !resultado) {
    console.log('[RENDER] renderResultHero: retornando sem renderizar');
    return;
  }

  const pctPlat = resultado.precoVenda > 0
    ? (resultado.breakdown.deducoesDaPlataforma / resultado.precoVenda) * 100
    : 0;

  console.log('[RENDER] renderResultHero: antes de setInnerHTML');
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
    ${resultado._showAviso ? `
    <p class="plat-aviso${resultado._avisoTipo === 'error' ? ' plat-aviso--error' : ''}">
      ${_esc(resultado._avisoTexto || '')}
    </p>` : ''}
  `;

  console.log('[RENDER] renderResultHero: removendo classe hidden');
  el.classList.remove('hidden');
  console.log('[RENDER] renderResultHero: classList agora =', Array.from(el.classList));
}

// ─── RENDER: EXTRATO ─────────────────────────────────────────────────────────

export function renderExtrato(resultado) {
  const container = document.getElementById('calc-extrato');
  const table     = document.getElementById('extrato-table');
  console.log('[RENDER] renderExtrato: container encontrado?', !!container);
  console.log('[RENDER] renderExtrato: table encontrado?', !!table);
  console.log('[RENDER] renderExtrato: resultado válido?', !!resultado);
  if (!container || !table || !resultado) {
    console.log('[RENDER] renderExtrato: retornando sem renderizar');
    return;
  }

  const bd    = resultado.breakdown;
  const isML  = resultado._platId === 'mercadolivre';

  // Para ML com campanha, separa comissão pura de Product Ads
  const comissaoExibir = (isML && resultado._campanhaAtiva)
    ? resultado._comissaoPuraValor
    : bd.comissaoValor;

  const freteLabel = resultado._freteDescricao
    ? `Frete (${resultado._freteDescricao})`
    : 'Frete';

  const rows = [
    { label: 'Valor de venda',   valor:  resultado.precoVenda, classe: '', secao: '' },

    // ──── BLOCO 1: CUSTO DA PLATAFORMA (comissão + taxa fixa + frete) ────
    { label: 'CUSTO DA PLATAFORMA', valor: null, classe: 'row-secao-header', secao: 'plataforma' },
    {
      label:  resultado._comissaoLabel
        ? `Comissão ${resultado._comissaoLabel}`
        : 'Comissão',
      valor:  -comissaoExibir,
      classe: 'row-deduction',
      secao:  'plataforma',
    },
    // Linha de Product Ads separada (apenas ML com campanha ativa)
    ...(isML && resultado._campanhaAtiva && resultado._campanhaValor > 0 ? [{
      label:  resultado._campanhaLabel || 'Product Ads (estimativa 2,5%)',
      valor:  -resultado._campanhaValor,
      classe: 'row-deduction',
      secao:  'plataforma',
    }] : []),
    // Taxa fixa: label customizado para ML; filtro automático remove se valor = 0
    {
      label:  resultado._taxaFixaLabel || 'Taxa fixa anúncio',
      valor:  -bd.taxaAnuncioValor,
      classe: 'row-deduction',
      secao:  'plataforma',
    },
    // Frete (fixo ou percentual)
    {
      label:  freteLabel,
      valor:  -bd.freteValor,
      classe: 'row-deduction',
      secao:  'plataforma',
    },

    // ──── BLOCO 2: CUSTOS DE VENDA (afiliados + ads) ────
    { label: 'CUSTOS DE VENDA', valor: null, classe: 'row-secao-header', secao: 'venda' },
    ...(bd.afiliadosValor > 0 ? [{
      label:  'Afiliados',
      valor:  -bd.afiliadosValor,
      classe: 'row-deduction',
      secao:  'venda',
    }] : []),
    ...(bd.adsPercentualValor > 0 ? [{
      label:  'Ads (%)',
      valor:  -bd.adsPercentualValor,
      classe: 'row-deduction',
      secao:  'venda',
    }] : []),
    ...(bd.adsFixoValor > 0 ? [{
      label:  'Ads (fixo)',
      valor:  -bd.adsFixoValor,
      classe: 'row-deduction',
      secao:  'venda',
    }] : []),

    // ──── BLOCO 3: IMPOSTO ────
    { label: 'IMPOSTO', valor: null, classe: 'row-secao-header', secao: 'imposto' },
    { label: 'Imposto', valor: -bd.impostoValor, classe: 'row-deduction', secao: 'imposto' },

    // ──── BLOCO 4: OUTROS CUSTOS ────
    { label: 'OUTROS CUSTOS', valor: null, classe: 'row-secao-header', secao: 'outros' },
    { label: 'Custo do produto', valor: -bd.custosProduto, classe: 'row-deduction', secao: 'outros' },
    { label: 'Custos adicionais', valor: -bd.custosAdicionais, classe: 'row-deduction', secao: 'outros' },

    // ──── DESCONTO (se houver) ────
    ...(resultado.desconto > 0 ? [{
      label:  `Desconto (${resultado.desconto}%)`,
      valor:  -bd.descontoValor,
      classe: 'row-deduction',
      secao:  'desconto',
    }] : []),

    // ──── BLOCO 5: RESULTADO FINAL ────
    { label: 'Lucro líquido', valor: resultado.lucroLiquido, classe: 'row-total', secao: 'resultado' },
  ];

  table.innerHTML = rows
    .filter((r) => {
      // Remove linhas com valor 0, exceto headers e totais
      if (r.valor === null) return true; // Headers
      if (r.classe === 'row-total') return true; // Total
      return Math.abs(r.valor) > 0.01;  // Filtro levemente mais rigoroso para erros de ponto flutuante
    })
    .map(({ label, valor, classe }) => `
      <tr class="${classe}">
        <td>${label}</td>
        <td>${valor === null ? '' : (valor < 0 ? '−&nbsp;' : '') + formatBRL(Math.abs(valor))}</td>
      </tr>`)
    .join('');

  console.log('[RENDER] renderExtrato: removendo classe hidden');
  container.classList.remove('hidden');
  console.log('[RENDER] renderExtrato: classList agora =', Array.from(container.classList));
}

// ─── RENDER: COMPARAÇÃO ──────────────────────────────────────────────────────

export function renderComparacao(resultados) {
  const winnerEl  = document.getElementById('cmp-winner');
  const rankingEl = document.getElementById('cmp-ranking');
  if (!winnerEl || !rankingEl || !resultados?.length) return;

  const [winner, ...rest] = resultados;
  const maxLucro  = winner.lucroLiquido;
  const pctWinner = winner.precoVenda > 0
    ? (winner.breakdown.deducoesDaPlataforma / winner.precoVenda) * 100
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

// ─── HELPERS: Formatar Diretriz de Frete ─────────────────────────────────────

/**
 * Formata o freteRegra de uma plataforma em HTML legível para exibição.
 * @param {Object} plat - objeto de plataforma
 * @returns {string} HTML com a descrição da diretriz de frete
 */
function _obterDiretrizFrete(plat) {
  if (!plat || !plat.freteRegra) return '';

  const regra = plat.freteRegra;

  // ─── TIKTOK: Percentual do GMV com cap ───
  if (regra.tipo === 'percentualGMV') {
    return `
      <div class="frete-info">
        <h3 class="frete-titulo">📦 Diretriz de frete (SFP)</h3>
        <p class="frete-descricao">
          <strong>${regra.percentual}% do valor do produto</strong> (cap de R$ ${regra.cap.toFixed(2)})
        </p>
        <p class="frete-exemplo">Exemplo: Em produto de R$100, frete = R$6 (cap não atinge)</p>
      </div>
    `;
  }

  // ─── SHOPEE: Subsídio por faixa de preço ───
  if (regra.tipo === 'subsidioFaixa') {
    const faixasDesc = regra.faixas
      .map((f) => {
        const ateLbl = isFinite(f.max) ? `até R$ ${f.max.toFixed(2)}` : 'acima';
        return `<li>Até R$ ${f.max.toFixed(2)}: subsídio de R$ ${f.subsidio.toFixed(2)}</li>`;
      })
      .join('');
    return `
      <div class="frete-info">
        <h3 class="frete-titulo">📦 Diretriz de frete</h3>
        <p class="frete-descricao"><strong>Frete grátis obrigatório</strong> — subsídio da plataforma por faixa</p>
        <ul class="frete-faixas">
          ${faixasDesc}
        </ul>
      </div>
    `;
  }

  // ─── MERCADO LIVRE: Tabela de peso + frete grátis ───
  if (regra.tipo === 'tabelaPeso') {
    const tabelaDesc = regra.tabela
      .slice(0, 6) // Mostrar apenas as 6 primeiras (maioria dos casos)
      .map((t) => {
        if (t.valor === null) {
          return `<li>${t.label}</li>`;
        }
        return `<li>${t.label}: R$ ${t.valor.toFixed(2)}</li>`;
      })
      .join('');
    return `
      <div class="frete-info">
        <h3 class="frete-titulo">📦 Diretriz de frete (por peso)</h3>
        <p class="frete-descricao">
          <strong>Frete grátis obrigatório</strong> para pedidos ≥ R$ ${regra.freteGratisMinimo.toFixed(2)}
        </p>
        <p class="frete-subtitulo">Abaixo do limite, tabela por peso:</p>
        <ul class="frete-tabela">
          ${tabelaDesc}
        </ul>
      </div>
    `;
  }

  return '';
}

// ─── RENDER: PAINEL DE REGRAS E FAIXAS ───────────────────────────────────────

function _renderPlatformaRegras() {
  const cardEl   = document.getElementById('plat-regras-card');
  const tbodyEl  = document.getElementById('plat-faixas-tbody');
  const freteEl  = document.getElementById('plat-frete-diretriz');
  const avisoBox = document.getElementById('plat-aviso-box');

  if (!cardEl || !tbodyEl || !freteEl) return;

  const state     = getState();
  const plat      = _findPlat(state.activePlatform);
  if (!plat) {
    cardEl.classList.add('hidden');
    return;
  }

  // Determina qual tipo de vendedor usar
  let tipoVend = state.sellerType;
  if (plat.id === 'mercadolivre') {
    // ML usa chave combinada tipoAnuncio_logistica
    const tipoAnuncio = state.sellerType || 'classico';
    const logistica   = state.mlLogistica || 'full';
    tipoVend          = `${tipoAnuncio}_${logistica}`;
  }

  const faixas = obterFaixasFormatadas(plat, tipoVend);
  if (!faixas?.length) {
    cardEl.classList.add('hidden');
    return;
  }

  // Renderiza as faixas na tabela
  tbodyEl.innerHTML = faixas.map((f) => {
    const comissaoLabel = f.comissao > 0 ? `${f.comissao}%` : '—';
    const taxaLabel     = f.fixo > 0 ? `R$ ${f.fixo.toFixed(2)}` : '—';
    return `
      <tr>
        <td>${f.label}</td>
        <td>${comissaoLabel}</td>
        <td>${taxaLabel}</td>
      </tr>
    `;
  }).join('');

  // Renderiza a diretriz de frete
  const diretrizHTML = _obterDiretrizFrete(plat);
  if (diretrizHTML) {
    freteEl.innerHTML = diretrizHTML;
    freteEl.classList.remove('hidden');
  } else {
    freteEl.classList.add('hidden');
  }

  cardEl.classList.remove('hidden');
}

function _updatePlatformaAvisoFaixa() {
  const avisoBox = document.getElementById('plat-aviso-box');
  if (!avisoBox) return;

  const state = getState();
  const plat  = _findPlat(state.activePlatform);
  if (!plat) {
    avisoBox.classList.add('hidden');
    return;
  }

  // Obtém os inputs (se usuário já digitou custo + margem)
  const custo  = parseInputValue(document.getElementById('calc-custo')?.value);
  const margem = parseInputValue(document.getElementById('calc-margem')?.value);

  if (!custo || !margem) {
    avisoBox.classList.add('hidden');
    return;
  }

  // Determina qual tipo de vendedor usar
  let tipoVend = state.sellerType;
  if (plat.id === 'mercadolivre') {
    const tipoAnuncio = state.sellerType || 'classico';
    const logistica   = state.mlLogistica || 'full';
    tipoVend          = `${tipoAnuncio}_${logistica}`;
  }

  const faixas = plat.faixas[tipoVend] || plat.faixas[Object.keys(plat.faixas)[0]];
  if (!faixas?.length) {
    avisoBox.classList.add('hidden');
    return;
  }

  // Monta os inputs base para calcular o preço estimado
  const baseInputs = {
    custoProduto:     custo,
    custoFrete:       parseInputValue(document.getElementById('calc-frete')?.value) || 0,
    custosAdicionais: parseInputValue(document.getElementById('calc-extras')?.value) || 0,
    margemLucro:      margem,
    imposto:          parseInputValue(document.getElementById('calc-imposto')?.value) || 0,
  };

  // Mapeia para inputs de cálculo (encontra a faixa correta)
  const calcInputs = mapPlataformaToInputs(baseInputs, plat, tipoVend, !!state.inputs.campanha);
  if (!calcInputs) {
    avisoBox.classList.add('hidden');
    return;
  }

  // Calcula o preço de venda estimado
  const resultado = calcular(calcInputs);
  if (!resultado) {
    avisoBox.classList.add('hidden');
    return;
  }

  const precoVenda = resultado.precoVenda;

  // Identifica a faixa atual e próxima
  const faixaInfo = identificarFaixa(precoVenda, faixas);
  if (!faixaInfo || !faixaInfo.aviso) {
    avisoBox.classList.add('hidden');
    return;
  }

  avisoBox.innerHTML = `<p class="plat-aviso-text">💡 ${_esc(faixaInfo.aviso)}</p>`;
  avisoBox.classList.remove('hidden');
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
