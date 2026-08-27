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
  const FIXED_N = 5000;
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
      sz: 2.2 + Math.random() * 2.0,   // 更大 → 文字笔画粗实
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
    // 目标中心：水平居中，垂直稍偏上（给底部按钮留空间但不大）
    const targetCX = W / 2;
    const targetCY = H * 0.46;

    // 放宽尺寸限制：宽度 92%、高度 60%（充分利用屏幕空间）
    let lo = 20, hi = Math.min(W * 0.94, H * 0.68);
    let bestFs = lo;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      drawAt(mid, targetCX, targetCY);
      const bb = scanBBox();

      // 只保留左右 4%、上下 10% 的边距
      const fits =
        bb.minX >= W * 0.03 && bb.maxX <= W * 0.97 &&
        bb.minY >= H * 0.02 && bb.maxY <= H * 0.85;

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

  // ── Curl noise 流场（用于消散阶段的有机运动）──
  function h2(x, y) {
    return (Math.sin(x * 127.1 + y * 311.7) * 43758.5453 % 1 + 1) % 1;
  }
  function n2(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    return h2(ix,iy)*(1-ux)*(1-uy)+h2(ix+1,iy)*ux*(1-uy)
         + h2(ix,iy+1)*(1-ux)*uy+h2(ix+1,iy+1)*ux*uy;
  }
  function curlFx(x, y, t) {
    const e = 0.4;
    return (n2(x, y + e + t) - n2(x, y - e + t)) / (2 * e);
  }
  function curlFy(x, y, t) {
    const e = 0.4;
    return -(n2(x + e, y + t) - n2(x - e, y + t)) / (2 * e);
  }

  // 状态机（单一流：morphing 持续运行，无"定格"概念）
  // 每个粒子有独立的 delay → 错峰聚合/散开，像风吹散墨迹
  const STATE = { FORM: 0, HOLD: 1, SCATTER: 2 };
  let state = STATE.FORM;
  let wordIdx = 0;
  let stateTimer = 0;

  // 给每个粒子分配错峰延迟（0~50 帧），散开和聚合都按 delay 错开
  for (const p of particles) {
    p.delay = Math.floor(Math.random() * 50);
    p.stiffness = 0.015 + Math.random() * 0.04; // 可变弹簧刚度 → 到达速度不同
    p.dampV = 0.90 + Math.random() * 0.06;     // 可变阻尼
  }

  assignTargets(HERO_WORDS[0]);

  function drawHero(t) {
    ctx.clearRect(0, 0, W, H);
    const flowT = t * 0.0002;

    switch (state) {
      case STATE.FORM: {
        stateTimer++;
        // 可聚合的粒子数（按 delay 错峰解锁）
        const unlocked = Math.min(FIXED_N, stateTimer * (FIXED_N / 45));

        // 后期冲刺：时间过半后弹簧力倍增，确保所有粒子精确归位
        const sprint = stateTimer > 60 ? 1 + (stateTimer - 60) * 0.06 : 1;

        for (let i = 0; i < FIXED_N; i++) {
          const p = particles[i];

          if (i < unlocked) {
            // 距离目标的偏差
            const dx = p.tx - p.x;
            const dy = p.ty - p.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < 4) {
              // 距离 <2px：直接吸附锁定（消除毛躁边缘）
              p.x = p.tx;
              p.y = p.ty;
            } else {
              // 可变刚度弹簧 × sprint 加速 × curl 微扰（前 40 帧渐减）
              const wob = curlFx(p.x * 0.004, p.y * 0.004, flowT) * 0.4;
              const wob2 = curlFy(p.x * 0.004, p.y * 0.004, flowT) * 0.4;
              const curlFade = Math.max(0, 1 - stateTimer / 40);
              const e = Math.min(0.5, p.stiffness * sprint); // 上限 0.5 防过冲
              p.x += dx * e + wob * curlFade;
              p.y += dy * e + wob2 * curlFade;
            }
          }
          ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0.8)`;
          ctx.fillRect(p.x, p.y, p.sz, p.sz);
        }

        // 全部粒子到达（渐近判定：时间够长即视为完成，不做 settled 检查避免状态跳变）
        if (stateTimer > 130) {
          state = STATE.HOLD;
          stateTimer = 0;
        }
        break;
      }

      case STATE.HOLD: {
        stateTimer++;

        for (const p of particles) {
          // 微呼吸
          const bx = p.x + Math.sin(t * 0.0015 + p.stiffness * 500) * 0.6;
          const by = p.y + Math.cos(t * 0.0012 + p.stiffness * 300) * 0.5;
          ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0.8)`;
          ctx.fillRect(bx, by, p.sz, p.sz);
        }

        // 停留 ~1.8s → 散开（在进入 SCATTER 前不赋速度，SCATTER 内按 delay 错峰赋）
        if (stateTimer > 110) {
          state = STATE.SCATTER;
          stateTimer = 0;
          // 为每个粒子准备散开方向（但不是现在就动——等 delay 解锁后才动）
          for (const p of particles) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 0.4 + Math.random() * 0.8;
            p.vx = Math.cos(ang) * spd;
            p.vy = Math.sin(ang) * spd - 0.1; // 微上飘
          }
        }
        break;
      }

      case STATE.SCATTER: {
        stateTimer++;

        // 散开到 65% 时切换下一个词的目标
        if (stateTimer === 50) {
          wordIdx = (wordIdx + 1) % HERO_WORDS.length;
          assignTargets(HERO_WORDS[wordIdx]);
        }

        // 65 帧后弹簧力渐增（和散开惯性叠加 → 平滑转向聚合）
        const attractRamp = stateTimer > 65 ? Math.min(1, (stateTimer - 65) / 50) : 0;

        for (let i = 0; i < FIXED_N; i++) {
          const p = particles[i];

          // 按 delay 错峰散开（前 delay 帧保持不动 → 文字逐渐"融化"而非撕裂）
          if (stateTimer > p.delay) {
            // curl noise 流场驱动 → 有机多变轨迹，非直线
            const fx = curlFx(p.x * 0.005, p.y * 0.005, flowT) * 0.8;
            const fy = curlFy(p.x * 0.005, p.y * 0.005, flowT) * 0.8;
            p.vx = p.vx * 0.96 + fx * 0.15;
            p.vy = p.vy * 0.96 + fy * 0.15;
            p.x += p.vx;
            p.y += p.vy;

            // 弹簧力渐增后开始拉向新目标（与流场叠加）
            if (attractRamp > 0) {
              p.x += (p.tx - p.x) * p.stiffness * attractRamp;
              p.y += (p.ty - p.y) * p.stiffness * attractRamp;
              // 后半段衰减惯性速度 → 让粒子最终能被弹簧精确拉到位
              p.vx *= 0.90;
              p.vy *= 0.90;
            }
          }

          ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0.8)`;
          ctx.fillRect(p.x, p.y, p.sz, p.sz);
        }

        // 散开+转向 ~3s 后 → 进入 FORM（弹簧力已是全力，无缝继续聚合）
        if (stateTimer > 170) {
          state = STATE.FORM;
          stateTimer = 45; // FORM 前 45 帧的 unlock 已覆盖全部粒子，直接全力聚合
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
