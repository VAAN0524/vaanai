// Cloudflare Pages 专用留言同步系统
// 支持多种后端：Cloudflare Workers, GitHub Issues, LocalStorage

class CloudflareMessageSync {
    constructor() {
        this.apiBase = this.detectAPIBase();
        this.backend = 'unknown';
        this.githubSync = null;

        // 检测环境并初始化
        this.init();
    }

    // 检测 API 基础 URL
    detectAPIBase() {
        const hostname = window.location.hostname;

        if (hostname.includes('pages.dev') || hostname.includes('github.io')) {
            // Cloudflare Pages 或 GitHub Pages
            return window.location.origin;
        } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // 本地开发
            return 'http://localhost:3000';
        } else {
            // 其他环境，使用当前域名
            return window.location.origin;
        }
    }

    // 初始化系统
    async init() {
        console.log('🌟 初始化 Cloudflare 留言系统...');
        console.log(`📡 API Base: ${this.apiBase}`);

        // 尝试不同的后端
        await this.detectBackend();

        // 初始化 GitHub 备用方案
        this.initGitHubSync();
    }

    // 检测可用的后端
    async detectBackend() {
        const backends = [
            { name: 'Cloudflare Workers', url: '/api/health' },
            { name: 'Local Server', url: 'http://localhost:3000/api/health' }
        ];

        for (const backend of backends) {
            try {
                console.log(`🔍 测试 ${backend.name}...`);
                const response = await fetch(backend.url, {
                    method: 'GET',
                    timeout: 5000
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ ${backend.name} 可用:`, data);
                    this.backend = backend.name.toLowerCase().replace(' ', '-');
                    return true;
                }
            } catch (error) {
                console.log(`❌ ${backend.name} 不可用:`, error.message);
            }
        }

        console.log('⚠️ 没有检测到可用的后端，将使用本地存储');
        this.backend = 'local';
        return false;
    }

    // 初始化 GitHub 备用方案
    initGitHubSync() {
        // 检查是否配置了 GitHub 凭据
        const githubToken = localStorage.getItem('github_token');
        const githubRepo = localStorage.getItem('github_repo');

        if (githubToken && githubRepo) {
            if (typeof GitHubIssuesSync !== 'undefined') {
                this.githubSync = new GitHubIssuesSync(githubRepo, githubToken);
                console.log('🐙 GitHub Issues 备用方案已初始化');
            }
        }
    }

    // 获取所有留言
    async getMessages() {
        try {
            // 优先使用在线后端
            if (this.backend !== 'local') {
                const onlineMessages = await this.getOnlineMessages();
                if (onlineMessages && onlineMessages.length > 0) {
                    return onlineMessages;
                }
            }

            // 使用 GitHub 备用方案
            if (this.githubSync) {
                const githubMessages = await this.githubSync.getAllMessages();
                if (githubMessages && githubMessages.length > 0) {
                    return githubMessages;
                }
            }

            // 最后使用本地存储
            return this.getLocalMessages();

        } catch (error) {
            console.error('获取留言失败:', error);
            return this.getDefaultMessages();
        }
    }

    // 从在线后端获取留言
    async getOnlineMessages() {
        try {
            let url;
            if (this.backend === 'cloudflare-workers') {
                url = '/api/messages';
            } else if (this.backend === 'local-server') {
                url = 'http://localhost:3000/api/messages';
            }

            const response = await fetch(url, {
                method: 'GET',
                timeout: 10000
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    console.log(`📋 从 ${this.backend} 加载了 ${result.data.length} 条留言`);
                    return result.data;
                }
            }
        } catch (error) {
            console.warn(`从 ${this.backend} 获取留言失败:`, error.message);
        }

        return null;
    }

    // 从本地存储获取留言
    getLocalMessages() {
        try {
            const stored = localStorage.getItem('messages');
            if (stored) {
                const messages = JSON.parse(stored);
                console.log(`📦 从本地存储加载了 ${messages.length} 条留言`);
                return messages;
            }
        } catch (error) {
            console.warn('读取本地存储失败:', error);
        }

        return this.getDefaultMessages();
    }

    // 提交新留言
    async saveMessage(messageData) {
        try {
            // 优先尝试在线后端
            if (this.backend !== 'local') {
                const onlineResult = await this.saveOnlineMessage(messageData);
                if (onlineResult.success) {
                    return onlineResult;
                }
            }

            // 尝试 GitHub 备用方案
            if (this.githubSync) {
                const githubResult = await this.githubSync.createMessage(messageData);
                if (githubResult.success) {
                    return githubResult;
                }
            }

            // 最后保存到本地存储
            return this.saveLocalMessage(messageData);

        } catch (error) {
            console.error('保存留言失败:', error);
            return {
                success: false,
                message: '保存失败，但已保存到本地'
            };
        }
    }

    // 保存到在线后端
    async saveOnlineMessage(messageData) {
        try {
            let url;
            if (this.backend === 'cloudflare-workers') {
                url = '/api/messages';
            } else if (this.backend === 'local-server') {
                url = 'http://localhost:3000/api/messages';
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ 留言已保存到 ${this.backend}`);
                return result;
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn(`保存到 ${this.backend} 失败:`, error.message);
            return { success: false, error: error.message };
        }
    }

    // 保存到本地存储
    saveLocalMessage(messageData) {
        try {
            let messages = this.getLocalMessages();

            // 避免重复
            if (messages.find(msg => msg.id === messageData.id)) {
                return { success: true, message: '留言已存在' };
            }

            messages.push(messageData);

            // 限制本地存储数量
            if (messages.length > 100) {
                messages = messages.slice(-100);
            }

            localStorage.setItem('messages', JSON.stringify(messages));
            console.log('💾 留言已保存到本地存储');

            return {
                success: true,
                message: '留言已保存到本地',
                backend: 'local'
            };
        } catch (error) {
            console.error('保存到本地存储失败:', error);
            return { success: false, message: '本地保存失败' };
        }
    }

    // 获取默认留言
    getDefaultMessages() {
        const now = Date.now();
        return [
            {
                id: (now - 3000).toString(),
                name: "系统管理员",
                text: "欢迎来到 Vaan 的个人主页！这里支持留言功能，您可以留下您的想法和祝福。",
                time: new Date(now - 3000000).toISOString().replace('T', ' ').substring(0, 16),
                location: "Cloudflare, Global",
                ip: "127.0.0.1",
                isDefault: true
            },
            {
                id: (now - 2000).toString(),
                name: "Vaan",
                text: "感谢您的访问！欢迎留言交流，我会认真阅读每一条留言。",
                time: new Date(now - 2000000).toISOString().replace('T', ' ').substring(0, 16),
                location: "Cloudflare, Global",
                ip: "127.0.0.1",
                isDefault: true
            },
            {
                id: (now - 1000).toString(),
                name: "访客用户",
                text: "网站设计得真漂亮！Cloudflare Pages 部署速度很快！🚀",
                time: new Date(now - 1000000).toISOString().replace('T', ' ').substring(0, 16),
                location: "Cloudflare, Global",
                ip: "192.168.1.100",
                isDefault: true
            }
        ];
    }

    // 获取系统状态
    async getStatus() {
        const status = {
            backend: this.backend,
            apiBase: this.apiBase,
            hostname: window.location.hostname,
            features: [],
            storage: {
                localStorage: typeof(Storage) !== "undefined",
                indexedDB: 'indexedDB' in window,
                sessionStorage: typeof(Storage) !== "undefined"
            }
        };

        // 检测功能可用性
        if (this.backend !== 'local') {
            status.features.push('online-sync');
        }

        if (this.githubSync) {
            status.features.push('github-backup');
        }

        status.features.push('local-storage');

        return status;
    }

    // 配置 GitHub 备用方案
    configureGitHub(token, repo) {
        localStorage.setItem('github_token', token);
        localStorage.setItem('github_repo', repo);

        if (typeof GitHubIssuesSync !== 'undefined') {
            this.githubSync = new GitHubIssuesSync(repo, token);
            console.log('🐙 GitHub 备用方案已配置');
        }
    }
}

// 导出给主脚本使用
window.CloudflareMessageSync = CloudflareMessageSync;