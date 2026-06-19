// platforms/amazon.js — PrecificaPRO
// Responsabilidade: tabela de taxas da Amazon Brasil
// Fonte: https://sellercentral.amazon.com.br/help/hub/reference/G200336920
// ⚠️  ATENÇÃO: taxas variam por categoria — valores abaixo são referência geral
// Atualizado: Jun/2026 — VALIDAR na Seller Central antes de usar em produção

export default {
  id:    'amazon',
  nome:  'Amazon',
  sigla: 'AMZ',
  cor:        '#ff9900',
  corFundo:   '#fff8e1',
  corTexto:   '#e65100',

  tiposVendedor: [
    { key: 'fba', label: 'FBA (Fulfillment by Amazon)' },
    { key: 'fbm', label: 'FBM (Fulfillment by Merchant)' },
  ],

  campanha:    false,
  taxaCampanha: 0,

  aviso:     '⚠️ Taxa de fulfillment FBA varia por peso e dimensão do produto. Consulte Seller Central BR → Configurações → Tarifas de referência.',
  avisoTipo: 'warning',

  // ⚠️  Taxas aproximadas para referência — variam por categoria
  // FBA inclui taxa de fulfillment estimada (~R$10–30 por item médio)
  faixas: {
    fba: [
      { max: 199.99,   comissao: 15, fixo: 15, variavel: 0, label: 'FBA até R$199,99' },
      { max: Infinity, comissao: 15, fixo: 25, variavel: 0, label: 'FBA acima de R$200' },
    ],
    fbm: [
      { max: 199.99,   comissao: 15, fixo: 0, variavel: 0, label: 'FBM até R$199,99' },
      { max: Infinity, comissao: 15, fixo: 0, variavel: 0, label: 'FBM acima de R$200' },
    ],
  },
};
