// state.js — PrecificaPRO
// Responsabilidade: estado global da aplicação (inputs, resultados, plataforma ativa)
// Preserva inputs ao trocar de aba para que o usuário não precise redigitar

const _state = {
  // Plataforma selecionada na tela Calcular
  activePlatform: 'mercadolivre',

  // Tipo de vendedor selecionado (cnpj | cpf_menor | cpf_maior | fba | fbm | unico)
  sellerType: 'cnpj',

  // Inputs compartilhados entre Comparar e Calcular
  inputs: {
    custo:    0,
    extras:   0,
    frete:    0,
    margem:   30,
    campanha: false,
  },

  // Último resultado da calculadora individual
  lastResult: null,

  // Último resultado da comparação entre plataformas
  lastComparison: null,

  // Filtro ativo na tela de Histórico
  historyFilter: 'todos',

  // Termo de busca na tela de Histórico
  historySearch: '',
};

export function getState() {
  return _state;
}

export function setState(partial) {
  Object.assign(_state, partial);
}

export function setInput(key, value) {
  _state.inputs[key] = value;
}

export function getInputs() {
  return { ..._state.inputs };
}
