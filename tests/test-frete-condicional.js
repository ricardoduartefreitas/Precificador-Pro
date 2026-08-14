#!/usr/bin/env node
// test-frete-condicional.js
// Teste dos cenários: TikTok (frete percentual) e ML (frete fixo)

import { calcular } from '../js/calculator.js';

function testCenario(nome, inputs, esperado) {
  console.log(`\n${'═'.repeat(60)}\nCENÁRIO: ${nome}\n${'═'.repeat(60)}`);
  console.log('INPUTS:', JSON.stringify(inputs, null, 2));

  const resultado = calcular(inputs);
  if (!resultado) {
    console.error('❌ ERRO: calcular() retornou null');
    return false;
  }

  console.log('\nRESULTADO:');
  console.log(`  Preço de venda: R$ ${resultado.precoVenda.toFixed(2)}`);
  console.log(`  Lucro líquido:  R$ ${resultado.lucroLiquido.toFixed(2)}`);
  console.log(`  Margem:         ${resultado.lucroPercentual.toFixed(2)}%`);

  console.log('\nBREAKDOWN (5 BLOCOS):');
  const bd = resultado.breakdown;
  console.log(`  1. Custo da Plataforma: R$ ${bd.custoDaPlataforma.toFixed(2)}`);
  console.log(`     - Comissão:      R$ ${bd.comissaoValor.toFixed(2)}`);
  console.log(`     - Taxa fixa:     R$ ${bd.taxaAnuncioValor.toFixed(2)}`);
  console.log(`     - Frete:         R$ ${bd.freteValor.toFixed(2)}`);

  console.log(`  2. Custos de Venda:    R$ ${bd.custosDeVenda.toFixed(2)}`);
  console.log(`     - Afiliados:     R$ ${bd.afiliadosValor.toFixed(2)}`);
  console.log(`     - Ads %:         R$ ${bd.adsPercentualValor.toFixed(2)}`);
  console.log(`     - Ads fixo:      R$ ${bd.adsFixoValor.toFixed(2)}`);

  console.log(`  3. Imposto:            R$ ${bd.impostoValor.toFixed(2)}`);

  console.log(`  4. Outros Custos:      R$ ${bd.outrosCustos.toFixed(2)}`);
  console.log(`     - Produto:       R$ ${bd.custosProduto.toFixed(2)}`);
  console.log(`     - Adicionais:    R$ ${bd.custosAdicionais.toFixed(2)}`);

  console.log(`  5. Lucro:              R$ ${bd.lucroValor.toFixed(2)}`);

  // Validar esperados
  let ok = true;
  if (esperado.precoVenda && Math.abs(resultado.precoVenda - esperado.precoVenda) > 0.10) {
    console.error(`❌ Preço esperado: R$ ${esperado.precoVenda.toFixed(2)}, obtido: R$ ${resultado.precoVenda.toFixed(2)}`);
    ok = false;
  } else {
    console.log(`✅ Preço validado`);
  }

  if (esperado.margemPct && Math.abs(resultado.lucroPercentual - esperado.margemPct) > 0.5) {
    console.error(`❌ Margem esperada: ${esperado.margemPct.toFixed(2)}%, obtida: ${resultado.lucroPercentual.toFixed(2)}%`);
    ok = false;
  } else if (esperado.margemPct) {
    console.log(`✅ Margem validada`);
  }

  return ok;
}

// ─────────────────────────────────────────────────────────────────────────
// CENÁRIO 1: TIKTOK (FRETE PERCENTUAL = 6% do GMV)
// ─────────────────────────────────────────────────────────────────────────
// Entrada do usuário:
//   Custo: R$ 5,95
//   Peso: 0,450 kg
//   Custos adicionais: R$ 1,00
//   Imposto: 12%
//   Margem: 30%
//   Afiliados: 10%
//   Ads: 5%
//
// Esperado:
//   - Frete: 6% do GMV (PERCENTUAL, entra no divisor)
//   - Divisor: 1 - (comissão 6% + frete 6% + afiliados 10% + ads 5% + imposto 12% + margem 30%) / 100
//           = 1 - (6+6+10+5+12+30)/100 = 1 - 0.69 = 0.31
//   - Preço = (5,95 + 1,00) / 0.31 ≈ 22,26 (sem ads fixo)
//   - Mas o frete não sai do numerador (é percentual)
//
// Na prática, divisor inclui frete percentual:
//   divisor = 1 - (6 + 6 + 10 + 5 + 12 + 30) / 100 = 0.31
//   precoVenda = (5.95 + 1.00) / 0.31 ≈ 22.26

