// calculator.js — PrecificaPRO
// Responsabilidade: motor de cálculo puro, agnóstico de plataforma
// Recebe taxas já extraídas como números — não conhece estrutura de plataforma

// ---------------------------------------------------------------------------
// TIPOS (documentação)
//
// @typedef {Object} CalcInputs
// @property {number} custoProduto       - custo de aquisição do produto (R$)
// @property {number} custoFrete         - custo de frete FIXO do vendedor (R$)
// @property {number} custosAdicionais   - embalagem, etiquetas, etc. (R$)
// @property {number} comissaoPlataforma - comissão percentual da plataforma (%)
// @property {number} taxaAnuncio        - taxa fixa de anúncio por venda (R$)
// @property {number} imposto            - imposto sobre a venda (%)
// @property {number} afiliadosPercent   - percentual de afiliados (%)
// @property {number} adsPercent         - percentual de ads (%)
// @property {number} adsFixo            - valor fixo de ads (R$)
// @property {number} margemLucro        - margem de lucro desejada (%)
// @property {number} fretePercent       - SOMENTE SE PERCENTUAL: % do frete no divisor (%)
//
// @typedef {Object} CalcResultado
// @property {number} precoVenda      - preço de venda sugerido (R$)
// @property {number} precoMinimo     - break-even: custo total + taxas, sem margem (R$)
// @property {number} lucroLiquido    - lucro após todos os descontos (R$)
// @property {number} lucroPercentual - lucro / precoVenda em % (margem real)
// @property {number} custoTotal      - soma de todos os custos do vendedor (R$)
// @property {Object} breakdown       - detalhamento de 5 blocos: plataforma, venda, imposto, outros, lucro
// ---------------------------------------------------------------------------

/**
 * Valida se os inputs são números finitos e não negativos.
 * @param {CalcInputs} inputs
 * @returns {boolean}
 */
function _validar(inputs) {
  if (!inputs || typeof inputs !== 'object') return false;

  const campos = [
    'custoProduto',
    'custoFrete',
    'custosAdicionais',
    'comissaoPlataforma',
    'taxaAnuncio',
    'imposto',
    'afiliadosPercent',
    'adsPercent',
    'adsFixo',
    'margemLucro',
  ];

  return campos.every((campo) => {
    const v = inputs[campo];
    return typeof v === 'number' && isFinite(v) && v >= 0;
  });
}

/**
 * Arredonda para 2 casas decimais sem acúmulo de ponto flutuante.
 * @param {number} n
 * @returns {number}
 */
function _r2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Calcula o preço de venda sugerido com a ressalva de frete condicional.
 *
 * Fórmula (com ressalva sobre FRETE):
 *   SE fretePercent > 0 (frete PERCENTUAL, ex: TikTok 6%):
 *     divisor = 1 - (comissão + afiliados% + ads% + frete% + imposto + margem) / 100
 *     precoVenda = (custoProduto + custosAdicionais + adsFixo) / divisor
 *   SENÃO (frete FIXO ou nenhum, ex: ML, Shopee):
 *     divisor = 1 - (comissão + afiliados% + ads% + imposto + margem) / 100
 *     precoVenda = (custoProduto + custoFrete + custosAdicionais + adsFixo) / divisor
 *
 * Breakdown organizado em 5 blocos:
 *   1. CUSTO DA PLATAFORMA: comissão + taxa fixa + frete (fixo ou percentual)
 *   2. CUSTOS DE VENDA: afiliados + ads (fixo + percentual)
 *   3. IMPOSTO
 *   4. OUTROS CUSTOS: custoProduto + custosAdicionais
 *   5. LUCRO: margemLucro
 *
 * @param {CalcInputs} inputs - dados do produto e taxas da plataforma
 * @returns {CalcResultado|null} resultado estruturado, ou null se inputs inválidos
 */
