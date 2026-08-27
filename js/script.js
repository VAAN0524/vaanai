// Vaan 个人主页 v3.0 — 粒子主题
let messages = [];

document.addEventListener('DOMContentLoaded', () => {
  // Lucide icons（defer 加载可能未就绪）
  const initIcons = () => {
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    else setTimeout(initIcons, 100);
  };
  initIcons();

  initHeroParticles();
  initRippleSystem();
  initSmoothScroll();
});

// ── Hero 粒子循环轮播 — 同一批粒子永不消失，形态之间连续变幻 ──
const HERO_WORDS = [
  'Vaan',
  'AI Builder',
  '数字造物者',
  '✦ 518 Skills ✦',
  '用代码构建',
  '28 Projects',
  '从粒子到现实',
  '◆ 开源 · 分享 ◆',
];

function initHeroParticles() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width = canvas.parentElement.offsetWidth;
    H = canvas.height = canvas.parentElement.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = [
    [0,217,255],[108,92,231],[247,148,161],[255,202,87],
    [72,219,133],[159,122,237],[255,118,117],
  ];
  const FIXED_N = 3000;
  const MAX_SAMPLE_POINTS = Math.floor(FIXED_N * 0.9); // 确保目标点数 < 粒子数 → 全覆盖

  // 初始化固定粒子池
  const particles = [];
  for (let i = 0; i < FIXED_N; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: 0, vy: 0,
      tx: 0, ty: 0,
      ease: 0.03 + Math.random() * 0.05,
      color: COLORS[i % COLORS.length],
      sz: 1.8 + Math.random() * 2.2,   // 更大更清晰
      swirlR: 60 + Math.random() * 200, // 混乱旋转半径
      swirlA: Math.random() * Math.PI * 2,
      swirlSpd: 0.04 + Math.random() * 0.05,
    });
  }

  function getPoints(text) {
    const offc = document.createElement('canvas');
    offc.width = W; offc.height = H;
    const octx = offc.getContext('2d');
    const fonts = '-apple-system,"PingFang SC","STXingkai",sans-serif';

    // 从 ImageData 中提取非透明像素坐标（限制总数 ≤ MAX_SAMPLE_POINTS）
    function extractPoints() {
      const imgData = octx.getImageData(0, 0, W, H).data;
      let pts = [];
      let step = 2;
      do {
        pts = [];
        for (let py = 0; py < H; py += step)
          for (let px = 0; px < W; px += step)
            if (imgData[(py * W + px) * 4 + 3] > 60)
              pts.push(px, py);
        if (pts.length / 2 > MAX_SAMPLE_POINTS) step++;
      } while (pts.length / 2 > MAX_SAMPLE_POINTS && step < 40);
      return pts;
    }

    // 扫描实际渲染的包围盒
    function scanBBox() {
      const d = octx.getImageData(0, 0, W, H).data;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++)
          if (d[(y * W + x) * 4 + 3] > 40) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
      return { minX, maxX, minY, maxY };
    }

    // 在指定位置绘制文字
    function drawAt(fontSize, drawX, drawY) {
      octx.clearRect(0, 0, W, H);
      octx.font = `900 ${fontSize}px ${fonts}`;
      octx.fillStyle = '#fff';
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillText(text, drawX, drawY);
    }

    // ── Step 1: 二分搜索最大能放入安全区的字号 ──
    const targetCX = W / 2;
    const targetCY = H * 0.40;

    let lo = 20, hi = Math.min(W * 0.8, H * 0.5);
    let bestFs = lo;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      drawAt(mid, targetCX, targetCY);
      const bb = scanBBox();

      // 验证实际渲染包围盒在画布内（有最少 5% 边距）
      const paddingX = W * 0.05, paddingY = H * 0.05;
      const fits =
        bb.minX >= paddingX && bb.maxX <= W - paddingX &&
        bb.minY >= paddingY && bb.maxY <= H - paddingY;

      if (fits) { bestFs = mid; lo = mid + 1; }
      else { hi = mid - 1; }
    }

    // ── Step 2: 找到字号后，根据实际渲染包围盒校准居中位置 ──
    drawAt(bestFs, targetCX, targetCY);
    let bb = scanBBox();

    // 计算偏移量，使包围盒中心精确对齐目标中心
    const bboxCY = (bb.minY + bb.maxY) / 2;
    const dy = targetCY - bboxCY;
    const bboxCX = (bb.minX + bb.maxX) / 2;
    const dx = targetCX - bboxCX;

    // 用校准后的坐标重新绘制并采样
    drawAt(bestFs, targetCX + dx, targetCY + dy);

    return extractPoints();
  }

  function assignTargets(word) {
    const pts = getPoints(word);
    const numPts = pts.length / 2;
    for (let i = 0; i < FIXED_N; i++) {
      // 多粒子堆叠同一目标点 → 文字加粗清晰
      const idx = (i % numPts) * 2;
      particles[i].tx = pts[idx];
      particles[i].ty = pts[idx + 1];
    }
  }

  // 状态机：CONVERGE(聚合) → HOLD(停留) → DISPERSE(缓散) → DRIFT(打乱) → CONVERGE(next)…
  // 同一批粒子永不清除，从上一个词的位置自然过渡到下一个词
  const STATE = { CONVERGE: 0, HOLD: 1, DISPERSE: 2, DRIFT: 3 };
  let state = STATE.CONVERGE;
  let wordIdx = 0;
  let stateTimer = 0;
  let wobbleAmp = 0; // 呼吸振幅（从 0 渐增，避免突跳）

  assignTargets(HERO_WORDS[0]);

  function drawHero(t) {
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.38;

    switch (state) {
      case STATE.CONVERGE: {
        // 弹簧向目标收敛
        for (const p of particles) {
          p.x += (p.tx - p.x) * p.ease;
          p.y += (p.ty - p.y) * p.ease;
          ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0.85)`;
          ctx.fillRect(p.x, p.y, p.sz, p.sz);
        }
        // 大部分到位 → 进入停留
        const settled = particles.filter(p =>
          Math.abs(p.tx - p.x) < 3 && Math.abs(p.ty - p.y) < 3
        ).length;
        if (settled > FIXED_N * 0.9) {
          state = STATE.HOLD;
          stateTimer = 0;
          wobbleAmp = 0; // 呼吸振幅从零开始
        }
        break;
      }

      case STATE.HOLD: {
        stateTimer++;
        // 呼吸振幅从 0 极缓增至 1.2px（完全无突跳）
        wobbleAmp = Math.min(1.2, stateTimer * 0.008);

        for (const p of particles) {
          const seed = p.ease * 100;
          const bx = p.tx + Math.sin(t * 0.0012 + seed) * wobbleAmp;
          const by = p.ty + Math.cos(t * 0.0009 + seed * 0.7) * wobbleAmp * 0.7;
          const [r, g, b] = p.color;
          const flicker = 0.82 + 0.18 * Math.sin(t * 0.003 + seed * 3);
          ctx.fillStyle = `rgba(${r},${g},${b},${flicker.toFixed(2)})`;
          ctx.fillRect(bx, by, p.sz, p.sz);
        }

        // 停留 ~2s 后 → 开始缓散
        if (stateTimer > 120) {
          state = STATE.DISPERSE;
          stateTimer = 0;
          // 给每个粒子一个从当前位置出发的缓慢漂移速度（一次赋值，非瞬移）
          for (const p of particles) {
            const dx = p.x - cx, dy = p.y - cy;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            // 外扩 + 随机扰动
            const speed = 0.3 + Math.random() * 0.4;
            p.vx = (dx/dist) * speed + (Math.random() - 0.5) * 0.6;
            p.vy = (dy/dist) * speed + (Math.random() - 0.5) * 0.6;
          }
        }
        break;
      }

      case STATE.DISPERSE: {
        // 缓散：粒子从文字位置向外慢慢漂走（无涡心瞬移）
        stateTimer++;
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.985; // 很慢的减速
          p.vy *= 0.985;

          // 加微弱 sin 扰动让漂移更有机
          const wobbleA = Math.sin(p.x * 0.008 + t * 0.0006) * 0.15;
          p.x += Math.cos(wobbleA) * 0.1;
          p.y += Math.sin(wobbleA) * 0.1;

          ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0.6)`;
          ctx.fillRect(p.x, p.y, p.sz, p.sz);
        }

        // 漂散 ~1s 后 → 进入打乱阶段
        if (stateTimer > 60) {
          state = STATE.DRIFT;
          stateTimer = 0;
          // 此时不做任何操作，粒子保持当前位置继续随机漂移
        }
        break;
      }

      case STATE.DRIFT: {
        // 打乱：粒子在当前位置附近自然游走（随机漫步），不受力
        stateTimer++;

        // 打乱进行到一半（~15 帧）时，静默切换到下一个词的目标
        // 粒子此时已散开，弹簧力会自然地将它们拉向新位置
        if (stateTimer === 20) {
          wordIdx = (wordIdx + 1) % HERO_WORDS.length;
          assignTargets(HERO_WORDS[wordIdx]);
        }

        for (const p of particles) {
          // 随机漫步（每个粒子独立扰动）
          p.x += (Math.random() - 0.5) * 0.8;
          p.y += (Math.random() - 0.5) * 0.8;

          // 20 帧后开始逐渐被新目标吸引（弹簧力渐增 → 无缝过渡）
          if (stateTimer > 20) {
            const attract = Math.min(1, (stateTimer - 20) / 20) * p.ease;
            p.x += (p.tx - p.x) * attract;
            p.y += (p.ty - p.y) * attract;
          }

          ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0.6)`;
          ctx.fillRect(p.x, p.y, p.sz, p.sz);
        }

        // 打乱 ~1s 后 → 正式进入聚合状态
        if (stateTimer > 55) {
          state = STATE.CONVERGE;
        }
        break;
      }
    }
  }

  function loop(t) {
    drawHero(t);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

// ── 水波纹 ──
function initRippleSystem() {
  const container = document.getElementById('rippleContainer');
  if (!container) return;

  document.addEventListener('click', e => {
    if (e.target.closest('a,button,input,textarea,select,.navbar,.card')) return;
    const el = document.createElement('div');
    el.className = 'ripple';
    el.style.cssText = `width:60px;height:60px;left:${e.clientX-30}px;top:${e.clientY-30}px;`+
      `transform:scale(1);opacity:1;transition:transform 1s ease-out,opacity 1s ease-out;position:absolute;border-radius:50%;`+
      `border:1px solid rgba(0,217,255,.3);pointer-events:none;`;
    container.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transform='scale(4)'; el.style.opacity='0';
    }));
    setTimeout(() => el.remove(), 1100);
  });
}

// ── 平滑滚动 ──
function initSmoothScroll(){
  document.querySelectorAll('.nav-menu a').forEach(link=>{
    link.addEventListener('click',e=>{
      e.preventDefault();
      const sel=link.getAttribute('href');
      const target=sel&&sel.startsWith('#')?document.querySelector(sel):null;
      if(target){
        const navH=document.querySelector('.navbar')?.offsetHeight||0;
        scrollTo({top:target.offsetTop-navH,behavior:'smooth'});
      }
    });
  });
  document.querySelector('.cta-button')?.addEventListener('click',e=>{
    e.preventDefault();
    document.querySelector('#projects')?.scrollIntoView({behavior:'smooth'});
  });
}

// ── 导航栏滚动效果 ──
window.addEventListener('scroll',()=>{
  document.querySelector('.navbar')?.classList.toggle('scrolled',scrollY>100);
},{passive:true});
// ── 原创 Skills 磁贴悬停提示 ──
(function skillTooltips() {
  const tiles = document.querySelectorAll('.skill-tile');
  if (!tiles.length) return;
  const tooltip = document.getElementById('skillTooltip');
  if (!tooltip) return;

  tiles.forEach(tile => {
    tile.addEventListener('mouseenter', e => {
      const desc = tile.dataset.desc || '';
      tooltip.textContent = desc;
      tooltip.classList.add('visible');
      // 简单跟随
      const move = ev => {
        tooltip.style.left = Math.min(ev.clientX + 16, innerWidth - 280) + 'px';
        tooltip.style.top = (ev.clientY + 16) + 'px';
      };
      move(e);
      tile.addEventListener('mousemove', move);
      tile.addEventListener('mouseleave', () => {
        tile.removeEventListener('mousemove', move);
        tooltip.classList.remove('visible');
      }, { once: true });
    });
  });
})();