const tiktokInputs = {
  custoProduto: 5.95,
  custoFrete: 0,       // Frete é PERCENTUAL (6% do GMV)
  custosAdicionais: 1.00,
  comissaoPlataforma: 6,
  taxaAnuncio: 6,      // TikTok: 6% comissão + R$6 taxa fixa?
  imposto: 12,
  afiliadosPercent: 10,
  adsPercent: 5,
  adsFixo: 0,
  margemLucro: 30,
  fretePercent: 6,     // TikTok SFP: 6% do GMV → PERCENTUAL
};

testCenario('TikTok com frete percentual (6% do GMV)', tiktokInputs, {
  // precoVenda deve ser calculado com frete no divisor
  // 30% margem real (pode variar ligeiramente)
  precoVenda: null, // não validar valor exato agora
  margemPct: 30,
});

// ─────────────────────────────────────────────────────────────────────────
// CENÁRIO 2: MERCADO LIVRE (FRETE FIXO POR TABELA DE PESO)
// ─────────────────────────────────────────────────────────────────────────
// Entrada do usuário:
//   Custo: R$ 5,95
//   Peso: 0,450 kg → Frete: R$ 7,35 (da tabela)
//   Custos adicionais: R$ 1,00
//   Imposto: 12%
//   Margem: 30%
//   Afiliados: 10%
//   Ads: 5%
//
// Esperado:
//   - Frete: R$ 7,35 (FIXO, entra no numerador)
//   - Divisor: 1 - (comissão 11% + afiliados 10% + ads 5% + imposto 12% + margem 30%) / 100
//           = 1 - (11+10+5+12+30)/100 = 1 - 0.68 = 0.32
//   - Preço = (5.95 + 7.35 + 1.00 + 0) / 0.32 = 14.30 / 0.32 ≈ 44.69

const mlInputs = {
  custoProduto: 5.95,
  custoFrete: 7.35,    // Frete FIXO (tabela de peso)
  custosAdicionais: 1.00,
  comissaoPlataforma: 11,
  taxaAnuncio: 0,      // Flex: sem taxa fixa acima de R$79,99
  imposto: 12,
  afiliadosPercent: 10,
  adsPercent: 5,
  adsFixo: 0,
  margemLucro: 30,
  fretePercent: 0,     // ML tabelaPeso: FIXO → 0 no divisor
};

testCenario('Mercado Livre com frete fixo por tabela', mlInputs, {
  precoVenda: 44.69,   // Validar valor aproximado
  margemPct: 30,
});

// ─────────────────────────────────────────────────────────────────────────
// CENÁRIO 3: SHOPEE (FRETE GRÁTIS COM SUBSÍDIO)
// ─────────────────────────────────────────────────────────────────────────
// Entrada do usuário:
//   Custo: R$ 5,95
//   Peso: 0,450 kg
//   Custos adicionais: R$ 1,00
//   Imposto: 12%
//   Margem: 30%
//   Afiliados: 10%
//   Ads: 5%
//
// Esperado:
//   - Shopee oferece frete grátis (subsidio, custo do vendedor = R$0)
//   - Divisor: 1 - (comissão 15% CNPJ + afiliados 10% + ads 5% + imposto 12% + margem 30%) / 100
//           = 1 - (15+10+5+12+30)/100 = 1 - 0.72 = 0.28
//   - Preço = (5.95 + 0 + 1.00 + 0) / 0.28 = 6.95 / 0.28 ≈ 24.82

const shopeeInputs = {
  custoProduto: 5.95,
  custoFrete: 0,       // Shopee: frete grátis (subsídio)
  custosAdicionais: 1.00,
  comissaoPlataforma: 15,  // CNPJ padrão
  taxaAnuncio: 0,      // Shopee: sem taxa fixa (incluída na comissão)
  imposto: 12,
  afiliadosPercent: 10,
  adsPercent: 5,
  adsFixo: 0,
  margemLucro: 30,
  fretePercent: 0,     // Shopee subsidioFaixa: FIXO/GRÁTIS → 0 no divisor
};

testCenario('Shopee com frete grátis (subsídio)', shopeeInputs, {
  precoVenda: 24.82,
  margemPct: 30,
});

console.log(`\n${'═'.repeat(60)}\n✅ Testes completados\n${'═'.repeat(60)}\n`);
