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

  heroParticleName();
  animateCounters();
  initRippleSystem();
  initMessageSystem();
  initSmoothScroll();
});

// ── Hero 粒子文字显现 ──
function heroParticleName() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const heroEl = canvas.closest('.hero') || canvas.parentElement;
  const W = canvas.width = heroEl.offsetWidth;
  const H = canvas.height = heroEl.offsetHeight;

  const text = 'Vaan';
  const fontSize = Math.min(W * 0.18, H * 0.35, 180);

  // 离屏渲染文字获取像素采样点
  const offc = document.createElement('canvas');
  offc.width = W; offc.height = H;
  const octx = offc.getContext('2d');
  octx.font = `900 ${fontSize}px -apple-system,sans-serif`;
  octx.fillStyle = '#fff';
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  octx.fillText(text, W / 2, H / 2);
  const imgData = octx.getImageData(0, 0, W, H).data;

  // 自适应步长确保总点数在合理范围
  let step = 4;
  let pts = [];
  do {
    pts = [];
    for (let y = 0; y < H; y += step)
      for (let x = 0; x < W; x += step)
        if (imgData[(y * W + x) * 4 + 3] > 128) pts.push(x, y);
    step++;
  } while (pts.length / 2 > 1200);

  // 粒子从随机位置飞向文字位置
  const particles = [];
  const COLORS = [[0,217,255],[108,92,231],[247,148,161],[255,202,87],[72,219,133]];
  for (let i = 0; i < pts.length; i += 2) {
    particles.push({
      sx: Math.random() * W,
      sy: Math.random() * H,
      tx: pts[i],
      ty: pts[i+1],
      cx: 0, cy: 0,   // current
      ease: 0.04 + Math.random() * 0.05,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      arrived: false,
    });
  }

  let frame = 0;
  const MAX_FRAMES = 200;
  let fadeOut = false;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    frame++;

    let allArrived = true;
    for (const p of particles) {
      if (!p.arrived) {
        p.cx += (p.tx - p.cx) * p.ease;
        p.cy += (p.ty - p.cy) * p.ease;
        p.ease *= 1.005; // 加速
        if (Math.abs(p.tx - p.cx) < 1 && Math.abs(p.ty - p.cy) < 1) p.arrived = true;
        allArrived = false;
      } else {
        p.cx += (p.tx - p.cx); // stay
        p.cy += (p.ty - p.cy);
      }

      const [r,g,b] = p.color;
      const alpha = p.arrived ? 0.9 : 0.5;
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fillRect(p.cx, p.cy, 2, 2);
    }

    // 到位后短暂停留，然后淡出让 HTML 文字接管
    if ((allArrived && frame > 60) || frame > MAX_FRAMES) {
      if (!fadeOut) {
        fadeOut = true;
        // 渐隐粒子
        let opacity = 1;
        const fade = () => {
          opacity -= 0.02;
          ctx.clearRect(0, 0, W, H);
          ctx.globalAlpha = Math.max(0, opacity);
          for (const p of particles) {
            const [r,g,b] = p.color;
            ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
            ctx.fillRect(p.cx, p.cy, 2, 2);
          }
          ctx.globalAlpha = 1;
          if (opacity > 0) requestAnimationFrame(fade);
        };
        fade();
        return;
      }
    }

    if (!fadeOut) requestAnimationFrame(draw);
  }

  draw();
}

// ── 数字滚动动画 ──
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseInt(el.dataset.count);
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = Math.floor(current).toLocaleString();
    }, 30);
  });
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