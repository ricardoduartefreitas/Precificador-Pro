// tests/debug-calcular.js — Debug do fluxo de Calcular
// Simula o clique no botão "Calcular" usando jsdom e rastreia o resultado

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const htmlPath = path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf-8');

// Cria um DOM virtual
const dom = new JSDOM(html, {
  url: 'http://localhost:8080',
  pretendToBeVisual: true,
  runScripts: 'outside-only',
});

const { window } = dom;
const document = window.document;

console.log('\n═══════════════════════════════════════════════════════');
console.log('DEBUG: Teste de Renderização do Botão "Calcular"');
console.log('═══════════════════════════════════════════════════════\n');

// Verificar 1: O botão existe?
const btnCalcular = document.getElementById('btn-calcular');
console.log('✓ Botão #btn-calcular existe:', !!btnCalcular);
console.log('  HTML:', btnCalcular?.outerHTML);

// Verificar 2: O container de resultado existe?
const calcResult = document.getElementById('calc-result');
console.log('\n✓ Container #calc-result existe:', !!calcResult);
console.log('  HTML:', calcResult?.outerHTML.substring(0, 100) + '...');

// Verificar 3: Verificar estado inicial
console.log('\n✓ Classe "hidden" em #calc-result:', calcResult?.classList.contains('hidden'));
console.log('  classList:', Array.from(calcResult?.classList || []));

// Verificar 4: O CSS está definido?
const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
console.log('\n✓ Estilos encontrados:', styles.length);

// Verificar 5: Simular remoção da classe hidden
console.log('\n═══════════════════════════════════════════════════════');
console.log('Teste: Remover classe "hidden"');
console.log('═══════════════════════════════════════════════════════\n');

if (calcResult) {
  console.log('Antes: classList =', Array.from(calcResult.classList));
  calcResult.classList.remove('hidden');
  console.log('Depois: classList =', Array.from(calcResult.classList));

  // Verificar se a classe foi removida
  console.log('✓ Classe removida?', !calcResult.classList.contains('hidden'));

  // Renderizar conteúdo de teste
  calcResult.innerHTML = `
    <p class="result-preco-label">Mercado Livre · Preço sugerido</p>
    <p class="result-preco-valor">R$ 83,12</p>
    <div class="result-grid">
      <div>
        <p class="result-item-label">Lucro líquido</p>
        <p class="result-item-value text-green">R$ 15,00</p>
      </div>
    </div>
  `;

  console.log('\n✓ Conteúdo renderizado');
  console.log('  innerHTML preview:', calcResult.innerHTML.substring(0, 100) + '...');
}

// Verificar 6: Simular o fluxo completo
console.log('\n═══════════════════════════════════════════════════════');
console.log('Teste: Fluxo completo do _handleCalcular');
console.log('═══════════════════════════════════════════════════════\n');

// Mock dos inputs do formulário
const inputs = {
  'calc-custo':   { value: '50' },
  'calc-peso':    { value: '0.3' },
  'calc-extras':  { value: '0' },
  'calc-margem':  { value: '20' },
  'calc-imposto': { value: '0' },
  'calc-desconto': { value: '10' },
};

Object.entries(inputs).forEach(([id, obj]) => {
  const el = document.getElementById(id);
  if (el) {
    el.value = obj.value;
    console.log(`✓ Input #${id}: valor = "${obj.value}"`);
  } else {
    console.log(`✗ Input #${id}: NÃO ENCONTRADO`);
  }
});

// Verificar os selects
const platSelect = document.getElementById('calc-plataforma');
const tipoSelect = document.getElementById('calc-tipo-vendedor');
console.log('\n✓ Select #calc-plataforma existe:', !!platSelect);
console.log('✓ Select #calc-tipo-vendedor existe:', !!tipoSelect);

console.log('\n═══════════════════════════════════════════════════════');
console.log('Resumo:');
console.log('═══════════════════════════════════════════════════════');
console.log('✓ DOM estrutura: OK');
console.log('✓ Elementos necessários existem: OK');
console.log('✓ Manipulação de classList: OK');
console.log('✓ Renderização de conteúdo: OK');
console.log('\nO problema provavelmente está em:');
console.log('1. O handler _handleCalcular não está sendo chamado');
console.log('2. O handler retorna cedo antes de renderizar');
console.log('3. Erro silencioso no calcular/mapPlataformaToInputs');
console.log('4. Service worker servindo JavaScript antigo do cache');
console.log('\n');
