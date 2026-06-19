// platforms/tiktok.js — PrecificaPRO
// Responsabilidade: tabela de taxas do TikTok Shop Brasil
// Fonte: https://seller-br.tiktok.com/university/essay
// ⚠️  ATENÇÃO: TikTok Shop BR tem taxas em período promocional — validar no Seller Center
// Atualizado: Jun/2026 — verificar mensalmente (plataforma em expansão no BR)

export default {
  id:    'tiktok',
  nome:  'TikTok Shop',
  sigla: 'TT',
  cor:        '#00f2ea',
  corFundo:   '#e0fffe',
  corTexto:   '#00796b',

  // TikTok Shop não diferencia tipo de vendedor no BR atualmente
  tiposVendedor: null,

  campanha:    true,
  taxaCampanha: 2.0,

  // ⚠️  Taxa promocional vigente no lançamento do TikTok Shop BR
  // Plataforma em fase de incentivo — pode ter taxa 0% ou reduzida temporariamente
  faixas: {
    padrao: [
      { max: Infinity, comissao: 5, fixo: 0, variavel: 0, label: 'Taxa padrão TikTok Shop' },
    ],
  },
};
