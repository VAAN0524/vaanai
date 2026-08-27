// Vaan 个人主页 v2.0 — 优化版

let messages = [];

document.addEventListener('DOMContentLoaded', () => {
    // Lucide 用 defer 加载，DOM ready 时可能还未就绪
    const initIcons = () => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        } else {
            setTimeout(initIcons, 100);
        }
    };
    initIcons();

    if (typeof CloudflareMessageSync !== 'undefined') {
        window.messageSync = new CloudflareMessageSync();
    }

    initRippleSystem();
    initMessageSystem();
    initScrollEffects();
    initSmoothScroll();
});

// ── 水波纹（合并为单 rAF 循环 + DOM 复用）──
function initRippleSystem() {
    const container = document.getElementById('rippleContainer');
    if (!container) return;

    const ripples = [];

    document.addEventListener('click', e => {
        if (e.target.closest('a,button,input,textarea,select,nav,footer,.navbar,.card')) return;

        const el = document.createElement('div');
        el.className = 'ripple';
        el.style.width = el.style.height = '60px';
        el.style.left = (e.clientX - 30) + 'px';
        el.style.top = (e.clientY - 30) + 'px';
        el.style.transform = 'scale(1)';
        el.style.opacity = '1';
        el.style.transition = 'transform 1s ease-out, opacity 1s ease-out';
        container.appendChild(el);

        // 触发过渡（下一帧才设置目标值）
        requestAnimationFrame(() => requestAnimationFrame(() => {
            el.style.transform = 'scale(4)';
            el.style.opacity = '0';
        }));

        setTimeout(() => el.remove(), 1100);
    });
}

