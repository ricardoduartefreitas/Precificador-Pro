# Troubleshooting: Botão "Calcular" não renderiza resultado

## Problema relatado
- Clique no botão "Calcular" → nenhuma mudança visível na página
- Formulário preenche corretamente ✓
- Tabela de regras renderiza ✓
- **Resultado NÃO renderiza ✗**
- Sem erros no console do browser

## Verificação Phase 1: Análise de código

### ✓ Elementos HTML existem
- `<div id="calc-result">` — linha 107 do index.html
- `<div id="calc-extrato">` — linha 110 do index.html

### ✓ Funções de renderização existem
- `renderResultHero()` — linha 635 do js/ui.js
- `renderExtrato()` — linha 678 do js/ui.js

### ✓ Motor funciona
- Smoke-test: 5/5 plataformas ✓
- test-handler-flow.js: fluxo funciona ✓

### ✓ Freemium não bloqueia
- localStorage vazio (contador 0)
- `canCalculate()` retorna true
- PRO_HASHES validado

## Investigação em progresso

### Hipóteses a validar com LOGS agora deployados

**LOG ESPERADO ao clicar "Calcular":**
```
[CALC] Handler iniciado
[CALC] Plataforma: Mercado Livre | isML: true
[CALC] calcInputs mapeado: OK
[CALC] Resultado calculado: 83.12
[CALC] Dados enriquecidos: faixa=Clássico 11% · Full
[CALC] Cálculo registrado no freemium
[CALC] Estado atualizado
[CALC] Chamando renderResultHero...
[RENDER] renderResultHero: elemento encontrado? true
[RENDER] renderResultHero: resultado válido? true
[RENDER] renderResultHero: removendo classe hidden
[RENDER] renderResultHero: classList agora = ["card", "result-hero"]
[CALC] renderResultHero completou
[CALC] Chamando renderExtrato...
[RENDER] renderExtrato: container encontrado? true
[RENDER] renderExtrato: table encontrado? true
[RENDER] renderExtrato: resultado válido? true
[RENDER] renderExtrato: removendo classe hidden
[RENDER] renderExtrato: classList agora = ["card", "extrato-card"]
[CALC] renderExtrato completou
[CALC] Element calc-actions encontrado? true
[CALC] Renderização concluída
```

## O que cada log revela

| Log | Significado se aparecer | Significado se NÃO aparecer |
|-----|----------|---------|
| `[CALC] Handler iniciado` | Handler foi chamado | Evento click não dispara ou addEventListener falhou |
| `[CALC] Plataforma:...` | Fluxo continua | Handler bloqueado em canCalculate() |
| `[CALC] calcInputs mapeado: OK` | Inputs válidos | Valores dos inputs inválidos/faltando |
| `[CALC] Resultado calculado:...` | Motor funciona | calcular() retornou null |
| `[RENDER] renderResultHero: elemento encontrado? true` | Elemento existe | Elemento não existe OU renderResultHero não foi chamado |
| `[RENDER] removendo classe hidden` | classList.remove() executado | Elemento encontrado mas está broken? |
| `[CALC] Renderização concluída` | Fluxo completou | Algo falhou no meio |

## Próximas ações

1. **Verificar console do browser** (precificador.ruahtecnologia.com.br)
2. **Procurar pelos logs** `[CALC]` e `[RENDER]`
3. **Identificar onde o fluxo para**
4. Baseado nos logs, corrigir o problema específico

## Causas possíveis (ordenadas por probabilidade)

### Causa 1: Service Worker servindo código antigo (50%)
- PWA cache pode estar servindo js/ui.js antigo
- **Solução**: Clear cache ou force refresh (Ctrl+Shift+R)

### Causa 2: Elemento não existe ou foi alterado (20%)
- HTML foi alterado após a mudança de código
- **Solução**: Verificar se elemento existe no HTML atual

### Causa 3: Handler não registrado (15%)
- addEventListener falhou por alguma razão
- **Solução**: Verificar se logs `[CALC]` aparecem

### Causa 4: Browser problema (10%)
- JavaScript desabilitado, conflito de extensão, etc.
- **Solução**: Testar em navegador diferente

### Causa 5: Lógica silenciosamente falhando (5%)
- Exceção capturada em algum lugar
- **Solução**: Verificar logs completos
