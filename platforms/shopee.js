// platforms/shopee.js — PrecificaPRO
// Responsabilidade: tabela de taxas da Shopee Brasil
// Fonte: https://seller.shopee.com.br/edu/article/7804
// Atualizado: Jun/2026 — verificar trimestralmente

export default {
  id:    'shopee',
  nome:  'Shopee',
  sigla: 'SP',
  cor:        '#ee4d2d',
  corFundo:   '#fff0ed',
  corTexto:   '#c0392b',

  tiposVendedor: [
    { key: 'cnpj',      label: 'CNPJ' },
    { key: 'cpf_menor', label: 'CPF < R$450' },
    { key: 'cpf_maior', label: 'CPF > R$450' },
  ],

  campanha:    true,
  taxaCampanha: 2.0,

  faixas: {
    cnpj: [
      { max: Infinity, comissao: 14, fixo: 0, variavel: 0, label: 'Taxa única CNPJ' },
    ],
    cpf_menor: [
      { max: 449.99,   comissao: 0,  fixo: 0, variavel: 0, label: 'até R$449,99 (isento)' },
      { max: Infinity, comissao: 20, fixo: 0, variavel: 0, label: 'acima de R$450' },
    ],
    cpf_maior: [
      { max: Infinity, comissao: 20, fixo: 0, variavel: 0, label: 'Taxa CPF > R$450/mês' },
    ],
  },
};
