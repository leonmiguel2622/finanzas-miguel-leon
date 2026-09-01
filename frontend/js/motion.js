// motion.js — Taste Skill v2 + Emil Animations — microinteracciones sutiles
// Easing correcto: ease-out para enter, spring para delight, solo transform/opacity
(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // 1. Stagger reveal para paneles al hacer scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.panel, .chart-container').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.style.transition = `opacity 480ms cubic-bezier(.16,1,.3,1) ${i * 60}ms, transform 480ms cubic-bezier(.16,1,.3,1) ${i * 60}ms`;
    observer.observe(el);
  });

  // 2. Botones — press spring (no bounce elástico, usa spring sutil)
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn, .button');
    if (!btn) return;
    btn.style.transition = 'transform 150ms cubic-bezier(.175,.885,.32,1.275)';
    btn.style.transform = 'scale(.97)';
  });
  document.addEventListener('pointerup', (e) => {
    const btn = e.target.closest('.btn, .button');
    if (!btn) return;
    btn.style.transform = '';
    setTimeout(() => btn.style.transition = '', 220);
  });

  // 3. Tabla — row hover slide (solo transform)
  document.querySelectorAll('.table-wrap').forEach(wrap => {
    wrap.addEventListener('mousemove', (e) => {
      const tr = e.target.closest('tbody tr');
      if (!tr) return;
      tr.style.transition = 'transform 150ms cubic-bezier(.16,1,.3,1)';
    });
  });

  // 4. Focus ring — ya en CSS, solo suaviza
  // 5. KPI count-up sutil cuando se actualiza (observa cambios en card-*)
  const cards = ['card-ingresos','card-gastos','card-balance','card-prediccion'];
  cards.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const mo = new MutationObserver(() => {
      if (prefersReduced) return;
      el.animate([
        { transform: 'scale(1.02)', opacity: .9 },
        { transform: 'scale(1)', opacity: 1 }
      ], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' });
    });
    mo.observe(el, { childList: true, characterData: true, subtree: true });
  });
})();
