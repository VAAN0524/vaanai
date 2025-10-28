// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成');
    
    // 初始化Lucide图标
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
        console.log('Lucide图标已初始化');
    }

    // 初始化所有功能
    createParticles();
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

// 初始化留言系统
function initMessageSystem() {
    console.log('🚀 初始化留言系统...');

    const messageForm = document.getElementById('messageForm');
    const messageList = document.getElementById('messageList');
    const tickerContent = document.getElementById('tickerContent');
    const nameInput = document.getElementById('name');
    const messageInput = document.getElementById('message');

    if (!messageForm || !messageList || !tickerContent || !nameInput || !messageInput) {
        console.error('❌ 找不到必要的DOM元素:', {
            messageForm: !!messageForm,
            messageList: !!messageList,
            tickerContent: !!tickerContent,
            nameInput: !!nameInput,
            messageInput: !!messageInput
        });
        return;
    }

    console.log('✅ 所有DOM元素已找到');

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

    // 渲染留言列表
    function renderMessages() {
        console.log('渲染留言列表，共', messages.length, '条');
        messageList.innerHTML = '';
        
        const reversedMessages = [...messages].reverse();
        
        reversedMessages.forEach(msg => {
            const messageItem = document.createElement('div');
            messageItem.className = 'message-item';
            
            const location = msg.location || '未知地区';
            const ip = maskIP(msg.ip || '未知');
            
            messageItem.innerHTML = `
                <div class="message-header">
                    <div class="message-author-info">
                        <span class="message-author">${escapeHtml(msg.name)}</span>
                        <span class="message-location">
                            <i data-lucide="map-pin" class="location-icon"></i>
                            ${escapeHtml(location)}
                        </span>
                    </div>
                    <div class="message-meta">
                        <span class="message-time">
                            <i data-lucide="clock" class="time-icon"></i>
                            ${msg.time}
                        </span>
                        <span class="message-ip">IP: ${ip}</span>
                    </div>
                </div>
                <p class="message-text">${escapeHtml(msg.text)}</p>
            `;
            
            messageList.appendChild(messageItem);
        });
        
        // 重新初始化图标
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        console.log('留言列表渲染完成');
    }

    // 渲染底部滚动条
    function renderTicker() {
        console.log('渲染滚动条');
        
        if (!tickerContent) return;
        
        if (messages.length === 0) {
            tickerContent.innerHTML = `
                <div class="ticker-item">
                    <span class="ticker-text">暂无留言，快来成为第一个留言的访客吧！</span>
                </div>
            `;
            return;
        }

        const tickerItems = messages.map(msg => {
            const location = msg.location || '未知地区';
            return `
                <div class="ticker-item">
                    <span class="ticker-author">${escapeHtml(msg.name)}</span>
                    <span class="ticker-location">[${escapeHtml(location)}]</span>
                    <span class="ticker-text">${escapeHtml(msg.text)}</span>
                </div>
            `;
        }).join('');
        
        tickerContent.innerHTML = tickerItems + tickerItems;
        console.log('滚动条渲染完成');
    }

    // 获取地理位置（多个API源，提高成功率）
    async function getUserLocation() {
        const apis = [
            {
                url: 'https://ipapi.co/json/',
                parser: (data) => ({
                    ip: data.ip,
                    location: data.city ? `${data.city}, ${data.country_name}` : data.country_name
                })
            },
            {
                url: 'https://api.ipify.org?format=json',
                parser: (data) => ({
                    ip: data.ip,
                    location: '未知地区'
                })
            }
        ];

        for (const api of apis) {
            try {
                console.log(`尝试获取地理位置，使用API: ${api.url}`);

                // 使用 AbortController 设置超时
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch(api.url, {
                    signal: controller.signal,
                    mode: 'cors'
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const result = api.parser(data);

                console.log('地理位置获取成功:', result);
                return {
                    ip: result.ip || '未知',
                    location: result.location || '未知地区'
                };

            } catch (error) {
                console.warn(`API ${api.url} 失败:`, error.message);
                continue;
            }
        }

        console.log('所有地理位置API都失败，使用默认值');
        return {
            ip: generateRandomIP(),
            location: '未知地区'
        };
    }

    // 生成随机IP（用于演示）
    function generateRandomIP() {
        return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    }

    // 表单提交事件
    messageForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('表单提交事件触发');

        const name = nameInput && nameInput.value ? nameInput.value.trim() : '';
        const text = messageInput && messageInput.value ? messageInput.value.trim() : '';
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
            // 获取地理位置
            showMessage('正在获取地理位置...', 'info');
            const location = await getUserLocation();

            // 创建新留言
            const newMessage = {
                id: Date.now(),
                name: name,
                text: text,
                time: formatDate(new Date()),
                location: location.location,
                ip: location.ip
            };

            console.log('新留言:', newMessage);

            // 添加到数组
            messages.push(newMessage);

            // 保存到localStorage
            localStorage.setItem('messages', JSON.stringify(messages));
            console.log('留言已保存到localStorage');

            // 清空输入框
            if (nameInput) nameInput.value = '';
            if (messageInput) messageInput.value = '';

            // 触发计数器更新
            if (nameInput) nameInput.dispatchEvent(new Event('input'));
            if (messageInput) messageInput.dispatchEvent(new Event('input'));

            // 重新渲染
            renderMessages();
            renderTicker();

            // 显示成功提示
            showMessage('留言发布成功！', 'success');

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
        const messageInput = document.getElementById('message');
        const nameCounter = document.getElementById('nameCounter');
        const messageCounter = document.getElementById('messageCounter');

        console.log('字符计数器初始化:', {
            nameInput: !!nameInput,
            messageInput: !!messageInput,
            nameCounter: !!nameCounter,
            messageCounter: !!messageCounter
        });

        if (nameInput && nameCounter) {
            function updateNameCounter() {
                const count = nameInput.value ? nameInput.value.length : 0;
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
                const count = messageInput.value ? messageInput.value.length : 0;
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

    // 初始渲染
    renderMessages();
    renderTicker();

    console.log('✅ 留言系统初始化完成');
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
