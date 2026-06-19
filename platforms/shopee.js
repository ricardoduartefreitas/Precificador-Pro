// platforms/shopee.js — PrecificaPRO
// Fonte: seller.shopee.com.br/edu/article/26839 (atualizado 04-02-2026)
// Vigente desde 01/03/2026 — validar trimestralmente
//
// CNPJ: comissão % variável por faixa de preço do item
// CPF iniciante (<450 pedidos/90d): taxa FIXA em R$ por faixa (sem % de comissão)
// CPF experiente (>450 pedidos/90d): mesma % do CNPJ + R$3 adicional por item
// ⚠️ Taxa de transação já está incluída na comissão (não cobrada separadamente)

export default {
  id:    'shopee',
  nome:  'Shopee',
  sigla: 'SP',
  cor:        '#ee4d2d',
  corFundo:   '#fff0ed',
  corTexto:   '#c0392b',

  labelTipoVendedor: 'Tipo de vendedor',

  tiposVendedor: [
    { key: 'cnpj',           label: 'CNPJ'              },
    { key: 'cpf_iniciante',  label: 'CPF (iniciante)'   },
    { key: 'cpf_experiente', label: 'CPF (experiente)'  },
  ],

  campanha:     true,
  taxaCampanha: 2.0,

  aviso:     '⚠️ Tabela por faixa vigente desde 01/03/2026. Valide em seller.shopee.com.br',
  avisoTipo: 'warning',

  faixas: {
    // CNPJ — comissão % por faixa de preço de venda
    cnpj: [
      { max: 29.99,    comissao: 16, fixo: 0, variavel: 0, label: 'até R$29,99'      },
      { max: 79.99,    comissao: 15, fixo: 0, variavel: 0, label: 'R$30–R$79,99'     },
      { max: 199.99,   comissao: 13, fixo: 0, variavel: 0, label: 'R$80–R$199,99'    },
      { max: Infinity, comissao: 12, fixo: 0, variavel: 0, label: 'acima de R$200'   },
    ],

    // CPF iniciante — taxa FIXA por item em R$ (comissao: 0 = sem percentual)
    cpf_iniciante: [
      { max: 29.99,    comissao: 0, fixo: 4,  variavel: 0, label: 'até R$29,99'    },
      { max: 79.99,    comissao: 0, fixo: 16, variavel: 0, label: 'R$30–R$79,99'   },
      { max: 199.99,   comissao: 0, fixo: 20, variavel: 0, label: 'R$80–R$199,99'  },
      { max: Infinity, comissao: 0, fixo: 26, variavel: 0, label: 'acima de R$200' },
    ],

    // CPF experiente — mesma % do CNPJ + R$3 fixo por item
    cpf_experiente: [
      { max: 29.99,    comissao: 16, fixo: 3, variavel: 0, label: 'até R$29,99 (16% + R$3)'   },
      { max: 79.99,    comissao: 15, fixo: 3, variavel: 0, label: 'R$30–R$79,99 (15% + R$3)'  },
      { max: 199.99,   comissao: 13, fixo: 3, variavel: 0, label: 'R$80–R$199,99 (13% + R$3)' },
      { max: Infinity, comissao: 12, fixo: 3, variavel: 0, label: 'acima de R$200 (12% + R$3)' },
    ],
  },
};
