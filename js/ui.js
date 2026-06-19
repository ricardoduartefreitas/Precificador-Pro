// ui.js — PrecificaPRO
// Responsabilidade: funções de DOM, renderização de componentes e listeners de UI
// Não contém lógica de negócio — apenas apresentação

import { getState, setState, setInput } from './state.js';
import { formatBRL, formatPct } from './formatter.js';
import { showUpgradeOverlay } from './freemium.js';
import { saveEntry } from './history.js';
import { showToast } from './ui.js'; // self-reference para toast (exportado abaixo)

// ---------- INICIALIZAÇÃO ----------

export function initUI() {
  _bindSliders();
  _bindModals();
  _bindToast();
}

// ---------- TOAST ----------

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

// ---------- SLIDERS DE MARGEM ----------

function _bindSliders() {
  const sliders = [
    { range: 'cmp-margem', label: 'cmp-margem-label' },
    { range: 'calc-margem', label: 'calc-margem-label' },
  ];
  sliders.forEach(({ range, label }) => {
    const input = document.getElementById(range);
    const display = document.getElementById(label);
    if (!input || !display) return;
    input.addEventListener('input', () => {
      display.textContent = `${input.value}%`;
      setInput('margem', Number(input.value));
    });
  });
}

// ---------- MODAIS ----------

function _bindModals() {
  // Modal salvar
  document.getElementById('btn-modal-cancelar')?.addEventListener('click', closeModalSalvar);
  document.getElementById('btn-modal-confirmar')?.addEventListener('click', _confirmSave);

  // Overlay PRO
  document.getElementById('btn-fechar-overlay')?.addEventListener('click', closeOverlayPro);
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

export function openOverlayPro() {
  document.getElementById('overlay-pro')?.classList.remove('hidden');
}

export function closeOverlayPro() {
  document.getElementById('overlay-pro')?.classList.add('hidden');
}

function _confirmSave() {
  const nome = document.getElementById('modal-produto-nome')?.value.trim();
  if (!nome) {
    showToast('Digite o nome do produto', 'error');
    return;
  }
  const state = getState();
  saveEntry({
    tipo: 'individual',
    produto: nome,
    plataforma: state.activePlatform,
    tipoVendedor: state.sellerType,
    inputs: state.inputs,
    resultado: state.lastResult,
  });
  closeModalSalvar();
  showToast('Salvo no histórico', 'success');
}

// ---------- RENDER: RESULT HERO ----------

export function renderResultHero(resultado, plataforma) {
  const el = document.getElementById('calc-result');
  if (!el || !resultado) return;

  el.innerHTML = `
    <p class="result-preco-label">Preço sugerido</p>
    <p class="result-preco-valor">${formatBRL(resultado.precoSugerido)}</p>
    <div class="result-grid">
      <div>
        <p class="result-item-label">Lucro líquido</p>
        <p class="result-item-value text-green">${formatBRL(resultado.lucroLiquido)}</p>
      </div>
      <div>
        <p class="result-item-label">Margem real</p>
        <p class="result-item-value">${formatPct(resultado.margemReal)}</p>
      </div>
      <div>
        <p class="result-item-label">% plataforma</p>
        <p class="result-item-value text-red">${formatPct(resultado.pctPlataforma)}</p>
      </div>
    </div>
    <p class="result-faixa">Faixa: ${resultado.faixa} · Preço mínimo: ${formatBRL(resultado.precoMinimo)}</p>
  `;

  el.classList.remove('hidden');
}

// ---------- RENDER: EXTRATO ----------

export function renderExtrato(extrato) {
  const container = document.getElementById('calc-extrato');
  const table = document.getElementById('extrato-table');
  if (!container || !table || !extrato) return;

  const rows = [
    { label: 'Valor de venda',  valor: extrato.valorVenda,   classe: '' },
    { label: 'Custo do item',   valor: -extrato.custoItem,   classe: 'row-deduction' },
    { label: 'Outros custos',   valor: -extrato.outrosCustos, classe: 'row-deduction' },
    { label: 'Frete',           valor: -extrato.frete,        classe: 'row-deduction' },
    { label: 'Comissão',        valor: -extrato.comissao,     classe: 'row-deduction' },
    { label: 'Taxa fixa',       valor: -extrato.fixo,         classe: 'row-deduction' },
    { label: 'Taxa variável',   valor: -extrato.variavel,     classe: 'row-deduction' },
    { label: 'Lucro líquido',   valor: extrato.lucroLiquido,  classe: 'row-total' },
  ];

  table.innerHTML = rows
    .map(({ label, valor, classe }) => `
      <tr class="${classe}">
        <td>${label}</td>
        <td>${valor < 0 ? '−' : ''} ${formatBRL(Math.abs(valor))}</td>
      </tr>
    `)
    .join('');

  container.classList.remove('hidden');
}

// ---------- RENDER: WINNER + RANKING ----------

export function renderComparacao(resultados) {
  const winnerEl  = document.getElementById('cmp-winner');
  const rankingEl = document.getElementById('cmp-ranking');
  if (!winnerEl || !rankingEl || !resultados?.length) return;

  const [winner, ...rest] = resultados;
  const maxLucro = winner.lucroLiquido;

  // Winner Hero
  winnerEl.innerHTML = `
    <span class="winner-badge">🏆 Melhor opção</span>
    <p class="ranking-platform" style="color:${winner.cor}">${winner.nome}</p>
    <p class="result-preco-valor">${formatBRL(winner.precoSugerido)}</p>
    <div class="result-grid">
      <div>
        <p class="result-item-label">Lucro</p>
        <p class="result-item-value text-green">${formatBRL(winner.lucroLiquido)}</p>
      </div>
      <div>
        <p class="result-item-label">Margem</p>
        <p class="result-item-value">${formatPct(winner.margemReal)}</p>
      </div>
      <div>
        <p class="result-item-label">% plataforma</p>
        <p class="result-item-value text-red">${formatPct(winner.pctPlataforma)}</p>
      </div>
    </div>
  `;
  winnerEl.classList.remove('hidden');

  // Ranking das demais
  rankingEl.innerHTML = rest.map((r, i) => {
    const pct = maxLucro > 0 ? (r.lucroLiquido / maxLucro) * 100 : 0;
    return `
      <div class="ranking-card">
        <span class="ranking-pos">${i + 2}</span>
        <div class="ranking-info">
          <p class="ranking-platform" style="color:${r.cor}">${r.nome}</p>
          <div class="ranking-bar">
            <div class="ranking-bar-fill" style="width:${pct}%;background-color:${r.cor}"></div>
          </div>
        </div>
        <div class="ranking-price">
          <p class="ranking-price-value">${formatBRL(r.precoSugerido)}</p>
          <p class="ranking-price-lucro">+${formatBRL(r.lucroLiquido)}</p>
        </div>
      </div>
    `;
  }).join('');

  rankingEl.classList.remove('hidden');
}

// ---------- PLAN BADGE ----------

export function updatePlanBadge(isPro) {
  const badge = document.getElementById('plan-badge');
  if (!badge) return;
  badge.textContent = isPro ? 'PRO' : 'FREE';
  badge.classList.toggle('pro', isPro);
}