// ── 留言系统 ──
function initMessageSystem() {
    const form = document.getElementById('messageForm');
    const list = document.getElementById('messageList');
    const nameInput = document.getElementById('name');
    const textInput = document.getElementById('messageText');

    if (!form || !list || !nameInput || !textInput) return;

    const formatDate = d => new Date(d).toLocaleString('zh-CN', { year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit' });

    const escapeHtml = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

    function toast(text, type = 'info') {
        const t = document.createElement('div');
        t.className = 'toast';
        t.style.cssText = `position:fixed;top:90px;right:20px;padding:16px 24px;border-radius:12px;`+
          `background:#2d3436;color:#dfe6e9;font-weight:500;z-index:9999;max-width:300px;`+
          `box-shadow:8px 8px 16px #25292a,-8px -8px 16px #4a5052;border-left:4px solid ${({success:'#10b981',error:'#ef4444',info:'#74b9ff'})[type]||'#74b9ff'};`+
          `opacity:0;transform:translateX(100%);transition:.3s;word-break:break-word`;
        t.textContent = text;
        document.body.appendChild(t);
        requestAnimationFrame(() => { t.style.opacity='1'; t.style.transform='translateX(0)'; });
        setTimeout(()=>{ t.style.opacity='0';t.style.transform='translateX(100%)';setTimeout(()=>t.remove(),300); },3000);
    }

    const refreshIcons = () => typeof lucide !== 'undefined' && lucide.createIcons();

    function render() {
        list.innerHTML = '';
        if (!messages.length) {
            list.innerHTML = '<div class="message-empty"><i data-lucide="message-circle"></i><p>暂无留言</p></div>';
            refreshIcons(); return;
        }
        [...messages].reverse().forEach(m => {
            const div = document.createElement('div');
            div.className = 'message-item';
            div.innerHTML = `
                <div class="message-header">
                    <div class="message-author-info">
                        <div class="message-avatar"><i data-lucide="user"></i></div>
                        <div><div class="message-author">${escapeHtml(m.name)}</div>
                        <div class="message-time">${m.time||formatDate(Date.now())}</div></div>
                    </div>
                    <div class="message-location"><i data-lucide="map-pin"></i>${escapeHtml(m.location||'未知')}</div>
                </div>
                <p class="message-text">${escapeHtml(m.text)}</p>`;
            list.appendChild(div);
        });
        refreshIcons();
    }

    async function getLocation() {
        try {
            const r = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000), mode: 'cors' });
            if (r.ok) { const d = await r.json(); return d.city ? `${d.city}, ${d.country_name}` : d.country_name || '未知地区'; }
        } catch (_) {}
        return '未知地区';
    }

    // 字符计数
    [['name','nameCounter',20],['messageText','messageTextCounter',500]].forEach(([inputId,counterId,max])=>{
        const inp=document.getElementById(inputId), cnt=document.getElementById(counterId);
        if(!inp||!cnt)return;
        inp.addEventListener('input',()=>{
            cnt.textContent=inp.value.length;
            cnt.style.color=inp.value.length>=max?'#ef4444':inp.value.length>=max*0.8?'#f59e0b':'#95a5a6';
        });
    });

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const name=nameInput.value.trim(), text=textInput.value.trim();
        const btn=form.querySelector('[type=submit]');
        if(!name){toast('请输入昵称','error');return;}
        if(!text){toast('请输入留言','error');return;}

        btn.disabled=true; btn.innerHTML='<span>正在提交…</span>';
        try{
            const location=await getLocation();
            const msg={ id:Date.now(), name, text, time:formatDate(Date.now()), location };

            let ok=false;
            if(window.messageSync){
                const result=await window.messageSync.saveMessage(msg);
                ok=result.success;
            }else{
                ok=true;
            }
            if(ok){
                messages.push(msg);
                localStorage.setItem('messages',JSON.stringify(messages));
                render();
                toast('留言已保存！','success');
                nameInput.value='';textInput.value='';
                nameInput.dispatchEvent(new Event('input'));textInput.dispatchEvent(new Event('input'));
            }else{
                toast('保存失败，请重试','error');
            }
        }catch(err){
            console.warn('提交失败:',err.message);
            toast('提交失败，请重试','error');
        }finally{
            btn.disabled=false;
            btn.innerHTML='<span>发送留言</span>';
            refreshIcons();
        }
    });

    async function load(){
        try{
            if(window.messageSync){
                try{ messages=await window.messageSync.getMessages(true); }catch(e){console.warn('远程加载失败')}
            }
            if(!messages.length){
                const stored=localStorage.getItem('messages');
                if(stored){try{messages=JSON.parse(stored).filter(m=>m.id&&m.name&&m.text)}catch(_){}}
            }
            if(!messages.length)
                messages=[{id:1,name:'系统',text:'欢迎留言！',time:formatDate(Date.now()),location:'线上'}];
            render();
        }catch(err){
            render();
        }
    }
    load();
}

// ── 滚动效果 ──
function initScrollEffects(){
    document.querySelector('.scroll-indicator')?.addEventListener('click',()=>{
        document.getElementById('about')?.scrollIntoView({behavior:'smooth'});
    });
}

function handleScroll(){
    const navbar=document.querySelector('.navbar');
    navbar?.classList.toggle('scrolled',scrollY>100);
}
window.addEventListener('scroll',handleScroll,{passive:true}); // passive 提升滚动性能

// ── 平滑滚动 ──
function initSmoothScroll(){
    document.querySelectorAll('.nav-menu a,[data-scroll-to]').forEach(link=>{
        link.addEventListener('click',e=>{
            e.preventDefault();
            const sel=link.getAttribute('href');
            const target=sel&&document.querySelector(sel);
            if(target){
                const navH=document.querySelector('.navbar')?.offsetHeight||0;
                scrollTo({top:target.offsetTop-navH,behavior:'smooth'});
            }
        });
    });
}

// ── 卡片进入动画（修复 IO 内存泄漏：到达后 unobserve）──
const io=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
        if(entry.isIntersecting){
            entry.target.style.opacity='1';
            entry.target.style.transform='translateY(0)';
            io.unobserve(entry.target); // 泄漏修复
        }
    });
},{threshold:0.1});

document.querySelectorAll('.card,.work-item,.contact-card').forEach(el=>{
    el.style.cssText='opacity:0;transform:translateY(20px);transition:opacity .6s ease,transform .6s ease';
    io.observe(el);
});