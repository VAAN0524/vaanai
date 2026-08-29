/**
 * 背景层 — 网格 + 电流 + 流动粒子（统一 Canvas 绘制）
 *
 * 替换 CSS .bg-grid：Canvas 画网格线（可对齐）+ 沿网格线流动的电流脉冲 + 粒子
 */
(function() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  // 网格间距（跟 CSS .bg-grid 一致）
  const GRID = 60;
  // 网格整体移动偏移量（跟 CSS grid-move 30s 循环一致）
  let gridOffset = 0;

  function resize() {
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── 电流脉冲：沿网格线流动的发光段 ──
  const pulses = [];
  function spawnPulse() {
    const isH = Math.random() > 0.5;
    // 对齐到网格线（整数倍 GRID）
    const lineIdx = Math.floor(Math.random() * (isH ? H / GRID : W / GRID));
    const linePos = lineIdx * GRID;

    pulses.push({
      isH,          // true=水平线, false=垂直线
      linePos,      // 网格线坐标
      pos: Math.random() > 0.5 ? -80 : (isH ? W + 80 : H + 80), // 起始位置
      speed: 3 + Math.random() * 5,
      len: 40 + Math.random() * 120,  // 脉冲段长度
      hue: Math.random() > 0.5 ? 'rgba(0,217,255,' : 'rgba(159,122,237,',
      maxAlpha: 0.5 + Math.random() * 0.4,
      dir: Math.random() > 0.5 ? 1 : -1, // 正向或反向流动
    });
  }

  function drawPulses() {
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      p.pos += p.speed * p.dir;

      // 出屏移除
      const limit = p.isH ? W + p.len : H + p.len;
      if (p.dir > 0 && p.pos > limit) { pulses.splice(i, 1); continue; }
      if (p.dir < 0 && p.pos < -p.len) { pulses.splice(i, 1); continue; }

      // 绘制发光脉冲段（沿网格线方向）
      const grad = ctx.createLinearGradient(
        p.isH ? p.pos - p.len : p.linePos,
        p.isH ? p.linePos : p.pos - p.len,
        p.isH ? p.pos : p.linePos,
        p.isH ? p.linePos : p.pos
      );
      grad.addColorStop(0, p.hue + '0)');
      grad.addColorStop(0.5, p.hue + p.maxAlpha + ')');
      grad.addColorStop(1, p.hue + '0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.beginPath();

      if (p.isH) {
        // 水平网格线上的脉冲
        const y = p.linePos + gridOffset;
        ctx.moveTo(p.pos - p.len, y);
        ctx.lineTo(p.pos, y);
      } else {
        // 垂直网格线上的脉冲
        const x = p.linePos + gridOffset;
        ctx.moveTo(x, p.pos - p.len);
        ctx.lineTo(x, p.pos);
      }
      ctx.stroke();
    }

    // 维持一定数量的脉冲
    if (pulses.length < 5 && Math.random() > 0.95) spawnPulse();
  }

  // ── 网格线绘制 ──
  function drawGrid() {
    // 缓慢移动偏移（和 CSS grid-move 30s 循环一致）
    gridOffset = (gridOffset + 0.033) % GRID;

    ctx.strokeStyle = 'rgba(0,217,255,0.04)';
    ctx.lineWidth = 0.5;

    for (let x = -GRID + gridOffset; x < W + GRID; x += GRID) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = -GRID + gridOffset; y < H + GRID; y += GRID) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // 交点微光
    ctx.fillStyle = 'rgba(0,217,255,0.06)';
    for (let x = -GRID + gridOffset; x < W + GRID; x += GRID) {
      for (let y = -GRID + gridOffset; y < H + GRID; y += GRID) {
        ctx.fillRect(x - 0.5, y - 0.5, 1.5, 1.5);
      }
    }
  }

  // ── 流动粒子 ──
  const COLORS = [
    [0,217,255],[108,92,231],[255,107,107],
    [72,219,133],[254,202,87],[159,122,237],
  ];
  const N = 300;
  const P = [];
  for (let i = 0; i < N; i++) {
    P.push({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3,
      sz: 0.8 + Math.random()*2,
      c: COLORS[Math.floor(Math.random()*COLORS.length)],
      phase: Math.random()*Math.PI*2,
      speed: 0.5+Math.random()*0.8,
    });
  }

  const mouse = {x:-9999,y:-9999};
  addEventListener('mousemove', e => { mouse.x=e.clientX; mouse.y=e.clientY; });

  function drawParticles(t) {
    for (const p of P) {
      const s=0.002;
      const angle=(Math.sin(p.x*s+t*0.0003)+Math.cos(p.y*s+t*0.0004))*Math.PI;
      p.vx+=Math.cos(angle)*p.speed*0.01;
      p.vy+=Math.sin(angle)*p.speed*0.01;
      p.vx*=0.985;p.vy*=0.985;
      p.x+=p.vx;p.y+=p.vy;
      if(p.x<-5)p.x=W+5;if(p.x>W+5)p.x=-5;
      if(p.y<-5)p.y=H+5;if(p.y>H+5)p.y=-5;
      const dx=p.x-mouse.x,dy=p.y-mouse.y;
      const d2=dx*dx+dy*dy;
      if(d2<6000){
        const d=Math.sqrt(d2)||1;
        p.x+=dx/d*(1-d/77)*2;
        p.y+=dy/d*(1-d/77)*2;
      }
      const flicker=0.35+0.3*Math.sin(t*0.001+p.phase);
      const [r,g,b]=p.c;
      ctx.fillStyle=`rgba(${r},${g},${b},${flicker.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.sz,0,6.283);
      ctx.fill();
    }
  }

  // ── 主循环（支持模态打开时暂停，让出合成资源防卡顿）──
  let animPaused = false
  let rafId = 0

  function draw(t) {
    if (animPaused) return
    ctx.clearRect(0,0,W,H);
    drawGrid();       // 网格线（移动）
    drawPulses();     // 电流脉冲（沿网格线流动）
    drawParticles(t); // 流动粒子
    rafId = requestAnimationFrame(draw);
  }

  window.addEventListener('vaanai:pause-animations', () => {
    animPaused = true
    cancelAnimationFrame(rafId)
  })
  window.addEventListener('vaanai:resume-animations', () => {
    if (animPaused) {
      animPaused = false
      rafId = requestAnimationFrame(draw)
    }
  })

  // 初始几个脉冲
  for (let i = 0; i < 8; i++) spawnPulse();
  requestAnimationFrame(draw);
})();