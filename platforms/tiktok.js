// platforms/tiktok.js — PrecificaPRO
// Fonte: seller-br.tiktok.com/university (atualizado 30/07/2026)
// Vigente desde 15/07/2026 — verificar mensalmente (plataforma em expansão no BR)
//
// Tabela vigente desde 15/07/2026:
//   Produto abaixo de R$50  → 10% + R$4 por item
//   Produto R$50 ou acima   → 6%  + R$6 por item
//
// Benefício temporário: novos vendedores podem ter 0% por 60 dias (até R$17k)
// ⚠️ Esse benefício é temporário — não usar como taxa permanente no precificador.

export default {
  id:    'tiktok',
  nome:  'TikTok Shop',
  sigla: 'TT',
  cor:        '#00f2ea',
  corFundo:   '#e0fffe',
  corTexto:   '#00796b',

  tiposVendedor: null,

  campanha:    true,
  taxaCampanha: 2.0,

  aviso:     '⚠️ Tabela vigente desde 15/07/2026. Novos vendedores podem ter 0% por 60 dias (benefício temporário). Confirme em seller-br.tiktok.com.',
  avisoTipo: 'warning',

  faixas: {
    padrao: [
      { max: 49.99,    comissao: 10, fixo: 4, variavel: 0, label: 'abaixo de R$50 (10% + R$4)'  },
      { max: Infinity, comissao: 6,  fixo: 6, variavel: 0, label: 'R$50 ou mais (6% + R$6)'     },
    ],
  },
};
