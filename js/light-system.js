// 光影系统：进场动画 + 轮廓光跟随 + 邻居照亮（borrowed from vgpu 归档案例）
//  - reveal:        IntersectionObserver 错峰进场
//  - rim-glow:      hover 边缘光跟随鼠标（nextjs-flare rim light）
//  - light-spill:   hover 卡片照亮邻居，距离平方衰减（radiance-cascades 光反弹）
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 1. 进场动画：卡片/瓦片错峰浮现 ──
  function setupReveal() {
    const groups = [
      { parent: '.project-grid', items: '.proj-card' },
      { parent: '.skill-tiles', items: '.skill-tile' },
      { parent: '.skill-grid', items: '.skill-card' },
      { parent: '.contact-row', items: '.contact-pill' },
    ];
    const targets = [];
    for (const g of groups) {
      document.querySelectorAll(g.parent).forEach((grid) => {
        grid.querySelectorAll(g.items).forEach((el, i) => {
          el.classList.add('reveal');
          el.style.setProperty('--reveal-delay', Math.min(i * 70, 420) + 'ms');
          targets.push(el);
        });
      });
    }
    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((t) => io.observe(t));
  }

  // ── 2+3. 轮廓光跟随 + 邻居照亮 ──
  function setupRim() {
    const SELECTOR = '.proj-card, .skill-tile, .skill-card';
    document.querySelectorAll(SELECTOR).forEach((el) => el.classList.add('rim-glow'));

    document.addEventListener('pointermove', (e) => {
      const hovered = e.target.closest?.(SELECTOR);
      if (!hovered) return;
      const r = hovered.getBoundingClientRect();
      hovered.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      hovered.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');

      // 光反弹：同一 grid 内的兄弟卡片按距离²衰减照亮（限制在 600px 内）
      const grid = hovered.parentElement;
      if (!grid) return;
      grid.querySelectorAll(SELECTOR).forEach((sib) => {
        if (sib === hovered) return;
        const sr = sib.getBoundingClientRect();
        const dx = (sr.left + sr.width / 2) - (r.left + r.width / 2);
        const dy = (sr.top + sr.height / 2) - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy);
        if (d > 600) { sib.classList.remove('spilled'); return; }
        const spill = 0.45 / (1 + (d / 260) * (d / 260)); // 1/(1+d²·falloff)，rim.wgsl 同款衰减
        if (spill > 0.04) {
          sib.style.setProperty('--spill', spill.toFixed(3));
          sib.classList.add('spilled');
        } else sib.classList.remove('spilled');
      });
    }, { passive: true });

    document.addEventListener('pointerout', (e) => {
      const card = e.target.closest?.(SELECTOR);
      if (!card) return;
      // 离开卡片时清掉它造成的溢光
      card.parentElement?.querySelectorAll('.spilled').forEach((s) => s.classList.remove('spilled'));
    }, { passive: true });
  }

  // ── 4. 统计数字滚动（count-up，进场触发一次）──
  function setupCountUp() {
    const strip = document.getElementById('stats');
    if (!strip || reduce || !('IntersectionObserver' in window)) {
      strip?.querySelectorAll('.stat-num').forEach((n) => { n.textContent = n.dataset.count; });
      return;
    }
    const run = () => {
      strip.querySelectorAll('.stat-num').forEach((el) => {
        const target = parseInt(el.dataset.count, 10) || 0;
        const DUR = 1100, T0 = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - T0) / DUR);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    };
    const io = new IntersectionObserver((es) => {
      if (es[0].isIntersecting) { run(); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(strip);
  }

  const boot = () => { setupReveal(); setupRim(); setupCountUp(); };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else boot();

  // 暂停时可清场（暂停页面动画时也让溢光熄灭）
  window.addEventListener('vaanai:pause-animations', () => {
    document.querySelectorAll('.spilled').forEach((s) => s.classList.remove('spilled'));
  });
})();