export function calcular(inputs) {
  if (!_validar(inputs)) return null;

  const {
    custoProduto,
    custoFrete,
    custosAdicionais,
    comissaoPlataforma,
    taxaAnuncio,
    imposto,
    afiliadosPercent = 0,
    adsPercent = 0,
    adsFixo = 0,
    margemLucro,
    fretePercent = 0,  // SOMENTE se percentual (percentualGMV)
  } = inputs;

  // ─── CALCULAR DIVISOR: condicionalizar frete ───
  // Se frete é percentual (fretePercent > 0), entra no divisor
  // Senão, fica no numerador (somado a custoProduto)
  const pctNoDivisor = comissaoPlataforma + afiliadosPercent + adsPercent + imposto + margemLucro + fretePercent;
  const divisor = 1 - pctNoDivisor / 100;

  if (divisor <= 0) return null;

  // ─── CALCULAR NUMERADOR: condicionalizar frete ───
  // Se frete é fixo (fretePercent === 0), custoFrete entra no numerador
  // Se frete é percentual, custoFrete não entra (foi substituído por fretePercent no divisor)
  const numerador = custoProduto
    + (fretePercent === 0 ? custoFrete : 0)  // Frete fixo entra aqui
    + custosAdicionais
    + adsFixo
    + taxaAnuncio;

  const precoVenda = _r2(numerador / divisor);

  // ─── DEDUÇÕES SOBRE PREÇO DE VENDA ───
  const comissaoValor = _r2(precoVenda * (comissaoPlataforma / 100));
  const fretePercentualValor = _r2(precoVenda * (fretePercent / 100)); // Frete percentual calculado aqui
  const afiliadosValor = _r2(precoVenda * (afiliadosPercent / 100));
  const adsPercentualValor = _r2(precoVenda * (adsPercent / 100));
  const impostoValor = _r2(precoVenda * (imposto / 100));
  const margemValor = _r2(precoVenda * (margemLucro / 100));

  // ─── BLOCOS DE BREAKDOWN (5 categorias) ───
  // 1. CUSTO DA PLATAFORMA: comissão + taxa fixa + frete (seja fixo ou percentual)
  const custoDaPlataforma = _r2(
    comissaoValor
    + taxaAnuncio
    + (fretePercent > 0 ? fretePercentualValor : custoFrete)
  );

  // 2. CUSTOS DE VENDA: afiliados + ads (fixo + percentual)
  const custosDeVenda = _r2(afiliadosValor + adsPercentualValor + adsFixo);

  // 3. IMPOSTO
  const impostoTotal = impostoValor;

  // 4. OUTROS CUSTOS: custoProduto + custosAdicionais
  const outrosCustos = _r2(custoProduto + custosAdicionais);

  // 5. LUCRO (valor, não percentual)
  const lucroLiquido = _r2(precoVenda - custoDaPlataforma - custosDeVenda - impostoTotal - outrosCustos);
  const lucroPercentual = precoVenda > 0
    ? _r2((lucroLiquido / precoVenda) * 100)
    : 0;

  // Preço mínimo: custo total sem margem
  const precoMinimo = _r2(custoDaPlataforma + custosDeVenda + impostoTotal + outrosCustos);

  // Custo total tradicional (para compatibilidade)
  const custoTotal = _r2(outrosCustos + custoFrete);

  return {
    precoVenda,
    precoMinimo,
    lucroLiquido,
    lucroPercentual,
    custoTotal,
    breakdown: {
      // Bloco 1: Custo da Plataforma
      comissaoValor,
      taxaAnuncioValor: _r2(taxaAnuncio),
      freteValor: fretePercent > 0 ? fretePercentualValor : custoFrete,
      custoDaPlataforma,

      // Bloco 2: Custos de Venda
      afiliadosValor,
      adsPercentualValor,
      adsFixoValor: _r2(adsFixo),
      custosDeVenda,

      // Bloco 3: Imposto
      impostoValor,

      // Bloco 4: Outros Custos
      custosProduto: _r2(custoProduto),
      custosAdicionais: _r2(custosAdicionais),
      outrosCustos,

      // Bloco 5: Lucro
      lucroValor: lucroLiquido,
      lucroPercentualVal: lucroPercentual,
    },
  };
}

/**
 * Calcula o preço ajustado para campanhas promocionais com desconto.
 *
 * O desconto é aplicado ao preço de venda final. A margem de lucro é
 * recalculada sobre o preço com desconto para refletir o impacto real.
 *
 * @param {CalcInputs} inputs   - mesmos inputs de calcular()
 * @param {number}     desconto - percentual de desconto da campanha (ex: 10 = 10%)
 * @param {Array}      [faixas] - faixas da plataforma (plataforma.faixas[tipoVendedor]); se
 *                                fornecido, reverifica se o preço COM desconto ainda pertence
 *                                à faixa aplicada ao preço cheio — se não, usa a faixa correta
 *                                (o desconto pode empurrar o preço pra faixa de baixo)
 * @returns {CalcResultado|null} resultado com precoVenda descontado, ou null se inválido
 */
