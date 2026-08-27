// 背景粒子 — 全屏流动粒子层，z-index 置于内容之下
(function() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ~300 粒子，多色系
  const COLORS = [
    [0,217,255],   // cyan
    [108,92,231],  // purple
    [255,107,107], // coral
    [72,219,133],  // green
    [254,202,87],  // gold
    [159,122,237], // violet
  ];
  const N = 300;
  const P = [];
  for (let i = 0; i < N; i++) {
    P.push({
      x: Math.random()*W,
      y: Math.random()*H,
      vx: (Math.random()-0.5)*0.3,
      vy: (Math.random()-0.5)*0.3,
      sz: 0.8 + Math.random()*2,
      c: COLORS[Math.floor(Math.random()*COLORS.length)],
      phase: Math.random()*Math.PI*2,
      speed: 0.5+Math.random()*0.8,
    });
  }

  const mouse = {x:-9999,y:-9999};
  addEventListener('mousemove', e => { mouse.x=e.clientX; mouse.y=e.clientY; });

  function draw(t) {
    ctx.clearRect(0,0,W,H);

    for (const p of P) {
      // sin/cos 流场
      const s=0.002;
      const angle=(Math.sin(p.x*s+t*0.0003)+Math.cos(p.y*s+t*0.0004))*Math.PI;
      p.vx+=Math.cos(angle)*p.speed*0.01;
      p.vy+=Math.sin(angle)*p.speed*0.01;
      p.vx*=0.985;p.vy*=0.985;
      p.x+=p.vx;p.y+=p.vy;

      if(p.x<-5)p.x=W+5;if(p.x>W+5)p.x=-5;
      if(p.y<-5)p.y=H+5;if(p.y>H+5)p.y=-5;

      // 鼠标排斥
      const dx=p.x-mouse.x,dy=p.y-mouse.y;
      const d2=dx*dx+dy*dy;
      if(d2<6000){
        const d=Math.sqrt(d2)||1;
        p.x+=dx/d*(1-d/77)*2;
        p.y+=dy/d*(1-d/77)*2;
      }

      // 发光粒子
      const flicker=0.35+0.3*Math.sin(t*0.001+p.phase);
      const [r,g,b]=p.c;
      ctx.fillStyle=`rgba(${r},${g},${b},${flicker.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.sz,0,6.283);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
// ── 电网电流效果 ──
(function electricGrid() {
  const layer = document.getElementById('electricLayer');
  if (!layer) return;

  // 随机生成一条电流线
  function spawnLine() {
    const el = document.createElement('div');
    const isVertical = Math.random() > 0.5;
    el.className = 'electric-line' + (isVertical ? ' vertical' : '');

    // 对齐到 60px 网格线
    if (isVertical) {
      el.style.left = Math.floor(Math.random() * 20) * 60 + 'px';
      el.style.animationName = 'electric-flow-v';
    } else {
      el.style.top = Math.floor(Math.random() * 15) * 60 + 'px';
    }

    // 随机时长和延迟
    el.style.animationDuration = (2 + Math.random() * 3) + 's';
    el.style.animationDelay = Math.random() * 2 + 's';

    layer.appendChild(el);

    // 动画结束后移除
    const total = parseFloat(el.style.animationDuration) * 1000 +
                  parseFloat(el.style.animationDelay) * 1000 + 500;
    setTimeout(() => el.remove(), total);
  }

  // 初始生成几条
  for (let i = 0; i < 6; i++) setTimeout(spawnLine, i * 800);

  // 持续随机生成
  setInterval(() => {
    if (document.visibilityState === 'visible' && Math.random() > 0.3) {
      spawnLine();
    }
  }, 1500);
})();
