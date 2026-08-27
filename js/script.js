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
  const FIXED_N = 900; // 固定粒子池，永不增减

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
    const chars = [...text]; // 正确处理中文/emoji
    const maxW = W * 0.82;   // 左右留 9% 边距

    // ── 智能换行：先按固定比例估算初始字号，再用 measureText 迭代校准 ──
    // Step1: 找到能让全部文本放入单行的最大字号
    let fs = Math.min(maxW / Math.max(chars.length * (isCJKWord(text) ? 0.85 : 0.48), 1), H * 0.35);
    fs = Math.max(fs, 24);

    octx.font = `900 ${fs}px ${fonts}`;
    let measured = octx.measureText(text).width;
    if (measured > maxW) {
      fs *= maxW / measured;
      octx.font = `900 ${Math.round(fs)}px ${fonts}`;
    }

    // Step2: 判断是否需要换行（单行太小 < 36px 时，分两行让字更大）
    measured = octx.measureText(text).width;

    let lines, lineH;
    if (measured <= maxW) {
      // 单行就放得下且够大
      lines = [text];
      lineH = fs * 1.15;
    } else {
      // 单行放不下 → 二分法找两行放置的最佳字号
      // 第一行尽量多字符，第二行剩余
      for (let splitAt = Math.ceil(chars.length / 2); splitAt >= 1; splitAt--) {
        const l1 = chars.slice(0, splitAt).join('');
        const l2 = chars.slice(splitAt).join('');
        octx.font = `900 ${fs}px ${fonts}`;
        const w1 = octx.measureText(l1).width;
        const w2 = octx.measureText(l2).width;
        if (w1 <= maxW && w2 <= maxW && fs >= 24) {
          lines = [l1, l2];
          break;
        }
        // 两行也放不下 → 缩小字号重试这个分割点
        if (splitAt === 1) {
          fs *= Math.min(maxW / w1, maxW / w2) * 0.9;
          splitAt = Math.ceil(chars.length / 2); // 重试相同分割
          octx.font = `900 ${fs}px ${fonts}`;
        }
      }
      lineH = fs * 1.3;
    }

    // Step3: 绘制 + 采样（每行独立清屏，避免像素叠加）
    const startY = H * 0.36 - ((lines.length - 1) * lineH) / 2;
    const pts = [];
    for (let li = 0; li < lines.length; li++) {
      octx.clearRect(0, 0, W, H);
      octx.font = `900 ${Math.round(fs)}px ${fonts}`;
      octx.fillStyle = '#fff';
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillText(lines[li], W / 2, startY + li * lineH);

      const imgData = octx.getImageData(0, 0, W, H).data;
      const step = Math.max(2, Math.floor(fs / 40));
      for (let py = 0; py < H; py += step)
        for (let px = 0; px < W; px += step)
          if (imgData[(py * W + px) * 4 + 3] > 60) pts.push(px, py);
    }
    return pts;

    function isCJKWord(t) { return /[\u4e00-\u9fff]/.test(t); }
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