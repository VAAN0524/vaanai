// Vaan 个人主页 v3.0 — 粒子主题
let messages = [];

document.addEventListener('DOMContentLoaded', () => {
  // Lucide icons（defer 加载可能未就绪）
  const initIcons = () => {
    if (typeof lucide !== 'undefined') { lucide.createIcons(); }
    else setTimeout(initIcons, 100);
  };
  initIcons();

  if (typeof CloudflareMessageSync !== 'undefined') {
    window.messageSync = new CloudflareMessageSync();
  }

  initHeroParticles();
  initRippleSystem();
  initMessageSystem();
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

  // 状态机：CONVERGE → HOLD → SWIRL → CONVERGE(next) …
  const STATE = { CONVERGE: 0, HOLD: 1, SWIRL: 2 };
  let state = STATE.CONVERGE;
  let wordIdx = 0;
  let holdTimer = 0;

  assignTargets(HERO_WORDS[0]);

  function drawHero(t) {
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.38;

    switch (state) {
      case STATE.CONVERGE: {
        // 弹簧向目标收敛，全透明度不衰减
        for (const p of particles) {
          p.x += (p.tx - p.x) * p.ease;
          p.y += (p.ty - p.y) * p.ease;
          p.vx *= 0.90; p.vy *= 0.90;

          const [r, g, b] = p.color;
          ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
          ctx.fillRect(p.x, p.y, p.sz, p.sz);
        }
        // 检查是否全部到位
        const settled = particles.filter(p =>
          Math.abs(p.tx - p.x) < 2 && Math.abs(p.ty - p.y) < 2
        ).length;
        if (settled > FIXED_N * 0.92) { state = STATE.HOLD; holdTimer = 0; }
        break;
      }

      case STATE.HOLD: {
        holdTimer++;
        // 呼吸浮动
        for (const p of particles) {
          const bx = p.tx + Math.sin(t * 0.001 + p.ease * 100) * 0.8;
          const by = p.ty + Math.cos(t * 0.0008 + p.ease * 50) * 0.8;
          const [r, g, b] = p.color;
          const flicker = 0.75 + 0.25 * Math.sin(t * 0.003 + p.ease * 200);
          ctx.fillStyle = `rgba(${r},${g},${b},${flicker.toFixed(2)})`;
          ctx.fillRect(bx, by, p.sz, p.sz);
        }
        if (holdTimer > 110) { // ~1.8s
          state = STATE.SWIRL;
          // 给每个粒子混乱旋转中心
          for (const p of particles) {
            p.swirlCxA = cx + (Math.random() - 0.5) * W * 0.3;
            p.swirlCyA = cy + (Math.random() - 0.5) * H * 0.3;
            p.swirlDir = Math.random() > 0.5 ? 1 : -1;
          }
        }
        break;
      }

      case STATE.SWIRL: {
        // 混乱旋涡：每个粒子绕自己的涡心旋转，逐渐扩散
        holdTimer++;
        for (const p of particles) {
          p.swirlA += p.swirlSpd * p.swirlDir;
          p.swirlR *= 1.015; // 缓慢膨胀

          // 计算当前位置（从上一个位置自然过渡到涡旋轨道）
          p.tx = p.swirlCxA + Math.cos(p.swirlA) * p.swirlR;
          p.ty = p.swirlCyA + Math.sin(p.swirlA) * p.swirlR;

          p.x += (p.tx - p.x) * 0.06; // 快速跟随
          p.y += (p.ty - p.y) * 0.06;

          const [r, g, b] = p.color;
          const alpha = Math.min(0.8, 0.5 + holdTimer * 0.002);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
          ctx.fillRect(p.x, p.y, p.sz, p.sz);
        }

        // 混乱 ~0.7s 后切换目标到下一个词，开始重新聚合
        if (holdTimer > 42) {
          wordIdx = (wordIdx + 1) % HERO_WORDS.length;
          assignTargets(HERO_WORDS[wordIdx]);
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

// ── 留言系统（保持原有逻辑）──
function initMessageSystem() {
  const form=document.getElementById('messageForm');
  const list=document.getElementById('messageList');
  const nameInput=document.getElementById('name');
  const textInput=document.getElementById('messageText');
  if(!form||!list||!nameInput||!textInput)return;

  const fmt=d=>new Date(d).toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
  const esc=s=>{const d=document.createElement('div');d.textContent=s;return d.innerHTML;};
  const toast=(text,type='info')=>{
    const t=document.createElement('div');
    t.style.cssText=`position:fixed;top:90px;right:20px;padding:16px 24px;border-radius:12px;`+
      `background:#2d3436;color:#dfe6e9;font-weight:500;z-index:9999;max-width:300px;word-break:break-word;`+
      `box-shadow:8px 8px 16px #25292a,-8px -8px 16px #4a5052;`+
      `border-left:4px solid ${({success:'#10b981',error:'#ef4444',info:'#74b9ff'})[type]||'#74b9ff'};`+
      `opacity:0;transform:translateX(100%);transition:.3s`;
    t.textContent=text;document.body.appendChild(t);
    requestAnimationFrame(()=>{t.style.opacity='1';t.style.transform='translateX(0)'});
    setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(100%)';setTimeout(()=>t.remove(),300)},3000);
  };

  function render(){
    list.innerHTML='';
    if(!messages.length){
      list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--text-muted)">暂无留言</div>';return;}
    [...messages].reverse().forEach(m=>{
      const div=document.createElement('div');
      div.className='message-item';
      div.innerHTML=`
        <div class="message-header">
          <div class="message-author-info">
            <div class="message-avatar"><i data-lucide="user"></i></div>
            <div><div class="message-author">${esc(m.name)}</div>
            <div class="message-time">${m.time||fmt(Date.now())}</div></div>
          </div>
          <div class="message-location"><i data-lucide="map-pin"></i>${esc(m.location||'未知')}</div>
        </div>
        <p class="message-text">${esc(m.text)}</p>`;
      list.appendChild(div);
    });
    typeof lucide!=='undefined'&&lucide.createIcons();
  }

  async function getLocation(){
    try{
      const r=await fetch('https://ipapi.co/json/',{signal:AbortSignal.timeout(3000),mode:'cors'});
      if(r.ok){const d=await r.json();return d.city?`${d.city}, ${d.country_name}`:d.country_name||'未知地区';}
    }catch(_){}
    return '未知地区';
  }

  [['name','nameCounter',20],['messageText','messageTextCounter',500]].forEach(([inId,cId,max])=>{
    const inp=document.getElementById(inId),cnt=document.getElementById(cId);
    if(!inp||!cnt)return;
    inp.addEventListener('input',()=>{
      cnt.textContent=inp.value.length;
      cnt.style.color=inp.value.length>=max?'#ef4444':inp.value.length>=max*0.8?'#f59e0b':'#95a5a6';
    });
  });

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const name=nameInput.value.trim(),text=textInput.value.trim();
    const btn=form.querySelector('[type=submit]');
    if(!name){toast('请输入昵称','error');return;}
    if(!text){toast('请输入留言','error');return;}

    btn.disabled=true;btn.innerHTML='<span>提交中…</span>';
    try{
      const location=await getLocation();
      const msg={id:Date.now(),name,text,time:fmt(Date.now()),location};
      let ok=false;
      if(window.messageSync){
        const result=await window.messageSync.saveMessage(msg);ok=result.success;
      }else ok=true;
      if(ok){
        messages.push(msg);
        localStorage.setItem('messages',JSON.stringify(messages));
        render();toast('留言已保存！','success');
        nameInput.value='';textInput.value='';
        nameInput.dispatchEvent(new Event('input'));textInput.dispatchEvent(new Event('input'));
      }else toast('保存失败，请重试','error');
    }catch(err){toast('提交失败','error')}
    finally{
      btn.disabled=false;btn.innerHTML='<span>发送</span>';
      typeof lucide!=='undefined'&&lucide.createIcons();
    }
  });

  async function load(){
    try{
      if(window.messageSync){
        try{messages=await window.messageSync.getMessages(true)}catch(e){}
      }
      if(!messages.length){
        const stored=localStorage.getItem('messages');
        if(stored){try{messages=JSON.parse(stored).filter(m=>m.id&&m.name&&m.text)}catch(_){}}
      }
      if(!messages.length)
        messages=[{id:1,name:'系统',text:'欢迎留言！',time:fmt(Date.now()),location:'线上'}];
      render();
    }catch(e){render()}
  }
  load();
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