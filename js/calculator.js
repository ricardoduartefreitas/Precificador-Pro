// calculator.js — PrecificaPRO
// Responsabilidade: motor de cálculo puro, agnóstico de plataforma
// Recebe taxas já extraídas como números — não conhece estrutura de plataforma

// ---------------------------------------------------------------------------
// TIPOS (documentação)
//
// @typedef {Object} CalcInputs
// @property {number} custoProduto       - custo de aquisição do produto (R$)
// @property {number} custoFrete         - custo de frete do vendedor (R$)
// @property {number} custosAdicionais   - embalagem, etiquetas, etc. (R$)
// @property {number} comissaoPlataforma - comissão percentual da plataforma (%)
// @property {number} taxaAnuncio        - taxa fixa de anúncio por venda (R$)
// @property {number} imposto            - imposto sobre a venda (%)
// @property {number} margemLucro        - margem de lucro desejada (%)
//
// @typedef {Object} CalcResultado
// @property {number} precoVenda      - preço de venda sugerido (R$)
// @property {number} precoMinimo     - break-even: custo total + taxas, sem margem (R$)
// @property {number} lucroLiquido    - lucro após todos os descontos (R$)
// @property {number} lucroPercentual - lucro / precoVenda em % (margem real)
// @property {number} custoTotal      - soma de todos os custos do vendedor (R$)
// @property {Object} breakdown       - detalhamento de cada dedução
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
 * Calcula o preço de venda sugerido e o detalhamento de lucro.
 *
 * Fórmula:
 *   precoVenda = (custoTotal + taxaAnuncio) / (1 - comissao% - imposto% - margem%)
 *
 * Onde:
 *   custoTotal = custoProduto + custoFrete + custosAdicionais
 *   divisor    = 1 - (comissaoPlataforma + imposto + margemLucro) / 100
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
    margemLucro,
  } = inputs;

  const custoTotal = custoProduto + custoFrete + custosAdicionais;

  // Soma dos percentuais que incidem sobre o preço de venda
  const pctSomado = (comissaoPlataforma + imposto + margemLucro) / 100;
  const divisor   = 1 - pctSomado;

  // Protege contra divisão por zero ou divisor inválido (taxas >= 100%)
  if (divisor <= 0) return null;

  const precoVenda = _r2((custoTotal + taxaAnuncio) / divisor);

  // Deduções calculadas sobre o preço de venda final
  const comissaoValor = _r2(precoVenda * (comissaoPlataforma / 100));
  const impostoValor  = _r2(precoVenda * (imposto / 100));
  const margemValor   = _r2(precoVenda * (margemLucro / 100));
  const freteValor    = _r2(custoFrete);

  const totalDeducoes = comissaoValor + impostoValor + taxaAnuncio;
  const lucroLiquido  = _r2(precoVenda - custoTotal - totalDeducoes);
  const precoMinimo   = _r2(custoTotal + totalDeducoes);
  const lucroPercentual = precoVenda > 0
    ? _r2((lucroLiquido / precoVenda) * 100)
    : 0;

  return {
    precoVenda,
    precoMinimo,
    lucroLiquido,
    lucroPercentual,
    custoTotal: _r2(custoTotal),
    breakdown: {
      comissaoValor,
      impostoValor,
      margemValor,
      freteValor,
      taxaAnuncioValor: _r2(taxaAnuncio),
      custosProduto:    _r2(custoProduto),
      custosAdicionais: _r2(custosAdicionais),
      totalDeducoes:    _r2(totalDeducoes),
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
 * @returns {CalcResultado|null} resultado com precoVenda descontado, ou null se inválido
 */
export function calcularComDesconto(inputs, desconto) {
  if (!_validar(inputs)) return null;
  if (typeof desconto !== 'number' || !isFinite(desconto) || desconto < 0 || desconto >= 100) {
    return null;
  }

  // Calcula o resultado base sem desconto
  const base = calcular(inputs);
  if (!base) return null;

  const fatorDesconto = 1 - desconto / 100;
  const precoComDesconto = _r2(base.precoVenda * fatorDesconto);

  // Recalcula deduções sobre o preço com desconto
  const { comissaoPlataforma, imposto, taxaAnuncio, custoProduto, custoFrete, custosAdicionais } = inputs;

  const comissaoValor = _r2(precoComDesconto * (comissaoPlataforma / 100));
  const impostoValor  = _r2(precoComDesconto * (imposto / 100));
  const margemValor   = _r2(precoComDesconto * (inputs.margemLucro / 100));
  const custoTotal    = _r2(custoProduto + custoFrete + custosAdicionais);
  const totalDeducoes = _r2(comissaoValor + impostoValor + taxaAnuncio);
  const lucroLiquido  = _r2(precoComDesconto - custoTotal - totalDeducoes);
  const precoMinimo   = _r2(custoTotal + totalDeducoes);
  const lucroPercentual = precoComDesconto > 0
    ? _r2((lucroLiquido / precoComDesconto) * 100)
    : 0;

  return {
    precoVenda:     precoComDesconto,
    precoMinimo,
    lucroLiquido,
    lucroPercentual,
    custoTotal,
    desconto,
    precoSemDesconto: base.precoVenda,
    breakdown: {
      comissaoValor,
      impostoValor,
      margemValor,
      freteValor:       _r2(custoFrete),
      taxaAnuncioValor: _r2(taxaAnuncio),
      custosProduto:    _r2(custoProduto),
      custosAdicionais: _r2(custosAdicionais),
      totalDeducoes,
      descontoValor:    _r2(base.precoVenda - precoComDesconto),
    },
  };
}

/**
 * Mapeia o objeto de plataforma (platforms/*.js) para o formato de inputs
 * esperado por calcular(), aplicando a faixa de taxa correta para o preço estimado.
 *
 * Usado internamente por comparar().
 *
 * @param {Object} baseInputs       - { custoProduto, custoFrete, custosAdicionais, margemLucro, imposto }
 * @param {Object} plataforma       - objeto de plataforma (ver platforms/*.js)
 * @param {string} tipoVendedor     - chave de tipo (ex: 'cnpj', 'fba')
 * @param {boolean} campanha        - se campanha está ativa
 * @returns {CalcInputs|null}
 */
export function mapPlataformaToInputs(baseInputs, plataforma, tipoVendedor, campanha = false) {
  const faixas = plataforma.faixas[tipoVendedor]
    || plataforma.faixas[Object.keys(plataforma.faixas)[0]];

  if (!faixas?.length) return null;

  // Estimativa de preço com primeira faixa para encontrar a faixa correta
  const custoTotal   = (baseInputs.custoProduto || 0) + (baseInputs.custoFrete || 0) + (baseInputs.custosAdicionais || 0);
  const pctExtra     = campanha && plataforma.campanha ? (plataforma.taxaCampanha || 0) : 0;
  const pct0         = (faixas[0].comissao + faixas[0].variavel + pctExtra) / 100;
  const divisor0     = 1 - pct0 - (baseInputs.margemLucro || 0) / 100 - (baseInputs.imposto || 0) / 100;
  const precoEst     = divisor0 > 0 ? (custoTotal + faixas[0].fixo) / divisor0 : 0;

  // Faixa final (uma iteração resolve 99% dos casos de mudança de faixa)
  const faixa = faixas.find((f) => precoEst <= f.max) || faixas[faixas.length - 1];

  return {
    custoProduto:      baseInputs.custoProduto     || 0,
    custoFrete:        baseInputs.custoFrete        || 0,
    custosAdicionais:  baseInputs.custosAdicionais  || 0,
    comissaoPlataforma: faixa.comissao + (faixa.variavel || 0) + pctExtra,
    taxaAnuncio:       faixa.fixo,
    imposto:           baseInputs.imposto           || 0,
    margemLucro:       baseInputs.margemLucro       || 0,
    _faixaLabel:       faixa.label,
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
