// Reproduzir o cenário do usuário TikTok
const precoVendaFinal = 23.31;
const precoSemImposto = 20.51;

console.log('=== CENÁRIO DO USUÁRIO (TikTok) ===');
console.log('Preço final (GMV): R$', precoVendaFinal.toFixed(2));
console.log('Preço SEM imposto (÷1.12): R$', (precoVendaFinal / 1.12).toFixed(2));
console.log('Preço usado para frete: R$', precoSemImposto.toFixed(2));
console.log('');

// Cálculo esperado (correto)
const freteCorreto = precoVendaFinal * 0.06;
console.log('✓ Frete CORRETO (6% de R$23,31): R$', freteCorreto.toFixed(2));

// Cálculo errado (com preço sem imposto)
const freteErrado = precoSemImposto * 0.06;
console.log('✗ Frete ERRADO (6% de R$20,51): R$', freteErrado.toFixed(2));

console.log('');
console.log('Diferença de frete: R$', (freteCorreto - freteErrado).toFixed(2));
