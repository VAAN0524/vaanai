// 深色新拟态风格 - 主脚本
// Vaan 个人主页 v2.0

// 清理旧的隐私数据（保留留言，只清理缓存）
function cleanupOldPrivacyData() {
    console.log('🧹 开始清理缓存数据...');
    try {
        const cacheKeys = ['github_issues_cache', 'messages_sync_timestamp', 'last_sync_time'];
        cacheKeys.forEach(key => {
            const cache = localStorage.getItem(key);
            if (cache) {
                localStorage.removeItem(key);
                console.log(`✅ 已清理缓存: ${key}`);
            }
        });
        const oldMessages = localStorage.getItem('messages');
        if (oldMessages) {
            const messages = JSON.parse(oldMessages);
            console.log(`📦 本地存储中有 ${messages.length} 条留言数据，将保留`);
        }
    } catch (error) {
        console.warn('清理缓存时出错:', error);
    }
    console.log('🧹 缓存清理完成，留言数据已保留');
}

// 留言数据存储
let messages = [];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 页面加载完成');
    cleanupOldPrivacyData();

    // 初始化Lucide图标
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
        console.log('✅ Lucide图标已初始化');
    }

    // 初始化同步系统
    if (typeof CloudflareMessageSync !== 'undefined') {
        window.messageSync = new CloudflareMessageSync();
        console.log('✅ 同步系统已初始化');
    }

    // 初始化所有功能
    initRippleSystem();
    initMessageSystem();
    initScrollEffects();
    initSmoothScroll();

    window.addEventListener('scroll', handleScroll);
});

// 初始化水波纹系统（深色新拟态风格）
function initRippleSystem() {
    console.log('🌊 初始化水波纹系统...');

    const rippleContainer = document.getElementById('rippleContainer');
    if (!rippleContainer) return;

    const activeRipples = [];

    // 创建水波纹
    function createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';

        const size = 60;
        ripple.style.width = size + 'px';
        ripple.style.height = size + 'px';
        ripple.style.left = (x - size / 2) + 'px';
        ripple.style.top = (y - size / 2) + 'px';

        rippleContainer.appendChild(ripple);

        const rippleData = {
            element: ripple,
            createdAt: Date.now()
        };

        activeRipples.push(rippleData);

        // 动画
        const duration = 1000;
        const startTime = Date.now();

        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                const scale = 1 + progress * 3;
                const opacity = 1 - progress;
                ripple.style.transform = `scale(${scale})`;
                ripple.style.opacity = opacity;
                requestAnimationFrame(animate);
            } else {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
                const index = activeRipples.indexOf(rippleData);
                if (index > -1) {
                    activeRipples.splice(index, 1);
                }
            }
        }

        requestAnimationFrame(animate);

        // 自动清理
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, duration);
    }

    // 点击事件处理
    document.addEventListener('click', function(e) {
        const excludeElements = ['a', 'button', 'input', 'textarea', 'select', 'nav', 'footer'];
        const target = e.target;
        const isExcluded = excludeElements.some(tag =>
            target.tagName.toLowerCase() === tag ||
            target.closest(tag)
        );

        if (!isExcluded) {
            createRipple(e.clientX, e.clientY);
        }
    });

    console.log('✅ 水波纹系统初始化完成');
}