export function calcularComDesconto(inputs, desconto, faixas = null) {
  if (!_validar(inputs)) return null;
  if (typeof desconto !== 'number' || !isFinite(desconto) || desconto < 0 || desconto >= 100) {
    return null;
  }

  // Calcula o resultado base sem desconto
  const base = calcular(inputs);
  if (!base) return null;

  const fatorDesconto = 1 - desconto / 100;
  const precoComDesconto = _r2(base.precoVenda * fatorDesconto);

  // Recalcula com os mesmos inputs (agora com novos campos)
  let {
    comissaoPlataforma,
    taxaAnuncio,
  } = inputs;
  const {
    imposto,
    custoProduto,
    custoFrete,
    custosAdicionais,
    afiliadosPercent = 0,
    adsPercent = 0,
    adsFixo = 0,
    fretePercent = 0,
  } = inputs;

  // INVARIANTE: a faixa usada nas deduções deve ser a do preço FINAL (com desconto),
  // não a do preço cheio. Reverifica e re-seleciona se necessário.
  let faixaLabel = inputs._faixaLabel;
  if (Array.isArray(faixas) && faixas.length) {
    const faixaCheia = faixas.find((f) => base.precoVenda <= f.max) || faixas[faixas.length - 1];
    // pctExtra = campanha/product ads, já embutido em comissaoPlataforma pelo mapPlataformaToInputs
    const pctExtra = comissaoPlataforma - (faixaCheia.comissao + (faixaCheia.variavel || 0));
    const faixaDesconto = faixas.find((f) => precoComDesconto <= f.max) || faixas[faixas.length - 1];
    comissaoPlataforma = faixaDesconto.comissao + (faixaDesconto.variavel || 0) + pctExtra;
    taxaAnuncio = faixaDesconto.fixo;
    faixaLabel = faixaDesconto.label;
  }

  // Recalcula deduções sobre o preço com desconto
  const comissaoValor = _r2(precoComDesconto * (comissaoPlataforma / 100));
  const fretePercentualValor = _r2(precoComDesconto * (fretePercent / 100));
  const afiliadosValor = _r2(precoComDesconto * (afiliadosPercent / 100));
  const adsPercentualValor = _r2(precoComDesconto * (adsPercent / 100));
  const impostoValor = _r2(precoComDesconto * (imposto / 100));
  const margemValor = _r2(precoComDesconto * (inputs.margemLucro / 100));

  const custoDaPlataforma = _r2(
    comissaoValor + taxaAnuncio + (fretePercent > 0 ? fretePercentualValor : custoFrete)
  );
  const custosDeVenda = _r2(afiliadosValor + adsPercentualValor + adsFixo);
  const outrosCustos = _r2(custoProduto + custosAdicionais);

  const custoTotal = _r2(outrosCustos + custoFrete);
  const lucroLiquido = _r2(precoComDesconto - custoDaPlataforma - custosDeVenda - impostoValor - outrosCustos);
  const precoMinimo = _r2(custoDaPlataforma + custosDeVenda + impostoValor + outrosCustos);
  const lucroPercentual = precoComDesconto > 0
    ? _r2((lucroLiquido / precoComDesconto) * 100)
    : 0;

  return {
    precoVenda: precoComDesconto,
    precoMinimo,
    lucroLiquido,
    lucroPercentual,
    custoTotal,
    desconto,
    precoSemDesconto: base.precoVenda,
    _faixaLabel: faixaLabel,
    breakdown: {
      comissaoValor,
      taxaAnuncioValor: _r2(taxaAnuncio),
      freteValor: fretePercent > 0 ? fretePercentualValor : custoFrete,
      custoDaPlataforma,

      afiliadosValor,
      adsPercentualValor,
      adsFixoValor: _r2(adsFixo),
      custosDeVenda,

      impostoValor,

      custosProduto: _r2(custoProduto),
      custosAdicionais: _r2(custosAdicionais),
      outrosCustos,

      lucroValor: lucroLiquido,
      descontoValor: _r2(base.precoVenda - precoComDesconto),
    },
  };
}

