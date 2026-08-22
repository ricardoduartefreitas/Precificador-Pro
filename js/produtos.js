// produtos.js — PrecificaPRO
// FASE 2: aba "Meus Produtos" — CRUD de produtos + Perfil de Negócio
// O cálculo feito a partir daqui alimenta `calculos` (o dado de ouro da Fase 3)

import { setState, setInput } from './state.js';
import { showToast } from './ui.js';
import { getCurrentUserId } from './auth.js';
import {
  listProdutos, createProduto, updateProduto, deleteProduto,
  listCategorias, getPerfilNegocio, upsertPerfilNegocio,
} from './supabase.js';
import { formatBRL } from './formatter.js';

let _plataformas = [];
let _categorias = [];
let _produtos = [];

// ---------- CEP → REGIÃO (N/NE/CO/SE/S) ----------
// Range simplificado no prefixo de 5 dígitos — suficiente para region, não para UF exata
const CEP_REGIOES = [
  { min: 1000,  max: 19999,  regiao: 'Sudeste'      }, // SP
  { min: 20000, max: 28999,  regiao: 'Sudeste'      }, // RJ
  { min: 29000, max: 29999,  regiao: 'Sudeste'      }, // ES
  { min: 30000, max: 39999,  regiao: 'Sudeste'      }, // MG
  { min: 40000, max: 48999,  regiao: 'Nordeste'      }, // BA
  { min: 49000, max: 49999,  regiao: 'Nordeste'      }, // SE
  { min: 50000, max: 56999,  regiao: 'Nordeste'      }, // PE
  { min: 57000, max: 57999,  regiao: 'Nordeste'      }, // AL
  { min: 58000, max: 58999,  regiao: 'Nordeste'      }, // PB
  { min: 59000, max: 59999,  regiao: 'Nordeste'      }, // RN
  { min: 60000, max: 63999,  regiao: 'Nordeste'      }, // CE
  { min: 64000, max: 64999,  regiao: 'Nordeste'      }, // PI
  { min: 65000, max: 65999,  regiao: 'Nordeste'      }, // MA
  { min: 66000, max: 68899,  regiao: 'Norte'         }, // PA
  { min: 68900, max: 68999,  regiao: 'Norte'         }, // AP
  { min: 69000, max: 69299,  regiao: 'Norte'         }, // AM
  { min: 69300, max: 69399,  regiao: 'Norte'         }, // RR
  { min: 69400, max: 69899,  regiao: 'Norte'         }, // AM
  { min: 69900, max: 69999,  regiao: 'Norte'         }, // AC
  { min: 70000, max: 72799,  regiao: 'Centro-Oeste'  }, // DF
  { min: 72800, max: 72999,  regiao: 'Centro-Oeste'  }, // DF/GO
  { min: 73000, max: 76799,  regiao: 'Centro-Oeste'  }, // GO
  { min: 76800, max: 76999,  regiao: 'Norte'         }, // RO
  { min: 77000, max: 77999,  regiao: 'Norte'         }, // TO
  { min: 78000, max: 78899,  regiao: 'Centro-Oeste'  }, // MT
  { min: 78900, max: 78999,  regiao: 'Norte'         }, // RO/AC
  { min: 79000, max: 79999,  regiao: 'Centro-Oeste'  }, // MS
  { min: 80000, max: 87999,  regiao: 'Sul'           }, // PR
  { min: 88000, max: 89999,  regiao: 'Sul'           }, // SC
  { min: 90000, max: 99999,  regiao: 'Sul'           }, // RS
];

export function deriveRegiaoFromCep(cep) {
  const digits = String(cep || '').replace(/\D/g, '').slice(0, 5);
  if (digits.length < 5) return null;
  const n = parseInt(digits, 10);
  const faixa = CEP_REGIOES.find((f) => n >= f.min && n <= f.max);
  return faixa ? faixa.regiao : null;
}

// ---------- INICIALIZAÇÃO ----------

