// GitHub Issues 留言同步系统
// 适用于 Cloudflare Pages 等静态网站托管

class GitHubIssuesSync {
    constructor(repo, token) {
        this.repo = repo; // 格式: "owner/repo"
        this.token = token;
        this.apiBase = 'https://api.github.com';
        this.cacheKey = 'github_issues_cache';
        this.cacheExpiry = 5 * 60 * 1000; // 5分钟缓存
    }

    // 创建 GitHub Issue
    async createMessage(message) {
        try {
            const issueData = {
                title: `留言 - ${message.name}`,
                body: this.formatIssueBody(message),
                labels: ['留言', 'guest-message']
            };

            const response = await fetch(`${this.apiBase}/repos/${this.repo}/issues`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Vaan-Personal-Website/1.0'
                },
                body: JSON.stringify(issueData)
            });

            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.status}`);
            }

            const issue = await response.json();
            console.log('✅ 留言已保存到 GitHub Issues:', issue.html_url);
            return { success: true, data: issue };

        } catch (error) {
            console.error('❌ 保存到 GitHub Issues 失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 获取所有留言 Issues
    async getAllMessages() {
        try {
            // 检查缓存
            const cached = this.getCachedData();
            if (cached) {
                console.log('📦 使用缓存的 GitHub Issues 数据');
                return cached;
            }

            const response = await fetch(
                `${this.apiBase}/repos/${this.repo}/issues?labels=留言&state=open&sort=created&direction=desc`,
                {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'User-Agent': 'Vaan-Personal-Website/1.0'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.status}`);
            }

            const issues = await response.json();
            const messages = issues.map(issue => this.parseIssueToMessage(issue));

            // 缓存数据
            this.setCachedData(messages);

            console.log(`📋 从 GitHub Issues 加载了 ${messages.length} 条留言`);
            return messages;

        } catch (error) {
            console.error('❌ 从 GitHub Issues 加载留言失败:', error);
            return [];
        }
    }

    // 格式化 Issue 内容（极简版本，最大隐私保护）
    formatIssueBody(message) {
        return `${message.text}`;
    }

    // 解析 Issue 为留言格式（极简版本，最大隐私保护）
    parseIssueToMessage(issue) {
        // 从标题中提取昵称
        const titleMatch = issue.title.match(/^留言 - (.+)$/);
        const name = titleMatch ? titleMatch[1].trim() : '访客';

        // 留言内容就是 Issue 的 body
        const text = issue.body.trim() || '留言内容';

        return {
            id: issue.id,
            name: name,
            text: text,
            time: new Date(issue.created_at).toLocaleString('zh-CN'),
            githubUrl: issue.html_url,
            createdAt: issue.created_at,
            isGitHub: true
        };
    }

    // 获取缓存数据
    getCachedData() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp > this.cacheExpiry) {
                localStorage.removeItem(this.cacheKey);
                return null;
            }

            return data;
        } catch (error) {
            console.warn('读取缓存失败:', error);
            return null;
        }
    }

    // 设置缓存数据
    setCachedData(data) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('设置缓存失败:', error);
        }
    }

    // 清除缓存
    clearCache() {
        localStorage.removeItem(this.cacheKey);
    }
}

// 导出给主脚本使用
window.GitHubIssuesSync = GitHubIssuesSync;