/**
 * Mapeia o objeto de plataforma (platforms/*.js) para o formato de inputs
 * esperado por calcular(), aplicando a faixa de taxa correta para o preço estimado.
 *
 * Suporta cálculo automático de frete se pesoKg for fornecido.
 * RESSALVA: Se freteRegra.tipo === 'percentualGMV', passa fretePercent no divisor;
 *           senão, custoFrete entra no numerador.
 *
 * @param {Object} baseInputs       - { custoProduto, custosAdicionais, margemLucro, imposto, pesoKg?, afiliadosPercent?, adsPercent?, adsFixo? }
 * @param {Object} plataforma       - objeto de plataforma (ver platforms/*.js)
 * @param {string} tipoVendedor     - chave de tipo (ex: 'cnpj', 'fba')
 * @param {boolean} campanha        - se campanha está ativa
 * @returns {CalcInputs|null}
 */
export function mapPlataformaToInputs(baseInputs, plataforma, tipoVendedor, campanha = false) {
  const faixas = plataforma.faixas[tipoVendedor]
    || plataforma.faixas[Object.keys(plataforma.faixas)[0]];

  if (!faixas?.length) return null;

  const custoProduto = baseInputs.custoProduto || 0;
  const custosAdicionais = baseInputs.custosAdicionais || 0;
  const pesoKg = baseInputs.pesoKg || 0;
  const afiliadosPercent = baseInputs.afiliadosPercent || 0;
  const adsPercent = baseInputs.adsPercent || 0;
  const adsFixo = baseInputs.adsFixo || 0;
  const margemLucro = baseInputs.margemLucro || 0;
  const imposto = baseInputs.imposto || 0;
  const custoFreteManual = baseInputs.custoFrete || 0;
  const pctExtra = campanha && plataforma.campanha ? (plataforma.taxaCampanha || 0) : 0;

  // ─── LOOP DE CONVERGÊNCIA: faixa ⇄ preço final ───
  // A comissão/faixa depende do preço de venda, mas o preço de venda depende da comissão
  // (ela entra no divisor). Por isso a faixa é escolhida por ESTIMATIVA e precisa ser
  // reverificada contra o preço FINAL (calculado com calcular(), a mesma fórmula usada
  // no resultado exibido) — se o preço final cair fora da faixa estimada, reseleciona a
  // faixa correta e recalcula. Repete até estabilizar (trava de segurança: 10 iterações).
  //
  // INVARIANTE mantida ao sair do loop: faixa.max >= preço final calculado com essa faixa.
  //
  // CASO DEGENERADO (sem ponto fixo): em tabelas com taxa fixa que desaparece acima de um
  // limiar (ex.: ML Flex — R$4 abaixo de R$79,98, R$0 acima), combinações extremas de
  // margem+imposto podem oscilar para sempre entre duas faixas (aplicar a taxa empurra o
  // preço pra cima da faixa; remover a taxa empurra de volta pra baixo — nenhuma das duas
  // é autoconsistente). Nesse caso não existe preço que atinja a margem exata pedida; a
  // saída SEGURA é a de MAIOR preço observada — ela nunca deixa a margem real do vendedor
  // abaixo da solicitada (o preço mais alto tende a cair na faixa de taxa mais baixa).
  let faixa = faixas[0];
  let freteAutomatico = custoFreteManual;
  let freteDescricao = '';
  let fretePercent = 0;  // Frete PERCENTUAL (somente se percentualGMV)
  let precoAtual = 0;
  let melhorSeguro = null; // fallback anti-oscilação: maior preço já observado no loop

  for (let i = 0; i < 10; i++) {
    // Frete automático depende do preço estimado da iteração anterior (peso × preço)
    if (pesoKg > 0) {
      const freteInfo = calcularFretePorRegra(plataforma, precoAtual, pesoKg);
      freteDescricao = freteInfo.descricao;

      if (plataforma.freteRegra?.tipo === 'percentualGMV') {
        fretePercent = plataforma.freteRegra.percentual || 0;
        freteAutomatico = 0;  // Será calculado no divisor
      } else {
        fretePercent = 0;
        freteAutomatico = freteInfo.frete;
      }
    }

    const resultadoIteracao = calcular({
      custoProduto,
      custoFrete: freteAutomatico,
      custosAdicionais,
      comissaoPlataforma: faixa.comissao + (faixa.variavel || 0) + pctExtra,
      taxaAnuncio: faixa.fixo,
      imposto,
      afiliadosPercent,
      adsPercent,
      adsFixo,
      margemLucro,
      fretePercent,
    });
    const novoPreco = resultadoIteracao ? resultadoIteracao.precoVenda : 0;

    // Guarda o candidato de MAIOR preço já produzido pela faixa ATUAL — fallback seguro
    if (!melhorSeguro || novoPreco > melhorSeguro.preco) {
      melhorSeguro = { faixa, preco: novoPreco, freteAutomatico, fretePercent, freteDescricao };
    }

    const novaFaixa = faixas.find((f) => novoPreco <= f.max) || faixas[faixas.length - 1];

    if (novaFaixa === faixa) {
      // AUTOCONSISTENTE: a faixa aplicada produz um preço que continua dentro dela mesma
      precoAtual = novoPreco;
      break;
    }

    faixa = novaFaixa;
    precoAtual = novoPreco;
  }

  // Se a faixa final não é autoconsistente (loop esgotou as 10 iterações oscilando, sem
  // ponto fixo — caso degenerado descrito acima), usa o candidato de MAIOR preço observado.
  if (faixas.find((f) => precoAtual <= f.max) !== faixa) {
    faixa = melhorSeguro.faixa;
    precoAtual = melhorSeguro.preco;
    freteAutomatico = melhorSeguro.freteAutomatico;
    fretePercent = melhorSeguro.fretePercent;
    freteDescricao = melhorSeguro.freteDescricao;
  }

  return {
    custoProduto,
    custoFrete: freteAutomatico,  // Frete automático calculado (fixo)
    custosAdicionais,
    comissaoPlataforma: faixa.comissao + (faixa.variavel || 0) + pctExtra,
    taxaAnuncio: faixa.fixo,
    imposto,
    afiliadosPercent,
    adsPercent,
    adsFixo,
    margemLucro,
    fretePercent,  // Frete PERCENTUAL (0 se não for percentualGMV)
    _faixaLabel: faixa.label,
    _freteDescricao: freteDescricao,
  };
}

