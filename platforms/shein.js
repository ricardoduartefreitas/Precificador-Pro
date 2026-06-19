// platforms/shein.js — PrecificaPRO
// Responsabilidade: tabela de taxas da Shein (Marketplace terceiros Brasil)
// Fonte: https://seller.shein.com/br
// ⚠️  ATENÇÃO: Shein marketplace para terceiros é recente no BR — validar na plataforma
// Atualizado: Jun/2026 — verificar trimestralmente

export default {
  id:    'shein',
  nome:  'Shein',
  sigla: 'SH',
  cor:        '#e91e8c',
  corFundo:   '#fce4ec',
  corTexto:   '#880e4f',

  // Shein não diferencia tipo de vendedor no modelo marketplace BR
  tiposVendedor: null,

  campanha:    false,
  taxaCampanha: 0,

  aviso:     '⚠️ Taxa estimada. Portal do seller não está disponível publicamente. Contate o suporte Shein Marketplace BR.',
  avisoTipo: 'error',

  // ⚠️  Taxas estimadas — Shein marketplace BR tem modelo por categoria
  // Comissão varia de 10% a 20% dependendo da categoria
  // Validar no painel de seller antes de usar em produção
  faixas: {
    padrao: [
      { max: Infinity, comissao: 15, fixo: 0, variavel: 0, label: 'Taxa padrão Shein' },
    ],
  },
};
