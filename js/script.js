// 清理旧的隐私数据（极简隐私保护）
function cleanupOldPrivacyData() {
    console.log('🧹 开始清理旧的隐私数据...');

    // 清理本地存储中的旧留言数据
    try {
        const oldMessages = localStorage.getItem('messages');
        if (oldMessages) {
            const messages = JSON.parse(oldMessages);
            console.log(`📦 发现 ${messages.length} 条旧留言数据`);

            // 检查是否有包含敏感信息的旧数据
            const hasSensitiveData = messages.some(msg =>
                msg.location || msg.ip || msg.userAgent
            );

            if (hasSensitiveData) {
                console.log('⚠️ 检测到包含敏感信息的旧数据，正在清理...');
                localStorage.removeItem('messages');
                console.log('✅ 已清理包含敏感信息的旧留言数据');
            } else {
                console.log('✅ 现有数据符合隐私保护要求，保留数据');
            }
        }
    } catch (error) {
        console.warn('清理旧数据时出错:', error);
    }

    // 清理GitHub缓存
    try {
        const githubCache = localStorage.getItem('github_issues_cache');
        if (githubCache) {
            localStorage.removeItem('github_issues_cache');
            console.log('✅ 已清理GitHub缓存数据');
        }
    } catch (error) {
        console.warn('清理GitHub缓存时出错:', error);
    }

    console.log('🧹 隐私数据清理完成');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 页面加载完成');

    // 首先清理旧的隐私数据
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
    createParticles();
    initRippleSystem();
    initMessageSystem();
    initScrollEffects();
    initSmoothScroll();

    window.addEventListener('scroll', handleScroll);
});

// 创建炫酷背景粒子
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    const particleCount = 50;
    const particleTypes = ['particle-1', 'particle-2', 'particle-3', 'particle-glow'];

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
        particle.className = `particle ${type}`;

        // 随机位置和大小
        const size = Math.random() * 3 + 1;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 10 + 's';

        // 添加随机动画时长
        if (type === 'particle-1') {
            particle.style.animationDuration = (Math.random() * 10 + 20) + 's';
        } else if (type === 'particle-2') {
            particle.style.animationDuration = (Math.random() * 8 + 15) + 's';
        } else if (type === 'particle-3') {
            particle.style.animationDuration = (Math.random() * 12 + 25) + 's';
        } else {
            particle.style.animationDuration = (Math.random() * 15 + 30) + 's';
        }

        // 添加发光效果
        if (type === 'particle-glow') {
            particle.style.boxShadow = `0 0 ${Math.random() * 15 + 10}px rgba(102, 126, 234, ${Math.random() * 0.5 + 0.3})`;
        }

        particlesContainer.appendChild(particle);
    }

    // 添加鼠标交互效果
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const particles = document.querySelectorAll('.particle');

        particles.forEach((particle, index) => {
            if (index % 3 === 0) { // 只影响部分粒子，避免性能问题
                const rect = particle.getBoundingClientRect();
                const particleX = rect.left + rect.width / 2;
                const particleY = rect.top + rect.height / 2;
                const distance = Math.sqrt(Math.pow(mouseX - particleX, 2) + Math.pow(mouseY - particleY, 2));

                if (distance < 150) {
                    const force = (150 - distance) / 150;
                    const angle = Math.atan2(particleY - mouseY, particleX - mouseX);
                    const moveX = Math.cos(angle) * force * 20;
                    const moveY = Math.sin(angle) * force * 20;

                    particle.style.transform = `translate(${moveX}px, ${moveY}px) scale(${1 + force * 0.5})`;
                }
            }
        });
    });
}

