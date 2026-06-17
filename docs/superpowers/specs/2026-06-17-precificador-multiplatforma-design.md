# Design: Precificador Multi-Plataforma PRO 2026

## Contexto

Reescrita completa do `precificador-marketplace-2026`, expandindo de uma ferramenta focada exclusivamente em Shopee para um precificador que cobre as 5 maiores plataformas de marketplace do Brasil: Mercado Livre, Shopee, Amazon, TikTok Shop e Shein. O sistema mantém o modelo freemium (30 cálculos gratuitos + desbloqueio PRO via senha).

---

## Decisões de produto

| Decisão | Escolha |
|---|---|
| Modos de uso | Comparação entre plataformas + Calculadora individual |
| Modelo de negócio | Freemium: 30 cálculos gratuitos (todas as plataformas) → PRO desbloqueia ilimitados + histórico + CSV |
| Histórico | Salvo localmente + exportação CSV |
| Stack técnica | Vanilla JS modular (reescrita do zero) |
| Arquitetura | SPA com hash routing |
| Visual | Dark Pro (fundo escuro, acentos verde/vermelho/azul) |

---

## Arquitetura

### Estrutura de arquivos

```
precificador-marketplace/
├── index.html              ← entrada única da SPA
├── style.css               ← tema dark + todos os componentes
├── manifest.json           ← PWA instalável
├── sw.js                   ← service worker (cache offline)
│
├── js/
│   ├── router.js           ← hash routing (#/comparar, #/calcular/:platform, #/historico)
│   ├── state.js            ← estado global (inputs, resultados, modo PRO)
│   ├── engine.js           ← lógica de cálculo (agnóstica de plataforma)
│   ├── auth.js             ← freemium: contador localStorage + validação SHA-256
│   ├── history.js          ← CRUD histórico localStorage + exportação CSV
│   └── ui.js               ← renderização das 3 views
│
└── platforms/
    ├── mercadolivre.js     ← tabela de taxas ML
    ├── shopee.js           ← tabela de taxas Shopee
    ├── amazon.js           ← tabela de taxas Amazon
    ├── tiktok.js           ← tabela de taxas TikTok Shop
    └── shein.js            ← tabela de taxas Shein
```

### Princípios

- `engine.js` é agnóstico de plataforma — recebe a estrutura de taxas como parâmetro e devolve o resultado. Isso permite testar o cálculo isoladamente.
- `platforms/*.js` são arquivos de dados puros (objetos JS). Atualizar taxas quando uma plataforma muda = editar um número em um arquivo.
- `state.js` preserva os inputs ao trocar de aba — o vendedor não redigita ao alternar entre Comparar e Calcular.
- `router.js` usa `window.location.hash` — sem dependência de servidor para roteamento, compatível com PWA.

---

## Rotas

| Hash | Tela |
|---|---|
| `#/comparar` | Modo comparação (padrão ao abrir) |
| `#/calcular/:platform` | Calculadora individual (ex: `#/calcular/shopee`) |
| `#/historico` | Histórico e exportação |

---

## Telas

### 1. Comparar (`#/comparar`)

**Inputs:**
- Custo do produto (R$)
- Outros custos — embalagem, etiquetas (R$)
- Frete (R$)
- Lucro desejado (slider 0–200%)

**Saída — Winner Hero:**
Card de destaque para a plataforma com maior lucro líquido. Exibe: nome da plataforma, preço sugerido (grande), lucro líquido, margem real, % que a plataforma leva. Botão "Ver extrato completo" expande o breakdown linha a linha.

**Saída — Ranking:**
Cards para as demais plataformas, ordenados por lucro líquido decrescente. Cada card exibe: posição, ícone colorido da plataforma, preço sugerido, barra de progresso visual (cor da plataforma), lucro líquido e % de taxa.

**Lock PRO:**
Todas as 5 plataformas disponíveis no plano gratuito. Ao atingir 30 cálculos, exibe overlay de upgrade — sem restringir plataformas antes disso.

---

### 2. Calcular (`#/calcular/:platform`)

**Seletor de plataforma:**
Carrossel horizontal com botões para cada plataforma (ML, Shopee, Amazon, TikTok, Shein). Cada botão usa a cor oficial da plataforma quando ativo.

**Tipo de vendedor** (quando aplicável):
Segmented control — ex: para Shopee/ML: CNPJ / CPF < 450 / CPF > 450. Para Amazon: FBA / FBM. Para TikTok e Shein: não se aplica (tipo único).

**Inputs:** mesmos do modo Comparar + toggle de campanha promocional (+2,5% de taxa, específico por plataforma).

**Result Hero:**
Preço sugerido grande (36px), preço mínimo, lucro líquido em verde, margem real, total descontado, % que a plataforma leva. Faixa de taxa aplicada visível.

**Extrato detalhado:**
Tabela com cada dedução linha a linha: valor da venda → (−) custo produto → (−) outros custos → (−) frete → (−) comissão → (−) taxas fixas → total de taxas → lucro líquido.

**Ações:** Botão "Salvar no histórico" (abre modal para nomear o produto) + Botão "Limpar".

---

### 3. Histórico (`#/historico`)

**Toolbar:** campo de busca por nome de produto + botão "⬇ CSV" (exporta todos os registros filtrados).

**Stats bar:** total de cálculos salvos, maior lucro registrado, média de margem.

**Filtros:** chips por plataforma (Todos / ML / Shopee / Amazon / TikTok / Shein / Comparações).

