// ruah-ad.js — PrecificaPRO
// Aba lateral de propaganda (Ruah Tecnologia): dois carrosséis empilhados
// (.ruah-ad-stack), cada um avançando sozinho entre seus próprios slides,
// com dots clicáveis e pausa no hover/foco. Widget autocontido — não lê
// nem escreve em state.js, não depende de nenhuma outra view.

const INTERVAL_MS   = 5000;
const REDUCED_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function initRuahAd() {
  const roots = Array.from(document.querySelectorAll('.ruah-ad'));
  roots.forEach((root, i) => initCarousel(root, i));
}

// instanceOffset desloca o slide inicial de cada carrossel (0, 1, 2...) pra que,
// havendo mais de um banner na tela ao mesmo tempo, eles não comecem mostrando
// o mesmo anúncio.
function initCarousel(root, instanceOffset) {
  const track = root.querySelector('.ruah-ad__track');
  const dots  = Array.from(root.querySelectorAll('.ruah-ad__dot'));
  const slideCount = track ? track.children.length : 0;
  if (!root || !track || !slideCount || !dots.length) return;

  let current = instanceOffset % slideCount;
  let paused  = false;
  let timer   = null;

  function render() {
    track.style.transform = `translateX(-${current * (100 / slideCount)}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
  }

  function goTo(i) {
    current = ((i % slideCount) + slideCount) % slideCount;
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
