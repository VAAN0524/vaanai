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

  // ── 玻璃灯板：鼠标即光源（vgpu transmission/glass-fractal 译文）──
  // 每块玻璃：--lx/--ly 光源位置%、--ang 朝光方位角、--lit 照度（rAF 平滑）
  // 鼠标进入玻璃正面 = .on 开灯（内部通电）；离开 = 照度随距离平方衰减
  function setupGlassLight() {
    const SELECTOR = '.proj-card, .skill-tile, .skill-card';
    const FALL_R = 560;        // 光照半径（px）
    const cards = [...document.querySelectorAll(SELECTOR)].map((el) => ({
      el, lit: 0, lx: 50, ly: 50, ang: 0,
    }));
    cards.forEach((c) => c.el.classList.add('glass-panel'));

    // 光标本体（可见的鼠标光晕）
    const orb = document.createElement('div');
    orb.id = 'light-orb';
    document.body.appendChild(orb);
    let orbX = -999, orbY = -999, orbTX = -999, orbTY = -999;

    let mx = -9999, my = -9999, lastMove = 0, running = true;
    document.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY; lastMove = performance.now();
      orbTX = mx; orbTY = my;
      orb.classList.add('alive');
    }, { passive: true });

    // 光标停留在玻璃上时开灯
    document.addEventListener('pointerover', (e) => {
      const card = e.target.closest?.(SELECTOR);
      if (card) card.classList.add('on');
    }, { passive: true });
    document.addEventListener('pointerout', (e) => {
      const card = e.target.closest?.(SELECTOR);
      if (card && !card.contains(e.relatedTarget)) card.classList.remove('on');
    }, { passive: true });

    window.addEventListener('vaanai:pause-animations', () => { running = false; orb.classList.remove('alive'); });
    window.addEventListener('vaanai:resume-animations', () => { running = true; });

    const inGlassZone = (el) => {
      // 光源只在玻璃区（projects/skills/capability）显形，不与 hero 流体抢戏
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
    };

    function frame() {
      requestAnimationFrame(frame);
      if (!running || document.hidden) return;
      const idle = performance.now() - lastMove > 2600;
      orbX += (orbTX - orbX) * 0.12;
      orbY += (orbTY - orbY) * 0.12;
      orb.style.transform = `translate(${orbX - 190}px, ${orbY - 190}px)`;
      if (idle) orb.classList.remove('alive');

      let anyVisible = false;
      for (const c of cards) {
        const r = c.el.getBoundingClientRect();
        if (r.width === 0 || r.bottom < -100 || r.top > innerHeight + 100) continue;
        anyVisible = true;
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = mx - cx, dy = my - cy;
        const d = Math.hypot(dx, dy);
        // 照度：1/(1+(d/r)²) 与 rim.wgsl 同款衰减；空闲时熄灭
        const target = idle ? 0 : Math.min(1, 1 / (1 + (d / 300) * (d / 300)));
        c.lit += (target - c.lit) * (target > c.lit ? 0.22 : 0.07); // 亮得快、暗得慢
        // 光源方位角（0deg=正上，顺时针；conic from 同基准）
        const ang = Math.atan2(dx, -dy) * 180 / Math.PI;
        // 光源在卡内的位置%（钳到 -40~140 允许光在卡外仍投影）
        const lx = Math.max(-40, Math.min(140, (mx - r.left) / r.width * 100));
        const ly = Math.max(-40, Math.min(140, (my - r.top) / r.height * 100));
        c.lx += (lx - c.lx) * 0.2; c.ly += (ly - c.ly) * 0.2; c.ang += (ang - c.ang) * 0.15;
        c.el.style.setProperty('--lit', c.lit.toFixed(3));
        c.el.style.setProperty('--lx', c.lx.toFixed(1) + '%');
        c.el.style.setProperty('--ly', c.ly.toFixed(1) + '%');
        c.el.style.setProperty('--ang', c.ang.toFixed(1) + 'deg');
      }
      // 光标不在玻璃区时收起光标光环
      if (!idle && !cards.some((c) => inGlassZone(c.el))) orb.classList.remove('alive');
    }
    requestAnimationFrame(frame);
  }

  const boot = () => { setupReveal(); setupGlassLight(); };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else boot();

  // 暂停时可清场（暂停页面动画时也让溢光熄灭）
})();