/**
 * Calcula e compara todas as plataformas com os mesmos inputs base.
 * Retorna array ordenado por lucroLiquido decrescente.
 *
 * @param {Object} baseInputs   - { custoProduto, custoFrete, custosAdicionais, margemLucro, imposto }
 * @param {Array}  plataformas  - array de objetos de plataforma (platforms/*.js)
 * @param {string} tipoVendedor - chave de tipo padrão (fallback quando tipoMap não define a plataforma)
 * @param {boolean} campanha    - se campanha está ativa
 * @param {Object} tipoMap      - mapa { [plataformaId]: tipoKey } para tipo por plataforma
 * @returns {Array} resultados com metadados da plataforma, ordenados por lucroLiquido
 */
export function comparar(baseInputs, plataformas, tipoVendedor = null, campanha = false, tipoMap = {}) {
  return plataformas
    .map((plataforma) => {
      const tipo = tipoMap[plataforma.id] || tipoVendedor || Object.keys(plataforma.faixas)[0];
      const inputs = mapPlataformaToInputs(baseInputs, plataforma, tipo, campanha);
      if (!inputs) return null;

      const resultado = calcular(inputs);
      if (!resultado) return null;

      return {
        plataforma: plataforma.id,
        nome:       plataforma.nome,
        cor:        plataforma.cor,
        faixa:      inputs._faixaLabel,
        ...resultado,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.lucroLiquido - a.lucroLiquido);
}

/**
 * Calcula o frete automático baseado nas regras da plataforma.
 *
 * @param {Object} plataforma  - objeto de plataforma (platforms/*.js)
 * @param {number} precoVenda  - preço de venda sugerido (R$)
 * @param {number} pesoKg      - peso do produto em kg
 * @returns {Object} { frete: number, descricao: string, aviso?: string }
 *
 * Regras:
 *   - Mercado Livre: tabela de peso, frete grátis se preço >= R$79
 *   - Shopee: subsídio por faixa de preço (frete grátis obrigatório)
 *   - TikTok: 6% do GMV do preço de venda (cap R$50)
 *   - Amazon/Shein: não implementado (retorna 0)
 */
export function calcularFretePorRegra(plataforma, precoVenda, pesoKg) {
  if (!plataforma || typeof precoVenda !== 'number' || typeof pesoKg !== 'number') {
    return { frete: 0, descricao: 'sem frete', aviso: null };
  }

  const freteRegra = plataforma.freteRegra;
  if (!freteRegra) {
    return { frete: 0, descricao: 'sem frete', aviso: null };
  }

  // ─── MERCADO LIVRE: tabela por peso, frete grátis se preço >= R$79 ───
  if (freteRegra.tipo === 'tabelaPeso') {
    if (precoVenda >= freteRegra.freteGratisMinimo) {
      // Frete grátis obrigatório
      return {
        frete: 0,
        descricao: `ML ≥R$${freteRegra.freteGratisMinimo}: frete grátis obrigatório`,
      };
    }

    // Abaixo do mínimo: tabela de peso
    const tabelaItem = freteRegra.tabela.find((t) => pesoKg <= t.max);
    if (!tabelaItem) {
      return { frete: 0, descricao: 'Peso acima de 30kg — consulte simulador ML', aviso: freteRegra.avisoFrete };
    }

    if (tabelaItem.valor === null) {
      return { frete: 0, descricao: tabelaItem.label, aviso: freteRegra.avisoFrete };
    }

    return {
      frete: tabelaItem.valor,
      descricao: `ML tabela ${tabelaItem.label}: R$ ${tabelaItem.valor.toFixed(2)}`,
      aviso: freteRegra.avisoFrete,
    };
  }

  // ─── SHOPEE: subsídio por faixa de preço ───
  if (freteRegra.tipo === 'subsidioFaixa') {
    const faixa = freteRegra.faixas.find((f) => precoVenda <= f.max) || freteRegra.faixas[freteRegra.faixas.length - 1];
    // Frete grátis obrigatório — subsídio cobre, custo do vendedor = 0 (default)
    return {
      frete: 0,
      descricao: `Shopee frete grátis obrigatório — subsídio de R$ ${faixa.subsidio.toFixed(2)} (costo do vendedor ≈ R$0)`,
    };
  }

  // ─── TIKTOK SHOP: 6% do GMV (preço de venda) com cap de R$50 ───
  if (freteRegra.tipo === 'percentualGMV') {
    const freteSFP = _r2(precoVenda * (freteRegra.percentual / 100));
    const freteCapado = Math.min(freteSFP, freteRegra.cap);
    return {
      frete: freteCapado,
      descricao: `TikTok SFP 6% do GMV (cap R$50): R$ ${freteCapado.toFixed(2)}`,
    };
  }

  // Nenhuma regra conhecida
  return { frete: 0, descricao: 'sem frete', aviso: null };
}

/**
 * Identifica qual faixa se aplica a um preço específico.
 * Usado para renderizar aviso de faixa no painel de marketplace.
 *
 * @param {number} preco       - preço para verificar qual faixa se aplica
 * @param {Array}  faixas      - array de faixas { max, comissao, fixo, label, ... }
 * @returns {Object|null} { faixa, proxima, aviso } ou null se inválido
 *
 * Retorna:
 *   - faixa: faixa atual { max, comissao, fixo, label }
 *   - proxima: próxima faixa (se existir) ou null
 *   - limiteProxima: preço limite pra próxima faixa (ex: "R$50")
 *   - aviso: mensagem de aviso (ex: "se vender a R$50+, cai para 6% + R$6")
 */
export function identificarFaixa(preco, faixas) {
  if (!faixas || !Array.isArray(faixas) || faixas.length === 0) return null;
  if (typeof preco !== 'number' || !isFinite(preco)) return null;

  const faixa = faixas.find((f) => preco <= f.max) || faixas[faixas.length - 1];
  if (!faixa) return null;

  // Encontra a próxima faixa diferente
  const faixaIndex = faixas.indexOf(faixa);
  const proxima = faixaIndex < faixas.length - 1 ? faixas[faixaIndex + 1] : null;

  let aviso = null;
  let limiteProxima = null;

  if (proxima && isFinite(faixa.max) && faixa.max < Infinity) {
    // Se a próxima faixa tem max < Infinity, pode calcular o limite
    limiteProxima = _r2(faixa.max + 0.01);
    // Extrai comissão e taxa da label da próxima faixa ou constrói manualmente
    const proxComissao = proxima.comissao > 0 ? `${proxima.comissao}%` : '—';
    const proxFixo     = proxima.fixo > 0 ? `R$ ${proxima.fixo.toFixed(2)}` : '—';
    aviso = `Se vender a R$ ${limiteProxima.toFixed(2)}+, a faixa muda: ${proxComissao} + ${proxFixo}`;
  }

  return {
    faixa,
    proxima,
    limiteProxima,
    aviso,
  };
}

/**
 * Retorna todas as faixas de uma plataforma, formatadas para exibição.
 * Usado para renderizar a tabela de regras no painel.
 *
 * @param {Object} plataforma    - objeto de plataforma (platforms/*.js)
 * @param {string} tipoVendedor  - chave de tipo de vendedor
 * @returns {Array} array de faixas com metadados
 */
export function obterFaixasFormatadas(plataforma, tipoVendedor) {
  if (!plataforma || !plataforma.faixas) return [];

  const faixas = plataforma.faixas[tipoVendedor]
    || plataforma.faixas[Object.keys(plataforma.faixas)[0]];

  if (!faixas?.length) return [];

  return faixas.map((f) => ({
    max:       f.max,
    maxLabel:  isFinite(f.max) ? `até R$${f.max.toFixed(2)}` : 'acima',
    comissao:  f.comissao,
    fixo:      f.fixo,
    variavel:  f.variavel || 0,
    label:     f.label,
  }));
}

// ══════════════════════ ESCOPO 4 (25/08) — Imposto automático por regime ══════════════════════
//
// Sugestão de alíquota (%) a partir do regime tributário + atividade do vendedor (dados
// coletados no onboarding). É só um PONTO DE PARTIDA editável — o campo Imposto (%) continua
// livre pra digitar; isto apenas pré-preenche quando o usuário ainda não mexeu no valor.
//
// Fontes (consultadas 25/08/2026):
// - Simples Nacional: alíquota NOMINAL da 1ª faixa (até R$180.000/ano) de cada Anexo da LC 123/2006
//   (Comércio = Anexo I, Indústria = Anexo II, Serviço = Anexo III) — a alíquota EFETIVA real
//   depende da receita bruta dos últimos 12 meses (RBT12) e do Fator R, que este app não coleta;
//   por isso é sempre rotulada "estimativa" na UI.
// - Lucro Presumido: soma dos federais sobre a receita de comércio/indústria — PIS (0,65%) +
//   COFINS (3%) + IRPJ (15% sobre presunção de 8% = 1,2%, +10% adicional se aplicável) +
//   CSLL (9% sobre presunção de 12% = 1,08%) ≈ 5,93% pra comércio; pra serviços a presunção
//   de IRPJ/CSLL sobe (32%), ficando ≈ 11,33%. Não inclui ICMS/ISS (varia por estado/município).
// - Lucro Real: não tem alíquota fixa — depende do lucro real apurado no período. Retorna null
//   (a UI deve exibir aviso "sem estimativa automática" em vez de um número).
const _ALIQUOTAS_SIMPLES = {
  comercio: 4.00,   // Anexo I,  1ª faixa
  industria: 4.50,  // Anexo II, 1ª faixa
  servico: 6.00,    // Anexo III, 1ª faixa
};

const _ALIQUOTAS_PRESUMIDO = {
  comercio: 5.93,
  industria: 5.93,
  servico: 11.33,
};

/**
 * Sugere uma alíquota de imposto (%) com base no regime tributário e atividade.
 * @param {string} regime    - 'simples_nacional' | 'lucro_presumido' | 'lucro_real'
 * @param {string} atividade - 'comercio' | 'industria' | 'servico'
 * @returns {number|null} alíquota sugerida (%), ou null se não houver estimativa (Lucro Real)
 */
export function sugerirImposto(regime, atividade) {
  if (regime === 'simples_nacional') {
    return _ALIQUOTAS_SIMPLES[atividade] ?? _ALIQUOTAS_SIMPLES.comercio;
  }
  if (regime === 'lucro_presumido') {
    return _ALIQUOTAS_PRESUMIDO[atividade] ?? _ALIQUOTAS_PRESUMIDO.comercio;
  }
  // lucro_real ou regime desconhecido: sem estimativa automática confiável
  return null;
}
