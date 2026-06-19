// platforms/mercadolivre.js — PrecificaPRO
// Fonte: mercadolivre.com.br/ajuda/custos-de-vender_1338
// Atualizado: Jun/2026
//
// Comissões ML Brasil 2026:
//   Clássico (gold_special): 11%  |  Premium (gold_pro): 19%
//
// Taxa fixa (fixed_fee) — varia por logística + faixa de preço:
//   Full / Drop Off → sem taxa fixa em nenhuma faixa
//   Normal (ME1) / Flex → R$4 abaixo de R$79,99 | sem taxa fixa acima
//
// Lógica: ativa desde 02/03/2026 (breaking change na API /listing_prices)
// ⚠️ Comissões podem variar por categoria — valide em mercadolivre.com.br/tarifas

export default {
  id:    'mercadolivre',
  nome:  'Mercado Livre',
  sigla: 'ML',
  cor:        '#f59e0b',
  corFundo:   '#fff3c0',
  corTexto:   '#b45309',

  // Label do primeiro select (exibido no lugar de "Tipo de vendedor")
  labelTipoVendedor: 'Tipo de anúncio',

  // Primeiro select: tipo de anúncio (determina a comissão %)
  tiposVendedor: [
    { key: 'classico', label: 'Clássico' },
    { key: 'premium',  label: 'Premium'  },
  ],

  // Segundo select: tipo de logística (determina a taxa fixa)
  tiposLogistica: [
    { key: 'full',    label: 'Full (Fulfillment)' },
    { key: 'dropoff', label: 'Drop Off (ME)'      },
    { key: 'normal',  label: 'Normal (ME1)'       },
    { key: 'flex',    label: 'Flex'               },
  ],

  // Campanha = Product Ads (estimativa de custo como % da venda)
  campanha:     true,
  taxaCampanha: 2.5,

  // Faixas combinadas: chave = `${tipoAnuncio}_${logistica}`
  // Full / Drop Off — sem taxa fixa (fixo: 0) em qualquer preço
  // Normal / Flex   — R$4 abaixo de R$79,99; sem taxa fixa acima
  faixas: {
    classico_full: [
      { max: Infinity, comissao: 11, fixo: 0, variavel: 0, label: 'Clássico 11% · Full' },
    ],
    classico_dropoff: [
      { max: Infinity, comissao: 11, fixo: 0, variavel: 0, label: 'Clássico 11% · Drop Off' },
    ],
    classico_normal: [
      { max: 79.98,    comissao: 11, fixo: 4, variavel: 0, label: 'Clássico 11% · Normal (abaixo R$79,99)' },
      { max: Infinity, comissao: 11, fixo: 0, variavel: 0, label: 'Clássico 11% · Normal' },
    ],
    classico_flex: [
      { max: 79.98,    comissao: 11, fixo: 4, variavel: 0, label: 'Clássico 11% · Flex (abaixo R$79,99)' },
      { max: Infinity, comissao: 11, fixo: 0, variavel: 0, label: 'Clássico 11% · Flex' },
    ],
    premium_full: [
      { max: Infinity, comissao: 19, fixo: 0, variavel: 0, label: 'Premium 19% · Full' },
    ],
    premium_dropoff: [
      { max: Infinity, comissao: 19, fixo: 0, variavel: 0, label: 'Premium 19% · Drop Off' },
    ],
    premium_normal: [
      { max: 79.98,    comissao: 19, fixo: 4, variavel: 0, label: 'Premium 19% · Normal (abaixo R$79,99)' },
      { max: Infinity, comissao: 19, fixo: 0, variavel: 0, label: 'Premium 19% · Normal' },
    ],
    premium_flex: [
      { max: 79.98,    comissao: 19, fixo: 4, variavel: 0, label: 'Premium 19% · Flex (abaixo R$79,99)' },
      { max: Infinity, comissao: 19, fixo: 0, variavel: 0, label: 'Premium 19% · Flex' },
    ],
  },
};
