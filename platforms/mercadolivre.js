// platforms/mercadolivre.js — PrecificaPRO
// Responsabilidade: tabela de taxas do Mercado Livre Brasil
// Fonte: https://www.mercadolivre.com.br/ajuda/custos-de-vender_1338
// Atualizado: Jun/2026 — verificar trimestralmente
//
// Estrutura de taxas ML Brasil 2026:
//   Clássico (gold_special): 11% comissão + R$4 (≤R$79,99) / R$6 (≥R$80)
//   Premium  (gold_pro):     19% comissão + R$4 (≤R$79,99) / R$6 (≥R$80)
// Taxa fixa cobre custo de envio no Mercado Envios ME2 (acima do threshold)
// Flex (self_service) cobra taxa fixa adicional em produtos abaixo do threshold
// ⚠️ Valide em: mercadolivre.com.br/ajuda/custos-de-vender_1338

export default {
  id:    'mercadolivre',
  nome:  'Mercado Livre',
  sigla: 'ML',
  cor:        '#f59e0b',
  corFundo:   '#fff3c0',
  corTexto:   '#b45309',

  // Label customizado para o select de tipo (sobrescreve "Tipo de vendedor")
  labelTipoVendedor: 'Tipo de anúncio',

  // Tipos de anúncio disponíveis no ML Brasil
  tiposVendedor: [
    { key: 'classico', label: 'Clássico'  },
    { key: 'premium',  label: 'Premium'   },
  ],

  // Campanha promocional (Product Ads) adiciona taxa extra sobre o preço de venda
  campanha:    true,
  taxaCampanha: 2.5,

  // Faixas de taxa por tipo de anúncio
  // comissao: % sobre o valor de venda (cobrado pelo ML)
  // fixo:     R$ por venda (cobre custo ME2 na maioria dos casos)
  // variavel: % adicional (0 no ML BR)
  // max:      teto da faixa em R$ (Infinity = sem limite)
  faixas: {
    classico: [
      { max: 79.99,    comissao: 11, fixo: 4, variavel: 0, label: 'Clássico (11%) até R$79,99' },
      { max: Infinity, comissao: 11, fixo: 6, variavel: 0, label: 'Clássico (11%) acima de R$80' },
    ],
    premium: [
      { max: 79.99,    comissao: 19, fixo: 4, variavel: 0, label: 'Premium (19%) até R$79,99' },
      { max: Infinity, comissao: 19, fixo: 6, variavel: 0, label: 'Premium (19%) acima de R$80' },
    ],
  },
};