// 初始化水波纹系统
function initRippleSystem() {
    console.log('🌊 初始化水波纹系统...');

    // 创建水波纹容器
    const rippleContainer = document.createElement('div');
    rippleContainer.className = 'ripple-container';
    rippleContainer.id = 'rippleContainer';
    document.body.appendChild(rippleContainer);

    // 存储所有活动的水波纹
    const activeRipples = [];

    // 波形参数（符合物理学定律，更逼真的效果）
    const WAVE_SPEED = 300; // 波速 (像素/秒) - 加快一点
    const DAMPING = 0.92; // 阻尼系数 - 稍微增加衰减
    const MAX_RADIUS = 1200; // 最大半径（缩小4倍，从4800改为1200）
    const INTERFERENCE_STRENGTH = 0.4; // 波干涉强度 - 增加干涉效果
    const WAVE_COUNT = 3; // 多层波纹，更逼真

    // 创建水波纹（更逼真的多层效果）
    function createRipple(x, y) {
        // 创建多层波纹，更逼真的水波效果
        for (let i = 0; i < WAVE_COUNT; i++) {
            setTimeout(() => {
                createSingleRipple(x, y, i);
            }, i * 150); // 每层延迟150ms
        }
    }

    // 创建单个水波纹
    function createSingleRipple(x, y, waveIndex) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';

        // 设置初始位置和大小（缩小4倍）
        const initialSize = 40 - waveIndex * 5; // 每层稍微小一点
        ripple.style.width = initialSize + 'px';
        ripple.style.height = initialSize + 'px';
        ripple.style.left = (x - initialSize / 2) + 'px';
        ripple.style.top = (y - initialSize / 2) + 'px';

        // 更逼真的颜色和透明度渐变
        const hue = 200 + waveIndex * 10 + Math.random() * 20; // 蓝色范围，每层略有不同
        const saturation = 70 - waveIndex * 10 + Math.random() * 20;
        const lightness = 60 + waveIndex * 5 + Math.random() * 10;
        const opacity = 0.6 - waveIndex * 0.15; // 每层透明度递减

        ripple.style.background = `radial-gradient(circle at center,
            hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity}) 0%,
            hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity * 0.6}) 30%,
            hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity * 0.3}) 60%,
            transparent 100%)`;

        // 添加边框，模拟真实水波
        ripple.style.border = `1px solid hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity * 0.3})`;

        rippleContainer.appendChild(ripple);

        // 波纹对象（用于物理计算）
        const rippleData = {
            element: ripple,
            x: x,
            y: y,
            radius: initialSize / 2,
            maxRadius: MAX_RADIUS + Math.random() * 100 - waveIndex * 50, // 每层最大半径略有不同
            speed: WAVE_SPEED + Math.random() * 50 - waveIndex * 20, // 每层速度略有不同
            amplitude: 1.0 - waveIndex * 0.1, // 每层振幅略有不同
            createdAt: Date.now(),
            id: Math.random().toString(36).substr(2, 9) + '_' + waveIndex,
            waveIndex: waveIndex
        };

        activeRipples.push(rippleData);

        // 开始动画
        animateRipple(rippleData);

        // 自动清理（每层清理时间略有不同）
        setTimeout(() => {
            removeRipple(rippleData.id);
        }, 2000 + waveIndex * 300);
    }

    // 波纹动画（物理模拟）
    function animateRipple(rippleData) {
        const startTime = Date.now();

        function animate() {
            const elapsed = (Date.now() - startTime) / 1000; // 转换为秒

            // 物理计算：波的传播
            const targetRadius = rippleData.speed * elapsed;
            const dampingFactor = Math.pow(DAMPING, elapsed * 10); // 指数衰减

            // 更新半径
            rippleData.radius = targetRadius;
            rippleData.amplitude = dampingFactor;

            // 检查波干涉（与其他波纹的相互作用）
            let interferenceBoost = 0;
            activeRipples.forEach(other => {
                if (other.id !== rippleData.id) {
                    const distance = Math.sqrt(
                        Math.pow(rippleData.x - other.x, 2) +
                        Math.pow(rippleData.y - other.y, 2)
                    );

                    // 波的叠加原理
                    if (distance < rippleData.radius + other.radius &&
                        distance > Math.abs(rippleData.radius - other.radius)) {
                        interferenceBoost += other.amplitude * INTERFERENCE_STRENGTH;
                    }
                }
            });

            // 更新视觉效果
            const currentRadius = rippleData.radius;
            const currentAmplitude = Math.min(1.0, rippleData.amplitude + interferenceBoost);
            const scale = currentRadius / (rippleData.element.offsetWidth / 2);

            if (currentRadius < rippleData.maxRadius && currentAmplitude > 0.01) {
                rippleData.element.style.transform = `scale(${scale})`;
                rippleData.element.style.opacity = currentAmplitude;

                // 添加脉动效果
                const pulse = Math.sin(elapsed * 10) * 0.1 + 1;
                rippleData.element.style.filter = `brightness(${pulse})`;

                requestAnimationFrame(animate);
            } else {
                // 动画结束
                removeRipple(rippleData.id);
            }
        }

        requestAnimationFrame(animate);
    }

    // 移除水波纹
    function removeRipple(id) {
        const index = activeRipples.findIndex(r => r.id === id);
        if (index !== -1) {
            const rippleData = activeRipples[index];
            if (rippleData.element && rippleData.element.parentNode) {
                rippleData.element.style.opacity = '0';
                setTimeout(() => {
                    if (rippleData.element.parentNode) {
                        rippleData.element.parentNode.removeChild(rippleData.element);
                    }
                }, 300);
            }
            activeRipples.splice(index, 1);
        }
    }

    // 点击事件处理
    document.addEventListener('click', function(e) {
        // 排除交互元素
        const excludeElements = ['a', 'button', 'input', 'textarea', 'select', 'nav', 'footer'];
        const target = e.target;
        const isExcluded = excludeElements.some(tag =>
            target.tagName.toLowerCase() === tag ||
            target.closest(tag)
        );

        if (!isExcluded) {
            // 创建主水波纹
            createRipple(e.clientX, e.clientY);

            // 创建额外的小水波纹（增强效果）
            setTimeout(() => {
                if (Math.random() > 0.5) {
                    const offsetX = (Math.random() - 0.5) * 50;
                    const offsetY = (Math.random() - 0.5) * 50;
                    createRipple(e.clientX + offsetX, e.clientY + offsetY);
                }
            }, 100);
        }
    });

    // 清理函数
    window.addEventListener('beforeunload', () => {
        activeRipples.forEach(rippleData => {
            if (rippleData.element && rippleData.element.parentNode) {
                rippleData.element.parentNode.removeChild(rippleData.element);
            }
        });
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
        console.error('❌ 找不到必要的DOM元素:', {
            messageForm: !!messageForm,
            messageList: !!messageList,
            nameInput: !!nameInput,
            messageInput: !!messageInput
        });
        return;
    }

    console.log('✅ 所有DOM元素已找到', {
        messageForm: !!messageForm,
        messageList: !!messageList,
        nameInput: !!nameInput,
        messageInput: !!messageInput
    });

    // 从localStorage加载留言
    let messages = [];
    try {
        const stored = localStorage.getItem('messages');
        if (stored) {
            messages = JSON.parse(stored);
            console.log(`📦 从localStorage加载了 ${messages.length} 条留言`);

            // 验证留言数据完整性
            messages = messages.filter(msg => {
                const isValid = msg.id && msg.name && msg.text && msg.time;
                if (!isValid) {
                    console.warn('⚠️ 发现无效留言数据:', msg);
                }
                return isValid;
            });

            console.log(`📋 验证后有效留言: ${messages.length} 条`);
        }
    } catch (e) {
        console.error('❌ 加载留言失败:', e);
        showMessage('加载历史留言失败，将显示示例留言', 'warning');
    }

    // 如果没有留言，添加示例留言
    if (messages.length === 0) {
        messages = [
            {
                id: 1,
                name: "访客",
                text: "欢迎来到我的个人主页！",
                time: "2025-10-28 10:00",
                location: "北京, China",
                ip: "111.222.333.444"
            },
            {
                id: 2,
                name: "Vaan",
                text: "感谢您的访问，欢迎留言交流！",
                time: "2025-10-28 10:05",
                location: "上海, China",
                ip: "121.222.333.444"
            }
        ];
        localStorage.setItem('messages', JSON.stringify(messages));
        console.log('创建了示例留言');
    }

    // 格式化时间
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

    // 掩码IP
    function maskIP(ip) {
        if (!ip || ip === '未知') return '未知';
        const parts = ip.split('.');
        if (parts.length === 4) {
            return `${parts[0]}.***.***.${parts[3]}`;
        }
        return ip;
    }

    // 渲染留言列表（平衡隐私保护版本）
    function renderMessages() {
        console.log('渲染留言列表，共', messages.length, '条');
        messageList.innerHTML = '';

        const reversedMessages = [...messages].reverse();

        reversedMessages.forEach(msg => {
            const messageItem = document.createElement('div');
            messageItem.className = 'message-item';

            // 构建显示信息（在昵称后面显示地域和时间）
            const location = msg.location || '未知地区';
            const time = msg.time || new Date().toLocaleString('zh-CN');
            const displayInfo = `${escapeHtml(location)} · ${time}`;

            messageItem.innerHTML = `
                <div class="message-header">
                    <span class="message-author">${escapeHtml(msg.name)}</span>
                    <span class="message-info">${displayInfo}</span>
                </div>
                <p class="message-text">${escapeHtml(msg.text)}</p>
            `;

            messageList.appendChild(messageItem);
        });

        console.log('留言列表渲染完成（平衡隐私保护模式）');
    }

    
    // 获取地理位置（简化版本，保护隐私）
    async function getUserLocation() {
        try {
            // 使用快速API，减少超时时间
            const response = await fetch('https://ipapi.co/json/', {
                signal: AbortSignal.timeout(3000), // 减少到3秒
                mode: 'cors'
            });

            if (response.ok) {
                const data = await response.json();

                // 简化地理位置信息，只保留城市和国家
                const location = data.city ? `${data.city}, ${data.country_name}` : data.country_name || '未知地区';

                // IP地址掩码处理：显示前两段和后一段
                const ip = data.ip ? data.ip.split('.').slice(0, 2).join('.***.***.') + data.ip.split('.').slice(-1) : '未知';

                console.log('地理位置获取成功（保护隐私模式）:', location);

                return { ip, location };
            }
        } catch (error) {
            console.warn('地理位置获取失败，使用默认值:', error.message);
        }

        // 返回通用信息，保护用户隐私
        return {
            ip: '***.***.***', // 完全隐藏IP
            location: '未知地区'
        };
    }

    // 生成随机IP（用于演示）
    function generateRandomIP() {
        return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    }

    // 保存留言到服务器
    async function saveToServer(messageData) {
        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('保存到服务器失败:', error);
            return {
                success: false,
                message: error.message || '网络连接失败'
            };
        }
    }

    // 从服务器加载留言
    async function loadMessagesFromServer() {
        try {
            const response = await fetch('/api/messages');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                console.log(`🌐 从服务器加载了 ${result.data.length} 条留言`);
                return result.data;
            } else {
                console.warn('服务器返回空数据或失败');
                return null;
            }

        } catch (error) {
            console.warn('从服务器加载留言失败:', error.message);
            return null;
        }
    }

    // 同步服务器留言（智能合并，避免重复）
    async function syncWithServer() {
        try {
            // 静默同步，不显示提示
            console.log('🔄 正在同步服务器留言...');
            const serverMessages = await loadMessagesFromServer();

            if (serverMessages && serverMessages.length > 0) {
                // 获取当前本地留言的ID集合
                const localMessageIds = new Set(messages.map(msg => msg.id));

                // 找出服务器上有但本地没有的新留言
                const newMessages = serverMessages.filter(serverMsg =>
                    !localMessageIds.has(serverMsg.id)
                );

                if (newMessages.length > 0) {
                    // 合并本地留言和新的服务器留言
                    const allMessages = [...messages, ...newMessages];

                    // 去重（按ID）并按时间排序（最新的在前）
                    const uniqueMessages = allMessages.reduce((acc, current) => {
                        const exists = acc.find(msg => msg.id === current.id);
                        if (!exists) {
                            acc.push(current);
                        }
                        return acc;
                    }, []);

                    // 按时间排序（最新的在前）
                    uniqueMessages.sort((a, b) => new Date(b.time) - new Date(a.time));

                    // 更新本地留言数组
                    messages = uniqueMessages;

                    // 保存到localStorage
                    localStorage.setItem('messages', JSON.stringify(messages));

                    // 重新渲染
                    renderMessages();

                    console.log(`✅ 同步完成，新增 ${newMessages.length} 条留言`);

                    // 只有真的有新留言时才显示提示
                    showMessage(`发现了 ${newMessages.length} 条新留言！`, 'success');
                } else {
                    console.log('📝 没有新留言需要同步');
                }
            } else {
                console.log('📝 服务器没有留言数据');
            }

        } catch (error) {
            console.error('同步失败:', error);
            // 同步失败时不显示错误提示，避免打扰用户
        }
    }

    // 多层次服务器状态检查
    async function checkServerStatus() {
        const urls = [
            '/api/health',
            '/api/debug',
            '/api/messages'
        ];

        for (const url of urls) {
            try {
                console.log(`🔍 检查服务器状态: ${url}`);
                const response = await fetch(url, {
                    method: 'GET',
                    timeout: 5000
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ 服务器状态正常:', result);
                    updateSyncStatus(true);
                    return true;
                }
            } catch (error) {
                console.warn(`⚠️ 检查失败 ${url}:`, error.message);
                continue;
            }
        }

        console.log('❌ 所有服务器检查都失败');
        updateSyncStatus(false);
        return false;
    }

    // 增强的服务器检查（带重试机制）
    async function checkServerStatusWithRetry(maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            console.log(`🔄 服务器状态检查 ${i + 1}/${maxRetries}`);
            const isOnline = await checkServerStatus();

            if (isOnline) {
                return true;
            }

            // 指数退避重试
            if (i < maxRetries - 1) {
                const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
                console.log(`⏳ 等待 ${delay}ms 后重试...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        return false;
    }

    
    // 表单提交事件
    messageForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('表单提交事件触发');

        const name = nameInput && (nameInput.value || nameInput.textContent) ? String(nameInput.value || nameInput.textContent).trim() : '';
        const text = messageInput && (messageInput.value || messageInput.textContent) ? String(messageInput.value || messageInput.textContent).trim() : '';
        const submitButton = messageForm.querySelector('button[type="submit"]');

        console.log('📝 输入内容:', { name, text });

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

        // 长度验证
        if (name.length > 20) {
            showMessage('昵称不能超过20个字符', 'warning');
            nameInput.focus();
            return;
        }

        if (text.length > 500) {
            showMessage('留言内容不能超过500个字符', 'warning');
            messageInput.focus();
            return;
        }

        // 内容过滤（防止恶意输入）
        const forbiddenWords = ['<script', 'javascript:', 'onclick', 'onerror', 'onload'];
        const containsForbidden = forbiddenWords.some(word =>
            text.toLowerCase().includes(word) || name.toLowerCase().includes(word)
        );

        if (containsForbidden) {
            showMessage('请勿输入不安全的内容', 'error');
            return;
        }

        console.log('✅ 输入验证通过');

        // 禁用提交按钮，显示加载状态
        submitButton.disabled = true;
        submitButton.innerHTML = '<i data-lucide="loader-2"></i> 正在提交...';

        // 添加旋转动画
        const loaderIcon = submitButton.querySelector('[data-lucide="loader-2"]');
        if (loaderIcon) {
            loaderIcon.style.animation = 'spin 1s linear infinite';
        }

        try {
            // 准备留言信息
            showMessage('正在准备留言信息...', 'info');
            const location = await getUserLocation();

            // 创建新留言
            const newMessage = {
                id: Date.now(),
                name: name,
                text: text,
                time: formatDate(new Date()),
                location: location.location,
                ip: location.ip,
                userAgent: navigator.userAgent
            };

            console.log('📝 新留言:', newMessage);

            // 使用 Cloudflare 同步系统保存
            let saveResult;
            if (window.messageSync) {
                showMessage('正在保存留言...', 'info');
                saveResult = await window.messageSync.saveMessage(newMessage);
            } else {
                // 备用方案：传统保存方式
                messages.push(newMessage);
                localStorage.setItem('messages', JSON.stringify(messages));
                saveResult = { success: true, message: '已保存到本地' };
            }

            if (saveResult.success) {
                console.log('✅ 留言保存成功:', saveResult.message);

                // 确保新留言添加到本地数组
                if (!messages.find(msg => msg.id === newMessage.id)) {
                    messages.push(newMessage);
                }

                // 保存到本地存储，确保数据持久化
                try {
                    localStorage.setItem('messages', JSON.stringify(messages));
                    console.log('💾 留言已保存到本地存储');
                } catch (error) {
                    console.warn('保存到本地存储失败:', error.message);
                }

                // 如果使用了Cloudflare同步，重新加载所有留言
                if (window.messageSync && saveResult.backend !== 'local') {
                    try {
                        // 等待一段时间确保GitHub数据已同步
                        setTimeout(async () => {
                            try {
                                const updatedMessages = await window.messageSync.getMessages();
                                if (updatedMessages.length >= messages.length) {
                                    messages = updatedMessages;
                                    // 更新本地存储
                                    localStorage.setItem('messages', JSON.stringify(messages));
                                    renderMessages();
                                    console.log('🔄 从同步系统重新加载了留言');
                                }
                            } catch (error) {
                                console.warn('从同步系统重新加载失败:', error.message);
                            }
                        }, 2000); // 等待2秒让GitHub同步
                    } catch (error) {
                        console.warn('设置重新加载任务失败:', error.message);
                    }
                }

                // 立即触发一次同步，确保显示最新留言
                setTimeout(async () => {
                    try {
                        await syncWithServer();
                        renderMessages();
                    } catch (error) {
                        console.warn('提交后同步失败:', error);
                    }
                }, 1000); // 1秒后再次同步

                // 显示成功提示
                const backendName = saveResult.backend === 'cloudflare-workers' ? 'Cloudflare' :
                                   saveResult.backend === 'github' ? 'GitHub Issues' : '本地';
                showMessage(`留言已成功保存到${backendName}！`, 'success');

            } else {
                console.warn('❌ 留言保存失败:', saveResult.message);
                showMessage('留言保存失败，请重试', 'error');
            }

            // 清空输入框
            if (nameInput) nameInput.value = '';
            if (messageInput) messageInput.value = '';

            // 触发计数器更新
            if (nameInput) nameInput.dispatchEvent(new Event('input'));
            if (messageInput) messageInput.dispatchEvent(new Event('input'));

            // 滚动到留言区顶部
            setTimeout(() => {
                const firstMessage = messageList.querySelector('.message-item');
                if (firstMessage) {
                    firstMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 200);

        } catch (error) {
            console.error('提交留言失败:', error);
            showMessage('留言提交失败，请重试！', 'error');
        } finally {
            // 恢复提交按钮状态
            submitButton.disabled = false;
            submitButton.innerHTML = '<i data-lucide="send"></i> 发送留言';

            // 重新初始化图标
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    });

    // 显示消息提示（替代alert）
    function showMessage(text, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-toast message-toast-${type}`;
        messageDiv.textContent = text;

        // 添加样式
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        // 根据类型设置背景色
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };
        messageDiv.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(messageDiv);

        // 显示动画
        setTimeout(() => {
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateX(0)';
        }, 100);

        // 3秒后自动消失
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
        const nameInput = document.getElementById('name');
        const messageInput = document.getElementById('messageText');
        const nameCounter = document.getElementById('nameCounter');
        const messageCounter = document.getElementById('messageTextCounter');

        console.log('字符计数器初始化:', {
            nameInput: !!nameInput,
            messageInput: !!messageInput,
            nameCounter: !!nameCounter,
            messageCounter: !!messageCounter
        });

        if (nameInput && nameCounter) {
            function updateNameCounter() {
                const value = nameInput.value || nameInput.textContent || '';
                const count = value.length;
                nameCounter.textContent = count;

                if (count >= 20) {
                    nameCounter.style.color = '#ef4444';
                } else if (count >= 15) {
                    nameCounter.style.color = '#f59e0b';
                } else {
                    nameCounter.style.color = '#a0aec0';
                }
            }

            nameInput.addEventListener('input', updateNameCounter);
            updateNameCounter(); // 初始化计数
            console.log('昵称计数器已初始化');
        } else {
            console.warn('昵称计数器元素未找到');
        }

        if (messageInput && messageCounter) {
            function updateMessageCounter() {
                const value = messageInput.value || messageInput.textContent || '';
                const count = value.length;
                messageCounter.textContent = count;

                if (count >= 500) {
                    messageCounter.style.color = '#ef4444';
                } else if (count >= 400) {
                    messageCounter.style.color = '#f59e0b';
                } else {
                    messageCounter.style.color = '#a0aec0';
                }
            }

            messageInput.addEventListener('input', updateMessageCounter);
            updateMessageCounter(); // 初始化计数
            console.log('留言计数器已初始化');
        } else {
            console.warn('留言计数器元素未找到');
        }
    }

    // 初始化字符计数器
    initCharCounters();

    // 增强的留言初始化（Cloudflare Pages 适配）
    async function initializeMessages() {
        console.log('🚀 开始初始化留言系统...');

        try {
            // 第一步：优先从 Cloudflare 同步系统加载留言
            console.log('🌐 正在从同步系统加载留言...');
            if (window.messageSync) {
                try {
                    messages = await window.messageSync.getMessages();
                    console.log(`📋 从同步系统加载了 ${messages.length} 条留言`);
                } catch (error) {
                    console.warn('从同步系统加载失败，使用本地数据:', error.message);
                }
            }

            // 第二步：如果同步系统没有数据或失败，尝试从本地存储加载
            if (messages.length === 0) {
                console.log('📦 正在从本地存储加载留言...');
                try {
                    const stored = localStorage.getItem('messages');
                    if (stored) {
                        const localMessages = JSON.parse(stored);
                        // 验证留言数据完整性
                        const validMessages = localMessages.filter(msg => {
                            const isValid = msg.id && msg.name && msg.text && msg.time;
                            return isValid;
                        });

                        if (validMessages.length > 0) {
                            messages = validMessages;
                            console.log(`📋 从本地存储加载了 ${messages.length} 条有效留言`);
                        }
                    }
                } catch (error) {
                    console.warn('从本地存储加载失败:', error.message);
                }
            }

            // 第三步：如果仍然没有留言，添加默认欢迎留言
            if (messages.length === 0) {
                console.log('📝 没有历史留言，添加默认欢迎留言');
                messages = [
                    {
                        id: Date.now().toString(),
                        name: "系统",
                        text: "欢迎来到留言板！快来留下您的第一条留言吧～",
                        time: new Date().toLocaleString('zh-CN'),
                        location: "线上",
                        isDefault: true
                    }
                ];
            }

            // 第四步：渲染留言
            console.log(`🎨 准备渲染 ${messages.length} 条留言`);
            renderMessages();

            console.log('✅ 留言系统初始化完成');

        } catch (error) {
            console.error('❌ 留言系统初始化失败:', error);
            // 确保至少有默认留言显示
            messages = [
                {
                    id: Date.now().toString(),
                    name: "系统",
                    text: "留言系统初始化失败，但您可以继续留言。",
                    time: new Date().toLocaleString('zh-CN'),
                    location: "本地",
                    isDefault: true
                }
            ];
            renderMessages();
        }
    }

    // 启动自动刷新功能
    startAutoRefresh();
}

    // 自动刷新功能
    function startAutoRefresh() {
        console.log('🔄 启动自动刷新功能...');

        // 每30秒自动刷新一次留言
        setInterval(async () => {
            try {
                console.log('🔄 自动刷新留言...');
                await syncWithServer();
                renderMessages();
            } catch (error) {
                console.warn('自动刷新失败:', error);
            }
        }, 30000); // 30秒间隔

        // 页面可见性变化时也刷新
        document.addEventListener('visibilitychange', async () => {
            if (!document.hidden) {
                console.log('🔄 页面重新可见，刷新留言...');
                try {
                    await syncWithServer();
                    renderMessages();
                } catch (error) {
                    console.warn('页面可见时刷新失败:', error);
                }
            }
        });

        console.log('✅ 自动刷新功能已启动');
    }

    
    // 确保本地有留言数据（仅检查，不添加示例）
    function ensureLocalMessages() {
        // 如果本地有数据，直接使用
        if (messages.length > 0) {
            console.log(`📋 本地已有 ${messages.length} 条留言`);
            return;
        }

        // 如果本地为空，记录状态但不添加示例留言
        console.log('📝 本地无留言，等待初始化函数处理');
    }

    // 添加调试功能
    function addDebugTools() {
        // 创建调试面板
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debugPanel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px;
            border-radius: 8px;
            font-size: 12px;
            z-index: 10000;
            max-width: 300px;
            display: none;
        `;

        debugPanel.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold;">🔧 调试面板</div>
            <div id="debugInfo"></div>
            <button onclick="toggleDebug()" style="margin-top: 10px; padding: 5px 10px; background: #667eea; border: none; border-radius: 4px; color: white; cursor: pointer;">关闭</button>
            <button onclick="runDiagnostics()" style="margin-top: 5px; padding: 5px 10px; background: #f59e0b; border: none; border-radius: 4px; color: white; cursor: pointer;">运行诊断</button>
        `;

        document.body.appendChild(debugPanel);

        // 添加调试按钮
        const debugButton = document.createElement('button');
        debugButton.textContent = '🔧';
        debugButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(102, 126, 234, 0.8);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            color: white;
            font-size: 16px;
            cursor: pointer;
            z-index: 9999;
        `;

        debugButton.addEventListener('click', () => {
            debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
            updateDebugInfo();
        });

        document.body.appendChild(debugButton);

        // 全局调试函数
        window.toggleDebug = () => {
            debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
        };

        window.runDiagnostics = async () => {
            console.log('🔍 运行系统诊断...');
            const diagnostics = await runSystemDiagnostics();
            document.getElementById('debugInfo').innerHTML = formatDiagnostics(diagnostics);
        };

        console.log('✅ 调试工具已添加');
    }

    // 系统诊断
    async function runSystemDiagnostics() {
        const diagnostics = {
            timestamp: new Date().toISOString(),
            browser: navigator.userAgent,
            url: window.location.href,
            localStorage: {
                available: typeof(Storage) !== "undefined",
                messagesCount: localStorage.getItem('messages') ? JSON.parse(localStorage.getItem('messages')).length : 0,
                size: JSON.stringify(localStorage).length
            },
            server: {
                health: false,
                responseTime: null,
                error: null
            },
            dom: {
                messageForm: !!document.getElementById('messageForm'),
                messageList: !!document.getElementById('messageList')
            }
        };

        // 测试服务器连接
        try {
            const startTime = Date.now();
            const response = await fetch('/api/health', { timeout: 5000 });
            const endTime = Date.now();

            if (response.ok) {
                diagnostics.server.health = true;
                diagnostics.server.responseTime = endTime - startTime;
                const data = await response.json();
                diagnostics.server.data = data;
            }
        } catch (error) {
            diagnostics.server.error = error.message;
        }

        return diagnostics;
    }

    // 格式化诊断信息
    function formatDiagnostics(diagnostics) {
        return `
            <div><strong>时间:</strong> ${new Date(diagnostics.timestamp).toLocaleString()}</div>
            <div><strong>浏览器:</strong> ${diagnostics.browser.substring(0, 50)}...</div>
            <div><strong>URL:</strong> ${diagnostics.url}</div>
            <div><strong>LocalStorage:</strong> ${diagnostics.localStorage.available ? '✅' : '❌'} (${diagnostics.localStorage.messagesCount} 条留言)</div>
            <div><strong>服务器状态:</strong> ${diagnostics.server.health ? '✅ 在线' : '❌ 离线'}</div>
            ${diagnostics.server.responseTime ? `<div><strong>响应时间:</strong> ${diagnostics.server.responseTime}ms</div>` : ''}
            ${diagnostics.server.error ? `<div><strong>错误:</strong> ${diagnostics.server.error}</div>` : ''}
            <div><strong>DOM元素:</strong> ${Object.values(diagnostics.dom).filter(Boolean).length}/${Object.keys(diagnostics.dom).length} 正常</div>
        `;
    }

    // 更新调试信息
    function updateDebugInfo() {
        const debugInfo = document.getElementById('debugInfo');
        if (debugInfo) {
            debugInfo.innerHTML = `
                <div><strong>当前留言数:</strong> ${messages.length}</div>
                <div><strong>页面加载:</strong> ${Math.round(performance.now())}ms</div>
            `;
        }
    }

    // 添加调试工具（开发环境）
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        addDebugTools();
    }

    // 初始化留言系统
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

// 交叉观察器动画
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

document.querySelectorAll('.skill-card, .work-item, .contact-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});
