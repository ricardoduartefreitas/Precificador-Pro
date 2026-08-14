// platforms/amazon.js — PrecificaPRO
// Fonte: venda.amazon.com.br/precos + sellercentral.amazon.com.br
// Última verificação: 31/07/2026 (tabela oficial atualizada em 21/07/2026)
//
// Taxas de referência por categoria (percentual sobre o preço de venda):
//   Eletrônicos/Celulares: 11–13%  |  Acessórios eletrônicos: 15% (primeiros R$100) + 10% excedente
//   Moda, Calçados, Beleza: 13–14% |  Casa, Cozinha: 12%  |  Móveis: 15% (até R$200) + 10%
//   Taxa mínima: R$1,00 (R$2,00 em Bebês, Pets, Cozinha, Jardim, Brinquedos)
//
// FBA (Fulfillment by Amazon) — custo por unidade:
//   Varia por peso faturável (maior entre peso real e peso dimensional C×L×A/6000)
//   Estimativa para produto médio (~1kg, 30×20×10cm, preço ~R$80): ≈ R$13/unidade
//   ⚠️ Use o simulador da Amazon para seu produto específico.
//
// Plano Individual: R$2,00/item vendido (sem mensalidade)
// Plano Profissional: gratuito nos primeiros 12 meses, R$19/mês a partir do 13º

export default {
  id:    'amazon',
  nome:  'Amazon',
  sigla: 'AMZ',
  cor:        '#ff9900',
  corFundo:   '#fff8e1',
  corTexto:   '#e65100',

  labelTipoVendedor: 'Modalidade de envio',

  tiposVendedor: [
    { key: 'fba', label: 'FBA (Amazon entrega)' },
    { key: 'fbm', label: 'FBM (Eu entrego)'     },
  ],

  campanha:    false,
  taxaCampanha: 0,

  aviso:     '⚠️ Comissão varia por categoria (11–15%). FBA: custo por unidade varia por peso e dimensão — use o simulador em sellercentral.amazon.com.br e inclua o valor de fulfillment em "Custos adicionais".',
  avisoTipo: 'warning',

  faixas: {
    // FBA: 15% comissão (referência geral) + R$13 estimativa de fulfillment para produto médio
    fba: [
      { max: Infinity, comissao: 15, fixo: 13, variavel: 0, label: 'FBA — estimativa produto médio (~1kg)' },
    ],
    // FBM: 15% comissão (referência geral), sem taxa fixa
    fbm: [
      { max: Infinity, comissao: 15, fixo: 0, variavel: 0, label: 'FBM — sem taxa de fulfillment' },
    ],
  },

  // Frete não implementado — Amazon FBA tem fulfillment fixo na taxa acima
  // Amazon FBM: frete depende do sistema logístico escolhido (não tabelado)
  freteRegra: null,
};
