// platforms/shopee.js — PrecificaPRO
// Fonte: seller.br.shopee.cn/edu/article/26839 (atualizado 21/07/2026)
// Vigente desde 01/03/2026 — última verificação: 31/07/2026
//
// CNPJ e CPF iniciante (<450 pedidos/90d): mesma tabela — % + taxa fixa por faixa
// CPF experiente (>450 pedidos/90d): mesmos % + R$3 adicional por item em cada faixa
//
// Faixas vigentes desde 01/03/2026:
//   R$0–7,99    → 50% + R$0
//   R$8–79,99   → 20% + R$4
//   R$80–99,99  → 14% + R$16
//   R$100–199,99 → 14% + R$20
//   R$200+      → 14% + R$26
//
// ⚠️ Não há variação por categoria na tabela-base; varia por preço do item.

export default {
  id:    'shopee',
  nome:  'Shopee',
  sigla: 'SP',
  cor:        '#ee4d2d',
  corFundo:   '#fff0ed',
  corTexto:   '#c0392b',

  labelTipoVendedor: 'Tipo de vendedor',

  tiposVendedor: [
    { key: 'cnpj',           label: 'CNPJ / CPF Iniciante (<450 pedidos/90d)' },
    { key: 'cpf_experiente', label: 'CPF Experiente (>450 pedidos/90d)'       },
  ],

  campanha:     true,
  taxaCampanha: 2.0,

  aviso:     '⚠️ Tabela vigente desde 01/03/2026. Produtos abaixo de R$7,99 têm 50% de comissão. Valide em seller.shopee.com.br',
  avisoTipo: 'warning',

  faixas: {
    // CNPJ e CPF iniciante (<450 pedidos/90d) — mesma tabela
    cnpj: [
      { max: 7.99,     comissao: 50, fixo: 0,  variavel: 0, label: 'até R$7,99 (50%)'          },
      { max: 79.99,    comissao: 20, fixo: 4,  variavel: 0, label: 'R$8–R$79,99 (20% + R$4)'   },
      { max: 99.99,    comissao: 14, fixo: 16, variavel: 0, label: 'R$80–R$99,99 (14% + R$16)' },
      { max: 199.99,   comissao: 14, fixo: 20, variavel: 0, label: 'R$100–R$199,99 (14% + R$20)' },
      { max: Infinity, comissao: 14, fixo: 26, variavel: 0, label: 'acima de R$200 (14% + R$26)' },
    ],

    // CPF experiente (>450 pedidos/90d) — mesmos % + R$3 adicional por item
    cpf_experiente: [
      { max: 7.99,     comissao: 50, fixo: 3,  variavel: 0, label: 'até R$7,99 (50% + R$3)'          },
      { max: 79.99,    comissao: 20, fixo: 7,  variavel: 0, label: 'R$8–R$79,99 (20% + R$7)'         },
      { max: 99.99,    comissao: 14, fixo: 19, variavel: 0, label: 'R$80–R$99,99 (14% + R$19)'       },
      { max: 199.99,   comissao: 14, fixo: 23, variavel: 0, label: 'R$100–R$199,99 (14% + R$23)'     },
      { max: Infinity, comissao: 14, fixo: 29, variavel: 0, label: 'acima de R$200 (14% + R$29)'     },
    ],
  },

  // Frete automático com subsídio Shopee (vigente desde 01/03/2026)
  // Frete grátis obrigatório — subsídio da plataforma cobre até: R$20 / R$30 / R$40
  // Custo do vendedor = max(0, freteReal - subsídio); default freteReal = subsídio (custo 0)
  freteRegra: {
    tipo: 'subsidioFaixa',
    faixas: [
      { max: 79.99,    subsidio: 20 },
      { max: 199.99,   subsidio: 30 },
      { max: Infinity, subsidio: 40 },
    ],
  },
};
