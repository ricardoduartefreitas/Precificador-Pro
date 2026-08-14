// Testa o fluxo que _handleCalcular deveria fazer
import { calcular, mapPlataformaToInputs } from '../js/calculator.js';
import { default as ml } from '../platforms/mercadolivre.js';

const plataformas = [ml];

// Simula os inputs que o usuário digitou no formulário
const formData = {
  custo: 50,
  peso: 0.3,
  extras: 0,
  margem: 20,
  imposto: 0,
};

console.log('═══════════════════════════════════════════════════════');
console.log('TESTE: Fluxo _handleCalcular com dados do usuário');
console.log('═══════════════════════════════════════════════════════\n');

console.log('1. Dados do formulário:');
console.log('   custo:', formData.custo);
console.log('   peso:', formData.peso);
console.log('   extras:', formData.extras);
console.log('   margem:', formData.margem);
console.log('   imposto:', formData.imposto);

const base = {
  custoProduto:     formData.custo,
  pesoKg:           formData.peso,
  custosAdicionais: formData.extras,
  margemLucro:      formData.margem,
  imposto:          formData.imposto,
};

console.log('\n2. Base inputs para calcular:');
console.log(JSON.stringify(base, null, 2));

const plat = ml;
const isML = true;
const tipoAnuncio = 'classico';
const logistica = 'full';
const tipoVend = tipoAnuncio + '_' + logistica;
const campanha = false;

console.log('\n3. Tipo de vendedor (ML):');
console.log('   tipoAnuncio:', tipoAnuncio);
console.log('   logistica:', logistica);
console.log('   tipoVend:', tipoVend);
console.log('   campanha:', campanha);

console.log('\n4. Mapeando para calcInputs...');
const calcInputs = mapPlataformaToInputs(base, plat, tipoVend, campanha);

if (!calcInputs) {
  console.log('   ERROR: mapPlataformaToInputs retornou null!');
  process.exit(1);
}

console.log('   OK: mapPlataformaToInputs retornou:');
console.log(JSON.stringify(calcInputs, null, 2));

console.log('\n5. Calculando resultado...');
const resultado = calcular(calcInputs);

if (!resultado) {
  console.log('   ERROR: calcular retornou null!');
  process.exit(1);
}

console.log('   OK: calcular retornou:');
console.log('   precoVenda:', resultado.precoVenda);
console.log('   lucroLiquido:', resultado.lucroLiquido);
console.log('   lucroPercentual:', resultado.lucroPercentual);

console.log('\n6. Dados que seriam renderizados:');
console.log('   _faixa:', calcInputs._faixaLabel);
console.log('   _platNome:', plat.nome);
console.log('   _platCor:', plat.cor);
console.log('   _platId:', plat.id);

console.log('\n═══════════════════════════════════════════════════════');
console.log('OK: TESTE PASSOU - Fluxo funciona corretamente');
console.log('═══════════════════════════════════════════════════════\n');
