// formatter.js — PrecificaPRO
// Responsabilidade: formatação de valores monetários e percentuais para exibição

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PCT = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Formata número como moeda BRL. Ex: 1234.5 → "R$ 1.234,50"
 */
export function formatBRL(value) {
  return BRL.format(value ?? 0);
}

/**
 * Formata número como percentual. Ex: 30.5 → "30,5%"
 * Recebe valor em % (não decimal). Ex: 30 → "30,0%"
 */
export function formatPct(value) {
  return PCT.format((value ?? 0) / 100);
}

/**
 * Formata data timestamp para exibição. Ex: 1718600000000 → "17/06/2026 14:30"
 */
export function formatDate(timestamp) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

/**
 * Formata data para label de agrupamento no histórico.
 * Ex: hoje, ontem, "Esta semana", ou "dd/mm/aaaa"
 */
export function formatGroupLabel(timestamp) {
  const now  = new Date();
  const date = new Date(timestamp);
  const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  if (diff <= 7)  return 'Esta semana';
  return date.toLocaleDateString('pt-BR');
}

/**
 * Converte número de input (pode ser string vazia) para float.
 * Retorna 0 se inválido.
 */
export function parseInputValue(raw) {
  const n = parseFloat(String(raw).replace(',', '.'));
  return isNaN(n) || n < 0 ? 0 : n;
}