**Lista agrupada por data** (Hoje / Ontem / Esta semana / Anteriores):
- Cards de cálculo individual: ícone da plataforma, nome do produto, preço sugerido, lucro, barra de progresso colorida, margem e hora.
- Cards de comparação: borda azul, tag "Comparação · N plataformas", mini-lista com todas as plataformas calculadas, vencedor destacado em verde.

**Ação destrutiva:** Botão "Limpar histórico" com confirmação antes de apagar.

---

## Motor de cálculo (`engine.js`)

```
entradas:
  custo          → custo do produto
  extras         → outros custos (embalagem, etc.)
  frete          → custo de frete
  margem         → lucro desejado em %
  campanha       → boolean (adiciona taxa extra)
  taxas          → objeto da plataforma { comissao%, fixo, variavel%, campanha% }

saída:
  precoSugerido  → preço de venda recomendado
  precoMinimo    → break-even (custo total + taxas, sem lucro)
  lucroLiquido   → lucro real após todas as deduções
  margemReal     → lucro / preço em %
  totalTaxas     → soma de todas as deduções da plataforma
  pctPlataforma  → % que a plataforma leva do preço
  extrato        → objeto com cada dedução separada
  faixa          → label da faixa de preço aplicada
```

**Algoritmo:**
1. Calcular custo total = custo + extras + frete
2. Estimar preço inicial = (custo_total + lucro_desejado + taxas_fixas) / (1 − taxas_percentuais)
3. Verificar se o preço estimado muda a faixa de taxa → se sim, recalcular com a nova faixa (uma iteração resolve 99% dos casos)
4. Calcular extrato linha a linha com o preço final

---

## Estrutura de dados de plataforma

Cada arquivo `platforms/*.js` exporta um objeto com esta forma:

```js
export default {
  id: 'mercadolivre',
  nome: 'Mercado Livre',
  cor: '#f59e0b',
  corFundo: '#fff3c0',
  corTexto: '#b45309',
  sigla: 'ML',
  tiposVendedor: ['cnpj', 'cpf_menor', 'cpf_maior'], // null se não se aplica
  campanha: true, // suporta taxa de campanha
  faixas: {
    cnpj: [
      { max: 79.99,    comissao: 20, fixo: 4,  variavel: 0, label: 'até R$79,99' },
      { max: 199.99,   comissao: 14, fixo: 16, variavel: 0, label: 'R$80 a R$199,99' },
      { max: 499.99,   comissao: 14, fixo: 26, variavel: 0, label: 'R$200 a R$499,99' },
      { max: Infinity, comissao: 14, fixo: 26, variavel: 0, label: 'acima de R$500' },
    ],
    // cpf_menor, cpf_maior seguem a mesma estrutura
  }
}
```

> **Nota:** As taxas de Amazon, TikTok Shop e Shein precisam ser verificadas nas páginas oficiais de cada plataforma antes da implementação. Os valores devem ser validados com fontes primárias (central de vendedores / seller central de cada marketplace).

---

## Sistema freemium (`auth.js`)

**Free:**
- Acesso completo a todas as 5 plataformas
- Limite de 30 cálculos (contador em `localStorage`, chave `_psp_u`)
- Aviso a partir do 25º cálculo
- Histórico e exportação CSV desabilitados — botão "Salvar" visível mas travado com prompt de upgrade

**PRO:**
- Cálculos ilimitados
- Histórico completo com busca, filtros e agrupamento por data
- Exportação CSV
- Desbloqueio via senha → SHA-256 contra lista de hashes em `config.js`
- Status salvo em `localStorage` (`_psp_h`)

**Fluxo de upgrade:**
Ao atingir 30 cálculos → overlay de bloqueio com benefícios do PRO + campo de senha. Ao tentar salvar no histórico (plano free) → bottom sheet de upgrade (não bloqueia o cálculo em si).

---

## Histórico (`history.js`)

**Schema de um registro:**
```js
{
  id: 'uuid-v4',
  tipo: 'individual' | 'comparacao',
  produto: 'Nome do produto',         // digitado pelo usuário ao salvar
  data: 1718600000000,                // timestamp ms
  // para individual:
  plataforma: 'shopee',
  tipoVendedor: 'cnpj',
  inputs: { custo, extras, frete, margem, campanha },
  resultado: { precoSugerido, lucroLiquido, margemReal, totalTaxas, pctPlataforma },
  // para comparacao (substitui plataforma/tipoVendedor/resultado):
  resultados: [ { plataforma, precoSugerido, lucroLiquido, margemReal, pctPlataforma }, ... ]
}
```

**Limite de armazenamento:** máximo de 200 registros no `localStorage`. Ao atingir o limite, o mais antigo é removido automaticamente (FIFO). O usuário é avisado com um toast antes do descarte.

**Exportação CSV:**
- Colunas: Data, Produto, Plataforma, Tipo Vendedor, Custo, Margem Desejada, Preço Sugerido, Lucro Líquido, Margem Real, % Plataforma
- Registros de comparação geram uma linha por plataforma
- Download via `Blob` + `URL.createObjectURL` — sem biblioteca externa

---

## PWA

- `manifest.json`: nome "PrecificaPRO", cor de tema `#080f1e`, ícones 192px e 512px
- `sw.js`: cache de todos os assets estáticos na instalação, serve do cache em offline
- Estratégia: Cache First para assets, Network First para nada (app 100% offline)

---

## O que está fora do escopo desta versão

- PDF export (pode ser adicionado depois)
- Login com conta / plano mensal (modelo atual de senha permanece)
- Histórico na nuvem / sync entre dispositivos
- Notificações de mudança de taxas
- Integração com APIs dos marketplaces