// 初始化留言系统
function initMessageSystem() {
    console.log('🚀 初始化留言系统...');

    const messageForm = document.getElementById('messageForm');
    const messageList = document.getElementById('messageList');
    const nameInput = document.getElementById('name');
    const messageInput = document.getElementById('messageText');

    if (!messageForm || !messageList || !nameInput || !messageInput) {
        console.error('❌ 找不到必要的DOM元素');
        return;
    }

    // 格式化日期
    function formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    // HTML转义
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 渲染留言列表（新拟态风格）
    function renderMessages() {
        console.log('渲染留言列表，共', messages.length, '条');
        messageList.innerHTML = '';

        if (messages.length === 0) {
            messageList.innerHTML = `
                <div class="message-empty">
                    <i data-lucide="message-circle"></i>
                    <p>暂无留言，来做第一个吧！</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }

        const reversedMessages = [...messages].reverse();

        reversedMessages.forEach(msg => {
            const messageItem = document.createElement('div');
            messageItem.className = 'message-item';

            const location = msg.location || '未知地区';
            const time = msg.time || new Date().toLocaleString('zh-CN');

            messageItem.innerHTML = `
                <div class="message-header">
                    <div class="message-author-info">
                        <div class="message-avatar">
                            <i data-lucide="user"></i>
                        </div>
                        <div>
                            <div class="message-author">${escapeHtml(msg.name)}</div>
                            <div class="message-time">${time}</div>
                        </div>
                    </div>
                    <div class="message-location">
                        <i data-lucide="map-pin"></i>
                        ${escapeHtml(location)}
                    </div>
                </div>
                <p class="message-text">${escapeHtml(msg.text)}</p>
            `;

            messageList.appendChild(messageItem);
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        console.log('留言列表渲染完成');
    }

    // 获取地理位置（简化版本，保护隐私）
    async function getUserLocation() {
        try {
            const response = await fetch('https://ipapi.co/json/', {
                signal: AbortSignal.timeout(3000),
                mode: 'cors'
            });

            if (response.ok) {
                const data = await response.json();
                const location = data.city ? `${data.city}, ${data.country_name}` : data.country_name || '未知地区';
                const ip = data.ip ? '***.***.***' : '未知';
                console.log('地理位置获取成功（保护隐私模式）:', location);
                return { ip, location };
            }
        } catch (error) {
            console.warn('地理位置获取失败，使用默认值:', error.message);
        }

        return {
            ip: '***.***.***',
            location: '未知地区'
        };
    }

    // 显示消息提示
    function showMessage(text, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-toast message-toast-${type}`;
        messageDiv.textContent = text;

        // 新拟态风格
        messageDiv.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 12px;
            color: #dfe6e9;
            font-weight: 500;
            z-index: 1000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
            background: #2d3436;
            box-shadow: 8px 8px 16px #25292a, -8px -8px 16px #4a5052;
        `;

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#74b9ff',
            warning: '#f59e0b'
        };
        messageDiv.style.borderLeft = `4px solid ${colors[type] || colors.info}`;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
    }

    // 字符计数器功能
    function initCharCounters() {
        const nameCounter = document.getElementById('nameCounter');
        const messageCounter = document.getElementById('messageTextCounter');

        if (nameInput && nameCounter) {
            function updateNameCounter() {
                const count = (nameInput.value || '').length;
                nameCounter.textContent = count;
                if (count >= 20) {
                    nameCounter.style.color = '#ef4444';
                } else if (count >= 15) {
                    nameCounter.style.color = '#f59e0b';
                } else {
                    nameCounter.style.color = '#95a5a6';
                }
            }
            nameInput.addEventListener('input', updateNameCounter);
            updateNameCounter();
        }

        if (messageInput && messageCounter) {
            function updateMessageCounter() {
                const count = (messageInput.value || '').length;
                messageCounter.textContent = count;
                if (count >= 500) {
                    messageCounter.style.color = '#ef4444';
                } else if (count >= 400) {
                    messageCounter.style.color = '#f59e0b';
                } else {
                    messageCounter.style.color = '#95a5a6';
                }
            }
            messageInput.addEventListener('input', updateMessageCounter);
            updateMessageCounter();
        }
    }

    // 表单提交事件
    messageForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('表单提交事件触发');

        const name = (nameInput.value || '').trim();
        const text = (messageInput.value || '').trim();
        const submitButton = messageForm.querySelector('button[type="submit"]');

        // 输入验证
        if (!name) {
            showMessage('请输入您的昵称', 'error');
            nameInput.focus();
            return;
        }

        if (!text) {
            showMessage('请输入留言内容', 'error');
            messageInput.focus();
            return;
        }

        if (name.length > 20) {
            showMessage('昵称不能超过20个字符', 'warning');
            return;
        }

        if (text.length > 500) {
            showMessage('留言内容不能超过500个字符', 'warning');
            return;
        }

        // 禁用提交按钮
        submitButton.disabled = true;
        submitButton.innerHTML = '<i data-lucide="loader-2"></i> 正在提交...';

        try {
            showMessage('正在准备留言信息...', 'info');
            const location = await getUserLocation();

            const newMessage = {
                id: Date.now(),
                name: name,
                text: text,
                time: formatDate(new Date()),
                location: location.location,
                ip: location.ip
            };

            console.log('📝 新留言:', newMessage);

            // 使用 Cloudflare 同步系统保存
            let saveResult;
            if (window.messageSync) {
                showMessage('正在保存留言...', 'info');
                saveResult = await window.messageSync.saveMessage(newMessage);
            } else {
                messages.push(newMessage);
                localStorage.setItem('messages', JSON.stringify(messages));
                saveResult = { success: true, message: '已保存到本地' };
            }

            if (saveResult.success) {
                console.log('✅ 留言保存成功:', saveResult.message);

                if (!messages.find(msg => msg.id === newMessage.id)) {
                    messages.push(newMessage);
                }

                localStorage.setItem('messages', JSON.stringify(messages));
                renderMessages();

                const backendName = saveResult.backend === 'cloudflare-workers' ? 'Cloudflare' :
                                   saveResult.backend === 'github' ? 'GitHub Issues' : '本地';
                showMessage(`留言已成功保存到${backendName}！`, 'success');

            } else {
                console.warn('❌ 留言保存失败:', saveResult.message);
                showMessage('留言保存失败，请重试', 'error');
            }

            // 清空输入框
            nameInput.value = '';
            messageInput.value = '';
            nameInput.dispatchEvent(new Event('input'));
            messageInput.dispatchEvent(new Event('input'));

        } catch (error) {
            console.error('提交留言失败:', error);
            showMessage('留言提交失败，请重试！', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i data-lucide="send"></i> 发送留言';
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    });

    // 初始化字符计数器
    initCharCounters();

    // 初始化留言
    async function initializeMessages() {
        console.log('🚀 开始初始化留言系统...');
        try {
            if (window.messageSync) {
                try {
                    messages = await window.messageSync.getMessages(true);
                    console.log(`📋 从同步系统加载了 ${messages.length} 条留言`);
                } catch (error) {
                    console.warn('从同步系统加载失败，使用本地数据:', error.message);
                }
            }

            if (messages.length === 0) {
                const stored = localStorage.getItem('messages');
                if (stored) {
                    const localMessages = JSON.parse(stored);
                    const validMessages = localMessages.filter(msg => {
                        return msg.id && msg.name && msg.text && msg.time;
                    });
                    if (validMessages.length > 0) {
                        messages = validMessages;
                        console.log(`📋 从本地存储加载了 ${messages.length} 条有效留言`);
                    }
                }
            }

            if (messages.length === 0) {
                console.log('📝 没有历史留言，添加默认欢迎留言');
                messages = [{
                    id: Date.now().toString(),
                    name: "系统",
                    text: "欢迎来到留言板！快来留下您的第一条留言吧～",
                    time: new Date().toLocaleString('zh-CN'),
                    location: "线上"
                }];
            }

            renderMessages();
            console.log('✅ 留言系统初始化完成');

        } catch (error) {
            console.error('❌ 留言系统初始化失败:', error);
            messages = [{
                id: Date.now().toString(),
                name: "系统",
                text: "留言系统初始化失败，但您可以继续留言。",
                time: new Date().toLocaleString('zh-CN'),
                location: "本地"
            }];
            renderMessages();
        }
    }

    initializeMessages();
}

// 初始化滚动效果
function initScrollEffects() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            const aboutSection = document.getElementById('about');
            if (aboutSection) {
                aboutSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

// 处理滚动事件
function handleScroll() {
    const navbar = document.querySelector('.navbar');
    const scrollIndicator = document.querySelector('.scroll-indicator');

    if (navbar) {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    if (scrollIndicator) {
        if (window.scrollY > 200) {
            scrollIndicator.style.opacity = '0';
            scrollIndicator.style.pointerEvents = 'none';
        } else {
            scrollIndicator.style.opacity = '1';
            scrollIndicator.style.pointerEvents = 'auto';
        }
    }
}

// 初始化平滑滚动
function initSmoothScroll() {
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetSection.offsetTop - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton && ctaButton.getAttribute('href') === '#about') {
        ctaButton.addEventListener('click', function(e) {
            e.preventDefault();
            const aboutSection = document.getElementById('about');
            if (aboutSection) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = aboutSection.offsetTop - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }
}

// 交叉观察器动画（卡片进入效果）
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, {
    threshold: 0.1
});

// 观察所有卡片元素
document.querySelectorAll('.card, .work-item, .contact-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});
