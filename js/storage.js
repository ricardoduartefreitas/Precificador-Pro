// storage.js — PrecificaPRO
// Responsabilidade: wrapper de localStorage com serialização JSON e fallback seguro
// Todas as leituras/escritas do app passam por aqui

const PREFIX = '_psp_';

export function storageGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function storageSet(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function storageRemove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
    return true;
  } catch {
    return false;
  }
}

export function storageKeys() {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .map((k) => k.slice(PREFIX.length));
  } catch {
    return [];
  }
}
