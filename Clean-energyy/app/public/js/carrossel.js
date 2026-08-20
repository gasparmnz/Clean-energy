/* ══ CARROSSEL AUTOMÁTICO ══ */
(function () {
  const track  = document.querySelector('.carrossel-track');
  const slides  = document.querySelectorAll('.carrossel-slide');
  const btnPrev = document.querySelector('.carrossel-btn-prev');
  const btnNext = document.querySelector('.carrossel-btn-next');
  const dots    = document.querySelectorAll('.carrossel-dot');

  if (!track || !slides.length) return;

  let atual = 0;
  let timer;
  const total = slides.length;
  const INTERVALO = 5500; // ms

  function irPara(idx) {
    atual = (idx + total) % total;
    track.style.transform = `translateX(-${atual * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('ativo', i === atual));
  }

  function avancar() { irPara(atual + 1); }
  function voltar()  { irPara(atual - 1); }

  function iniciarTimer() {
    clearInterval(timer);
    timer = setInterval(avancar, INTERVALO);
  }

  btnNext && btnNext.addEventListener('click', () => { avancar(); iniciarTimer(); });
  btnPrev && btnPrev.addEventListener('click', () => { voltar();  iniciarTimer(); });

  dots.forEach((d, i) => {
    d.addEventListener('click', () => { irPara(i); iniciarTimer(); });
  });

  // Swipe touch
  let touchX = 0;
  track.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { diff > 0 ? avancar() : voltar(); iniciarTimer(); }
  });

  // Pausa ao hover
  track.addEventListener('mouseenter', () => clearInterval(timer));
  track.addEventListener('mouseleave', iniciarTimer);

  irPara(0);
  iniciarTimer();
})();
