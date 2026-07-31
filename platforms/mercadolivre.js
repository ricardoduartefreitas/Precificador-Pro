// platforms/mercadolivre.js — PrecificaPRO
// Fonte: vendedores.mercadolivre.com.br/nota/como-funcionam-as-taxas-do-mercado-livre
// Última verificação: 31/07/2026
//
// Comissões ML Brasil 2026 (variam por categoria):
//   Clássico: 10% a 14%  |  Premium: 15% a 19%
//   Padrão geral usado aqui: Clássico 11% | Premium 16%
//   Moda/Calçados pode chegar a 14%/19% — use aviso e valide na fonte.
//
// Taxa fixa (custo por unidade) — vigente desde 02/03/2026:
//   Full, Drop Off (Agência), Normal (ME1) → custo VARIÁVEL por peso/dimensão
//     → não há valor fixo tabelado; consultar simulador ML ou API /listing_prices
//   Flex → R$4 abaixo de R$79,98 | sem taxa fixa acima
//
// ⚠️ Comissões variam por categoria — valide em mercadolivre.com.br/tarifas

export default {
  id:    'mercadolivre',
  nome:  'Mercado Livre',
  sigla: 'ML',
  cor:        '#f59e0b',
  corFundo:   '#fff3c0',
  corTexto:   '#b45309',

  labelTipoVendedor: 'Tipo de anúncio',

  tiposVendedor: [
    { key: 'classico', label: 'Clássico (11% padrão)' },
    { key: 'premium',  label: 'Premium (16% padrão)'  },
  ],

  tiposLogistica: [
    { key: 'full',    label: 'Full (Fulfillment)' },
    { key: 'dropoff', label: 'Drop Off (Agência)'  },
    { key: 'normal',  label: 'Normal (ME1)'        },
    { key: 'flex',    label: 'Flex'                },
  ],

  campanha:     true,
  taxaCampanha: 2.5,

  // Faixas combinadas: chave = `${tipoAnuncio}_${logistica}`
  // Full / Drop Off / Normal → custo por unidade VARIÁVEL por peso (desde 02/03/2026)
  //   → fixo: 0 aqui; adicione manualmente no campo "Custos adicionais"
  // Flex → R$4 abaixo de R$79,98 | sem taxa fixa acima
  faixas: {
    classico_full: [
      { max: Infinity, comissao: 11, fixo: 0, variavel: 0, label: 'Clássico 11% · Full' },
    ],
    classico_dropoff: [
      { max: Infinity, comissao: 11, fixo: 0, variavel: 0, label: 'Clássico 11% · Drop Off' },
    ],
    classico_normal: [
      { max: Infinity, comissao: 11, fixo: 0, variavel: 0, label: 'Clássico 11% · Normal (ME1)' },
    ],
    classico_flex: [
      { max: 79.98,    comissao: 11, fixo: 4, variavel: 0, label: 'Clássico 11% · Flex (abaixo R$79,99)' },
      { max: Infinity, comissao: 11, fixo: 0, variavel: 0, label: 'Clássico 11% · Flex'                  },
    ],
    premium_full: [
      { max: Infinity, comissao: 16, fixo: 0, variavel: 0, label: 'Premium 16% · Full' },
    ],
    premium_dropoff: [
      { max: Infinity, comissao: 16, fixo: 0, variavel: 0, label: 'Premium 16% · Drop Off' },
    ],
    premium_normal: [
      { max: Infinity, comissao: 16, fixo: 0, variavel: 0, label: 'Premium 16% · Normal (ME1)' },
    ],
    premium_flex: [
      { max: 79.98,    comissao: 16, fixo: 4, variavel: 0, label: 'Premium 16% · Flex (abaixo R$79,99)' },
      { max: Infinity, comissao: 16, fixo: 0, variavel: 0, label: 'Premium 16% · Flex'                  },
    ],
  },
};
