// platforms/mercadolivre.js — PrecificaPRO
// Responsabilidade: tabela de taxas do Mercado Livre Brasil
// Fonte: https://www.mercadolivre.com.br/ajuda/custos-de-vender_1338
// Atualizado: Jun/2026 — verificar trimestralmente

export default {
  id:    'mercadolivre',
  nome:  'Mercado Livre',
  sigla: 'ML',
  cor:        '#f59e0b',
  corFundo:   '#fff3c0',
  corTexto:   '#b45309',

  // Tipos de vendedor disponíveis para esta plataforma
  tiposVendedor: [
    { key: 'cnpj',      label: 'CNPJ' },
    { key: 'cpf_menor', label: 'CPF < R$450' },
    { key: 'cpf_maior', label: 'CPF > R$450' },
  ],

  // Campanha promocional adiciona taxa extra
  campanha:    true,
  taxaCampanha: 2.5, // % adicional quando campanha ativa

  // Faixas de taxa por tipo de vendedor
  // comissao: % sobre o valor de venda
  // fixo: valor fixo em R$ por venda
  // variavel: % adicional (0 no ML Brasil atualmente)
  // max: limite superior da faixa (Infinity = sem limite)
  faixas: {
    cnpj: [
      { max: 79.99,    comissao: 20, fixo: 4,  variavel: 0, label: 'até R$79,99' },
      { max: 199.99,   comissao: 14, fixo: 16, variavel: 0, label: 'R$80 a R$199,99' },
      { max: 499.99,   comissao: 14, fixo: 26, variavel: 0, label: 'R$200 a R$499,99' },
      { max: Infinity, comissao: 14, fixo: 26, variavel: 0, label: 'acima de R$500' },
    ],
    cpf_menor: [
      { max: 79.99,    comissao: 20, fixo: 4,  variavel: 0, label: 'até R$79,99' },
      { max: 199.99,   comissao: 14, fixo: 16, variavel: 0, label: 'R$80 a R$199,99' },
      { max: 499.99,   comissao: 14, fixo: 26, variavel: 0, label: 'R$200 a R$499,99' },
      { max: Infinity, comissao: 14, fixo: 26, variavel: 0, label: 'acima de R$500' },
    ],
    cpf_maior: [
      { max: 79.99,    comissao: 20, fixo: 4,  variavel: 0, label: 'até R$79,99' },
      { max: 199.99,   comissao: 16, fixo: 16, variavel: 0, label: 'R$80 a R$199,99' },
      { max: 499.99,   comissao: 16, fixo: 26, variavel: 0, label: 'R$200 a R$499,99' },
      { max: Infinity, comissao: 16, fixo: 26, variavel: 0, label: 'acima de R$500' },
    ],
  },
};