export async function initProdutos(plataformas = []) {
  _plataformas = plataformas;

  if (!document.getElementById('view-produtos')) return; // não montada — nada a fazer

  document.getElementById('btn-salvar-produto')?.addEventListener('click', _handleSalvarProduto);
  document.getElementById('btn-cancelar-edicao-produto')?.addEventListener('click', _resetForm);
  document.getElementById('btn-salvar-perfil')?.addEventListener('click', _handleSalvarPerfil);
  document.getElementById('perfil-cep')?.addEventListener('input', _updateRegiaoPreview);

  _populatePlataformaSelect();

  window.addEventListener('hashchange', () => {
    if (_currentRoute() === 'produtos') _loadProdutos();
  });

  // Carga inicial só faz sentido se já caiu na rota (evita chamada Supabase à toa no boot)
  if (_currentRoute() === 'produtos') {
    await _populateCategoriaSelects();
    await _loadProdutos();
    await _loadPerfil();
  } else {
    // Popula categorias em segundo plano para já estarem prontas quando o usuário navegar
    _populateCategoriaSelects().catch(() => {});
  }

  window.addEventListener('hashchange', async () => {
    if (_currentRoute() === 'produtos') {
      if (!_categorias.length) await _populateCategoriaSelects();
      await _loadPerfil();
    }
  });
}

function _populatePlataformaSelect() {
  const select = document.getElementById('produto-plataforma');
  if (!select) return;
  select.innerHTML = '';
  _plataformas.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.nome;
    select.appendChild(opt);
  });
}

async function _populateCategoriaSelects() {
  try {
    _categorias = await listCategorias();
  } catch (err) {
    console.warn('⚠️ Falha ao carregar categorias:', err.message);
    return;
  }

  [document.getElementById('perfil-categoria'), document.getElementById('produto-categoria')].forEach((select) => {
    if (!select) return;
    select.innerHTML = '';
    _categorias.forEach((nome) => {
      const opt = document.createElement('option');
      opt.value = nome;
      opt.textContent = nome;
      select.appendChild(opt);
    });
  });
}

// ---------- LISTA DE PRODUTOS ----------

