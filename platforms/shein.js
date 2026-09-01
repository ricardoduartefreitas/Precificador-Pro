// platforms/shein.js — PrecificaPRO
// Fonte: seller-br.shein.com (atualizado 07/07/2026) — última verificação: 31/07/2026
//
// Taxas vigentes:
//   Categorias gerais:   18% (vigente desde 01/03/2026, antes era 16%)
//   Moda feminina:       20% (vigente desde 22/10/2025)
//
// Sem taxa fixa por item.
// Comissão calculada sobre preço final após descontos/cupons do vendedor.
// Portal BR: seller-br.shein.com (não seller.shein.com/br)

export default {
  id:    'shein',
  nome:  'Shein',
  sigla: 'SH',
  cor:        '#e91e8c',
  corFundo:   '#fce4ec',
  corTexto:   '#880e4f',

  labelTipoVendedor: 'Categoria do produto',

  tiposVendedor: [
    { key: 'geral',          label: 'Categorias gerais (18%)'   },
    { key: 'moda_feminina',  label: 'Moda feminina (20%)'       },
  ],

  campanha:    false,
  taxaCampanha: 0,

  aviso:     'Taxa de 18% (geral) ou 20% (moda feminina). Frete não é calculado automaticamente — inclua o valor estimado em "Custos adicionais". Novos vendedores têm 30 dias de comissão zero. Cadastro em seller-br.shein.com.',
  avisoTipo: 'warning',

  faixas: {
    geral: [
      { max: Infinity, comissao: 18, fixo: 0, variavel: 0, label: 'Taxa Shein (categorias gerais)' },
    ],
    moda_feminina: [
      { max: Infinity, comissao: 20, fixo: 0, variavel: 0, label: 'Taxa Shein (moda feminina)' },
    ],
  },

  // Frete não implementado — portal Shein inacessível para verificação
  // Incluir estimativa manual em "Custos adicionais"
  freteRegra: null,
};
