// onboarding.js — PrecificaPRO
// Responsabilidade: wizard de cadastro estendido (3 passos) — Identidade, Fiscal, Operação
// Roda DEPOIS do aceite do convite (nome+senha) e ANTES de liberar a calculadora.
// Cada passo salva ao avançar (upsert em profiles) — retomável se o usuário sair no meio.

import { getCurrentUserId, getCurrentUserEmail, refreshOnboardingStatus } from './auth.js';
import { getProfile, updateUserProfile } from './supabase.js';
import { showToast } from './ui.js';

const PLATAFORMAS_ONBOARDING = [
  { id: 'mercadolivre', label: 'Mercado Livre' },
  { id: 'shopee',       label: 'Shopee' },
  { id: 'amazon',       label: 'Amazon' },
  { id: 'tiktok',       label: 'TikTok Shop' },
  { id: 'shein',        label: 'Shein' },
];

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

let _step = 1;
let _profile = null;
let _bound = false;

export async function initOnboarding() {
  if (!document.getElementById('view-onboarding')) return;

  _populateUF();
  _populatePlataformas();

  if (!_bound) {
    document.getElementById('btn-onboarding-avancar')?.addEventListener('click', _handleAvancar);
    document.getElementById('btn-onboarding-voltar')?.addEventListener('click', _handleVoltar);
    document.getElementById('onboarding-cnpj')?.addEventListener('input', _maskCNPJ);
    window.addEventListener('hashchange', () => {
      if (_currentRoute() === 'onboarding') _loadAndRender();
    });
    _bound = true;
  }

  if (_currentRoute() === 'onboarding') await _loadAndRender();
}

async function _loadAndRender() {
  const userId = getCurrentUserId();
  if (!userId) return;

  try {
    _profile = await getProfile(userId);
  } catch (err) {
    console.warn('⚠️ Falha ao carregar perfil para onboarding:', err.message);
    _profile = null;
  }

  _setTxt('onboarding-nome-display', _profile?.nome || '—');
  _setTxt('onboarding-email-display', getCurrentUserEmail() || '—');
  _setVal('onboarding-telefone', _profile?.telefone || '');
  _setVal('onboarding-cnpj', _profile?.cnpj || '');
  _setSelectVal('onboarding-regime', _profile?.regime);
  _setSelectVal('onboarding-atividade', _profile?.atividade);
  _setSelectVal('onboarding-skus', _profile?.skus);
  _setSelectVal('onboarding-pedidos-dia', _profile?.pedidos_dia);
  _setVal('onboarding-cidade', _profile?.cidade || '');
  _setSelectVal('onboarding-uf', _profile?.uf);
  _setChecked('onboarding-funcionario', _profile?.tem_funcionario);
  _setChecked('onboarding-outro-precificador', _profile?.usa_outro_precificador);

  const plataformasAtivas = _profile?.plataformas || [];
  document.querySelectorAll('#onboarding-plataformas input[type="checkbox"]').forEach((cb) => {
    cb.checked = plataformasAtivas.includes(cb.value);
  });

  _step = _firstIncompleteStep(_profile);
  _renderStep();
}

function _firstIncompleteStep(p) {
  if (!p || !p.telefone) return 1;
  if (!p.cnpj || !p.regime || !p.atividade) return 2;
  return 3;
}

function _renderStep() {
  [1, 2, 3].forEach((n) => {
    document.getElementById(`onboarding-step-${n}`)?.classList.toggle('hidden', n !== _step);
  });
  document.querySelectorAll('#onboarding-steps .onboarding-step').forEach((el) => {
    const n = parseInt(el.dataset.step, 10);
    el.classList.toggle('active', n === _step);
    el.classList.toggle('done', n < _step);
  });
  document.getElementById('btn-onboarding-voltar')?.classList.toggle('hidden', _step === 1);
  const btnAvancar = document.getElementById('btn-onboarding-avancar');
  if (btnAvancar) btnAvancar.textContent = _step === 3 ? 'Concluir' : 'Avançar';
  _hideError();
}

function _handleVoltar() {
  if (_step > 1) {
    _step -= 1;
    _renderStep();
  }
}