async function _loadProdutos() {
  const tbody = document.getElementById('produtos-tabela-tbody');
  const vazio = document.getElementById('produtos-vazio');
  if (!tbody) return;

  try {
    _produtos = await listProdutos();
  } catch (err) {
    showToast('Erro ao carregar produtos: ' + err.message, 'error');
    return;
  }

  if (!_produtos.length) {
    tbody.innerHTML = '';
    vazio?.classList.remove('hidden');
    return;
  }
  vazio?.classList.add('hidden');

  tbody.innerHTML = _produtos.map((p) => {
    const platLabel = _plataformas.find((pl) => pl.id === p.plataforma)?.nome || p.plataforma || '—';
    return `
      <tr>
        <td>${_esc(p.nome)}</td>
        <td>${_esc(p.categoria || '—')}</td>
        <td>${p.custo != null ? formatBRL(p.custo) : '—'}</td>
        <td>${_esc(platLabel)}</td>
        <td class="produtos-acoes">
          <button class="btn btn--secondary btn--icon" data-action="calcular" data-id="${p.id}">Calcular</button>
          <button class="btn btn--ghost btn--icon" data-action="editar" data-id="${p.id}">Editar</button>
          <button class="btn btn--danger btn--icon" data-action="apagar" data-id="${p.id}">Apagar</button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('button[data-action]').forEach((btn) => {
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === 'editar') btn.addEventListener('click', () => _handleEditarProduto(id));
    if (action === 'apagar') btn.addEventListener('click', () => _handleApagarProduto(id));
    if (action === 'calcular') btn.addEventListener('click', () => _handleCalcularProduto(id));
  });
}

// ---------- FORMULÁRIO DE PRODUTO ----------

function _handleEditarProduto(id) {
  const produto = _produtos.find((p) => p.id === id);
  if (!produto) return;

  document.getElementById('produto-form-title').textContent = 'Editar produto';
  document.getElementById('produto-edit-id').value = id;
  _setVal('produto-nome', produto.nome);
  _setSelectVal('produto-categoria', produto.categoria);
  _setVal('produto-custo', produto.custo);
  _setVal('produto-peso', produto.peso_kg);
  _setSelectVal('produto-plataforma', produto.plataforma);
  _setVal('produto-margem', produto.margem_default ?? 30);

  document.getElementById('btn-cancelar-edicao-produto')?.classList.remove('hidden');
  document.getElementById('view-produtos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function _resetForm() {
  document.getElementById('produto-form-title').textContent = 'Novo produto';
  document.getElementById('produto-edit-id').value = '';
  _setVal('produto-nome', '');
  _setVal('produto-custo', '');
  _setVal('produto-peso', '');
  _setVal('produto-margem', 30);
  document.getElementById('btn-cancelar-edicao-produto')?.classList.add('hidden');
}

async function _handleSalvarProduto() {
  const userId = getCurrentUserId();
  if (!userId) {
    showToast('Faça login para cadastrar produtos', 'error');
    return;
  }

  const nome = document.getElementById('produto-nome')?.value.trim();
  if (!nome) {
    showToast('Informe o nome do produto', 'error');
    return;
  }

  const editId = document.getElementById('produto-edit-id')?.value;
  const payload = {
    nome,
    // categoria é NOT NULL no banco — cai para a 1ª do catálogo se o select ainda não carregou
    categoria: document.getElementById('produto-categoria')?.value || _categorias[0] || 'Outros',
    custo: parseFloat(document.getElementById('produto-custo')?.value) || 0,
    peso_kg: parseFloat(document.getElementById('produto-peso')?.value) || 0,
    plataforma: document.getElementById('produto-plataforma')?.value || null,
    margem_default: parseFloat(document.getElementById('produto-margem')?.value) || 30,
  };

  try {
    if (editId) {
      await updateProduto(editId, payload);
      showToast('Produto atualizado', 'success');
    } else {
      await createProduto({ ...payload, user_id: userId });
      showToast('Produto cadastrado', 'success');
    }
    _resetForm();
    await _loadProdutos();
  } catch (err) {
    showToast('Erro ao salvar produto: ' + err.message, 'error');
  }
}

async function _handleApagarProduto(id) {
  if (!window.confirm('Apagar este produto? Essa ação não pode ser desfeita.')) return;
  try {
    await deleteProduto(id);
    showToast('Produto apagado', 'success');
    await _loadProdutos();
  } catch (err) {
    showToast('Erro ao apagar produto: ' + err.message, 'error');
  }
}

// Leva o produto para a aba Calcular já pré-preenchido — o cálculo feito lá
// registra em `calculos` com este produto_id (ver ui.js/_handleCalcular)
function _handleCalcularProduto(id) {
  const produto = _produtos.find((p) => p.id === id);
  if (!produto) return;

  setState({ produtoAtivo: produto });
  if (produto.plataforma) setState({ activePlatform: produto.plataforma });

  setInput('custo', produto.custo || 0);
  setInput('margem', produto.margem_default ?? 30);

  window.location.hash = '#/calcular';

  // Os campos custo/peso/margem do formulário são preenchidos depois do hashchange
  // (a view precisa estar visível/renderizada primeiro)
  setTimeout(() => {
    _setVal('calc-custo', produto.custo || 0);
    _setVal('calc-peso', produto.peso_kg || 0);
    _setVal('calc-margem', produto.margem_default ?? 30);
  }, 50);
}

// ---------- PERFIL DE NEGÓCIO ----------

async function _loadPerfil() {
  const userId = getCurrentUserId();
  if (!userId) return;

  let perfil;
  try {
    perfil = await getPerfilNegocio(userId);
  } catch (err) {
    console.warn('⚠️ Falha ao carregar perfil de negócio:', err.message);
    return;
  }
  if (!perfil) return;

  _setSelectVal('perfil-categoria', perfil.categoria_principal);
  _setVal('perfil-cep', perfil.cep || '');
  _setVal('perfil-volume', perfil.volume_mensal_estimado ?? '');
  _updateRegiaoPreview();
}

function _updateRegiaoPreview() {
  const cep = document.getElementById('perfil-cep')?.value;
  const regiao = deriveRegiaoFromCep(cep);
  const el = document.getElementById('perfil-regiao-preview');
  if (el) el.textContent = `Região: ${regiao || '—'}`;
}

async function _handleSalvarPerfil() {
  const userId = getCurrentUserId();
  if (!userId) {
    showToast('Faça login para salvar o perfil', 'error');
    return;
  }

  const cep = document.getElementById('perfil-cep')?.value || '';
  const regiao = deriveRegiaoFromCep(cep);

  const payload = {
    user_id: userId,
    categoria_principal: document.getElementById('perfil-categoria')?.value || null,
    cep: cep || null,
    regiao,
    volume_mensal_estimado: parseInt(document.getElementById('perfil-volume')?.value, 10) || null,
  };

  try {
    await upsertPerfilNegocio(payload);
    showToast('Perfil de negócio salvo', 'success');
  } catch (err) {
    showToast('Erro ao salvar perfil: ' + err.message, 'error');
  }
}

// ---------- HELPERS ----------

function _setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? '';
}

function _setSelectVal(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.value = value;
}

function _esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function _currentRoute() {
  return (window.location.hash || '').replace(/^#\/?/, '').split('?')[0] || 'calcular';
}
