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

// ── Hero 粒子循环轮播 ──
const HERO_WORDS = [
  'Vaan',
  'AI Builder',
  '数字造物者',
  '518 Skills',
  '用代码构建',
  '28 Projects',
  '从粒子到现实',
  '开 源 · 分 享',
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

  const COLORS = [[0,217,255],[108,92,231],[247,148,161],[255,202,87],[72,219,133],[159,122,237]];

  // 自适应采样指定文字的像素点
  function getPoints(text) {
    const offc = document.createElement('canvas');
    offc.width = W; offc.height = H;
    const octx = offc.getContext('2d');

    const isCJK = /[\u4e00-\u9fff]/.test(text);
    let fontSize = Math.min(
      W * 0.85 / Math.max(text.length * (isCJK ? 0.9 : 0.55), 1),
      H * 0.42
    );
    fontSize = Math.max(fontSize, 80);
    octx.font = `900 ${fontSize}px -apple-system,"PingFang SC","STXingkai",sans-serif`;
    octx.fillStyle = '#fff';
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    // 文字中心点偏上（给底部按钮留空间）
    octx.fillText(text, W / 2, H * 0.38);
    const imgData = octx.getImageData(0, 0, W, H).data;

    // 自适应步长，保持总点数在 600~1500 之间
    let step = 3;
    let pts = [];
    do {
      pts = [];
      for (let y = 0; y < H; y += step)
        for (let x = 0; x < W; x += step)
          if (imgData[(y * W + x) * 4 + 3] > 100) pts.push(x, y);
      if (pts.length / 2 > 1500) step++;
    } while (pts.length / 2 > 1500 && step < 20);

    return pts;
  }

  // 状态机
  const STATE = { FORMING: 0, HOLDING: 1, DISSOLVING: 2, GAP: 3 };
  let state = STATE.FORMING;
  let wordIdx = 0;
  let holdTimer = 0;
  let gapTimer = 0;
  let particles = [];
  let globalAlpha = 0;

  function spawnFor(word) {
    const pts = getPoints(word);
    particles = [];
    for (let i = 0; i < pts.length; i += 2) {
      particles.push({
        cx: Math.random() * W,
        cy: Math.random() * H,
        tx: pts[i],
        ty: pts[i+1],
        ease: 0.03 + Math.random() * 0.04,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        sz: 1 + Math.random() * 1.5,
      });
    }
    globalAlpha = 0;
  }

  function drawHero(t) {
    ctx.clearRect(0, 0, W, H);

    switch(state) {
      case STATE.FORMING: {
        globalAlpha = Math.min(1, globalAlpha + 0.02);
        let allArrived = true;
        for (const p of particles) {
          p.cx += (p.tx - p.cx) * p.ease;
          p.cy += (p.ty - p.cy) * p.ease;
          p.ease *= 1.008;
          if (Math.abs(p.tx-p.cx)>1 || Math.abs(p.ty-p.cy)>1) allArrived = false;
          const [r,g,b] = p.color;
          ctx.fillStyle = `rgba(${r},${g},${b},${(globalAlpha*0.85).toFixed(2)})`;
          ctx.fillRect(p.cx, p.cy, p.sz, p.sz);
        }
        if (allArrived) { state = STATE.HOLDING; holdTimer = 0; }
        break;
      }
      case STATE.HOLDING: {
        holdTimer++;
        // 微微浮动
        const breatheAmp = 0.8;
        for (const p of particles) {
          const bx = p.tx + Math.sin(t*0.001 + p.ease*100)*breatheAmp;
          const by = p.ty + Math.cos(t*0.001 + p.ease*50)*breatheAmp;
          const [r,g,b] = p.color;
          const flicker = 0.7 + 0.3*Math.sin(t*0.002 + p.ease*200);
          ctx.fillStyle = `rgba(${r},${g},${b},${(globalAlpha*flicker).toFixed(2)})`;
          ctx.fillRect(bx, by, p.sz, p.sz);
        }
        if (holdTimer > 120) { // ~2 秒
          state = STATE.DISSOLVING;
          // 给每个粒子随机逃逸方向
          for (const p of particles) {
            p.ex = p.tx + (Math.random()-0.5)*W*1.2;
            p.ey = p.ty + (Math.random()>0.5 ? 1 : -1) * H * Math.random();
            p.dEase = 0.01 + Math.random()*0.02;
          }
        }
        break;
      }
      case STATE.DISSOLVING: {
        globalAlpha -= 0.015;
        for (const p of particles) {
          p.cx += (p.ex - p.cx) * p.dEase;
          p.cy += (p.ey - p.cy) * p.dEase;
          const [r,g,b] = p.color;
          ctx.fillStyle = `rgba(${r},${g},${b},${Math.max(0,globalAlpha).toFixed(2)})`;
          ctx.fillRect(p.cx, p.cy, p.sz, p.sz);
        }
        if (globalAlpha <= 0) {
          state = STATE.GAP;
          gapTimer = 0;
          particles = [];
        }
        break;
      }
      case STATE.GAP: {
        gapTimer++;
        if (gapTimer > 30) { // 0.5s 空白间隔
          wordIdx = (wordIdx + 1) % HERO_WORDS.length;
          spawnFor(HERO_WORDS[wordIdx]);
          state = STATE.FORMING;
        }
        break;
      }
    }
  }

  // 启动循环
  spawnFor(HERO_WORDS[0]);

  function loop(t) {
    resize_if_needed();
    drawHero(t);
    requestAnimationFrame(loop);
  }

  let lastW = W, lastH = H;
  function resize_if_needed() {
    if (canvas.parentElement.offsetWidth !== lastW || canvas.parentElement.offsetHeight !== lastH) {
      resize();
      lastW = W; lastH = H;
      spawnFor(HERO_WORDS[wordIdx]); // resize 后重新生成当前词
      state = STATE.FORMING;
      globalAlpha = 0;
    }
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