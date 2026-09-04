// 滚动体验层：进度条 / 导航当前区高亮 / Hero 视差退场 / 回到顶部
// 克制原则：所有效果只在对应区域可见时消耗计算
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 1. 顶部滚动进度条 ──
  const bar = document.getElementById('scrollProgress');

  // ── 2. 导航当前区高亮 ──
  const navLinks = [...document.querySelectorAll('.nav-menu a[href^="#"]')];
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  // ── 3. 回到顶部 ──
  const topBtn = document.getElementById('backToTop');

  // ── 4. Hero 视差层 ──
  const hero = document.getElementById('hero');
  const parallax = [
    { el: document.getElementById('heroCanvas'), f: 0.18 },
    { el: document.getElementById('fluidCanvas'), f: 0.10 },
    { el: document.querySelector('.hero-cta'), f: 0.30 },
    { el: document.querySelector('.scroll-hint'), f: 0.5 },
  ].filter((p) => p.el);

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY;
      const docH = document.documentElement.scrollHeight - innerHeight;

      // 进度条
      if (bar) bar.style.transform = `scaleX(${docH > 0 ? y / docH : 0})`;

      // 回到顶部
      if (topBtn) topBtn.classList.toggle('show', y > 600);

      if (reduce) return;

      // Hero 视差退场（只在 hero 还在视口附近时计算）
      const heroH = hero ? hero.offsetHeight : 0;
      if (hero && y < heroH * 1.2) {
        const p = Math.min(1, y / heroH);
        for (const { el, f } of parallax) {
          el.style.transform = `translateY(${y * f}px)`;
        }
        const fade = 1 - p * 1.05;
        for (const { el } of parallax) el.style.opacity = Math.max(0, fade).toFixed(3);
      }

      // 导航当前区高亮：取视口上 1/3 线所在的 section
      let current = -1;
      sections.forEach((sec, i) => {
        if (sec.getBoundingClientRect().top <= innerHeight * 0.38) current = i;
      });
      navLinks.forEach((a, i) => a.classList.toggle('active', i === current));
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 回到顶部点击
  topBtn?.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  // ── 5. Hero 视差的暂停协调（滚动远离后 rAF 内自然跳过计算）──
})();
