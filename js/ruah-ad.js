// ruah-ad.js — PrecificaPRO
// Aba lateral de propaganda (Ruah Tecnologia): carrossel de 3 cards que avança
// sozinho, com dots clicáveis e pausa no hover/foco. Widget autocontido —
// não lê nem escreve em state.js, não depende de nenhuma outra view.

const SLIDE_COUNT   = 3;
const INTERVAL_MS   = 5000;
const REDUCED_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function initRuahAd() {
  const root  = document.getElementById('ruah-ad');
  const track = document.getElementById('ruah-ad-track');
  const dots  = root ? Array.from(root.querySelectorAll('.ruah-ad__dot')) : [];
  if (!root || !track || !dots.length) return;

  let current = 0;
  let paused  = false;
  let timer   = null;

  function render() {
    track.style.transform = `translateX(-${current * (100 / SLIDE_COUNT)}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
  }

  function goTo(i) {
    current = ((i % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT;
    render();
  }

  function tick() {
    if (paused || REDUCED_MOTION) return;
    goTo(current + 1);
  }

  function start() {
    if (timer || REDUCED_MOTION) return;
    timer = setInterval(tick, INTERVAL_MS);
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => goTo(i));
  });

  root.addEventListener('mouseenter', () => { paused = true; });
  root.addEventListener('mouseleave', () => { paused = false; });
  root.addEventListener('focusin',    () => { paused = true; });
  root.addEventListener('focusout',   () => { paused = false; });

  render();
  start();
}