async function _handleAvancar() {
  const userId = getCurrentUserId();
  if (!userId) return;

  const btnAvancar = document.getElementById('btn-onboarding-avancar');
  const textoOriginal = btnAvancar?.textContent;
  if (btnAvancar) {
    btnAvancar.disabled = true;
    btnAvancar.textContent = 'Salvando...';
  }

  try {
    if (_step === 1) {
      const telefone = document.getElementById('onboarding-telefone')?.value.trim();
      if (!telefone) return _showError('Informe seu telefone/WhatsApp');

      if (!(await _save({ telefone }))) return;
      _step = 2;
      _renderStep();
      return;
    }

    if (_step === 2) {
      const cnpjRaw = document.getElementById('onboarding-cnpj')?.value || '';
      const cnpj = cnpjRaw.replace(/\D/g, '');
      const regime = document.getElementById('onboarding-regime')?.value;
      const atividade = document.getElementById('onboarding-atividade')?.value;

      if (!validarCNPJ(cnpj)) return _showError('CNPJ inválido — confira os números');
      if (!regime) return _showError('Selecione o regime tributário');
      if (!atividade) return _showError('Selecione a atividade principal');

      if (!(await _save({ cnpj, regime, atividade }))) return;
      _step = 3;
      _renderStep();
      return;
    }

    if (_step === 3) {
      const plataformas = Array.from(
        document.querySelectorAll('#onboarding-plataformas input[type="checkbox"]:checked')
      ).map((cb) => cb.value);
      const skus = document.getElementById('onboarding-skus')?.value;
      const pedidosDia = document.getElementById('onboarding-pedidos-dia')?.value;
      const cidade = document.getElementById('onboarding-cidade')?.value.trim();
      const uf = document.getElementById('onboarding-uf')?.value;
      const temFuncionario = !!document.getElementById('onboarding-funcionario')?.checked;
      const usaOutroPrecificador = !!document.getElementById('onboarding-outro-precificador')?.checked;

      if (!plataformas.length) return _showError('Selecione ao menos uma plataforma');
      if (!skus) return _showError('Selecione a quantidade de SKUs');
      if (!pedidosDia) return _showError('Selecione a faixa de pedidos por dia');
      if (!cidade) return _showError('Informe a cidade');
      if (!uf) return _showError('Selecione a UF');

      const ok = await _save({
        plataformas,
        skus,
        pedidos_dia: pedidosDia,
        cidade,
        uf,
        tem_funcionario: temFuncionario,
        usa_outro_precificador: usaOutroPrecificador,
        onboarding_completo: true,
      });
      if (!ok) return;

      await refreshOnboardingStatus();
      showToast('✅ Cadastro completo! Bem-vindo ao PrecificaPRO.', 'success');
      window.location.hash = '#/calcular';
    }
  } finally {
    if (btnAvancar) {
      btnAvancar.disabled = false;
      // Se o passo mudou (sucesso), _renderStep() já ajustou o texto — só restaura em erro
      if (btnAvancar.textContent === 'Salvando...') btnAvancar.textContent = textoOriginal;
    }
  }
}

async function _save(fields) {
  const userId = getCurrentUserId();
  try {
    await updateUserProfile(userId, fields);
    return true;
  } catch (err) {
    _showError('Erro ao salvar: ' + err.message);
    return false;
  }
}

function _showError(msg) {
  const el = document.getElementById('onboarding-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function _hideError() {
  const el = document.getElementById('onboarding-error');
  if (el) el.style.display = 'none';
}

function _populateUF() {
  const select = document.getElementById('onboarding-uf');
  if (!select || select.options.length) return;
  select.innerHTML = '<option value="">Selecione</option>' +
    UFS.map((uf) => `<option value="${uf}">${uf}</option>`).join('');
}

function _populatePlataformas() {
  const container = document.getElementById('onboarding-plataformas');
  if (!container || container.children.length) return;
  container.innerHTML = PLATAFORMAS_ONBOARDING.map((p) => `
    <label class="toggle-label">
      <input type="checkbox" value="${p.id}" />
      <span>${p.label}</span>
    </label>
  `).join('');
}

function _maskCNPJ(e) {
  let v = e.target.value.replace(/\D/g, '').slice(0, 14);
  if (v.length > 12) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
  else if (v.length > 8) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
  else if (v.length > 5) v = v.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
  else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,3})/, '$1.$2');
  e.target.value = v;
}

// Validação de CNPJ (dígitos verificadores — módulo 11)
export function validarCNPJ(cnpj) {
  const c = String(cnpj || '').replace(/\D/g, '');
  if (c.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(c)) return false;

  const calcDigito = (base) => {
    const pesos = base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base.split('').reduce((acc, d, i) => acc + parseInt(d, 10) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = calcDigito(c.slice(0, 12));
  const d2 = calcDigito(c.slice(0, 12) + d1);
  return c.slice(12) === `${d1}${d2}`;
}

function _currentRoute() {
  return (window.location.hash || '').replace(/^#\/?/, '').split('?')[0] || 'calcular';
}
function _setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v ?? ''; }
function _setSelectVal(id, v) { const el = document.getElementById(id); if (el && v) el.value = v; }
function _setTxt(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function _setChecked(id, v) { const el = document.getElementById(id); if (el) el.checked = !!v; }
