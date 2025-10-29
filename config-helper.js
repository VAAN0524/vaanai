// Cloudflare Pages 配置助手
// 帮助用户快速配置 GitHub 备用方案

class ConfigHelper {
    constructor() {
        this.modal = null;
        this.init();
    }

    init() {
        // 检查是否需要配置
        if (this.needsConfiguration()) {
            this.showConfigModal();
        }
    }

    needsConfiguration() {
        const hostname = window.location.hostname;

        // 开发环境不显示配置弹窗
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return false;
        }

        // 检查是否有有效配置
        const hasToken = localStorage.getItem('github_token');
        const hasRepo = localStorage.getItem('github_repo');

        // 预设配置检查
        const defaultToken = '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';
        const defaultRepo = 'VAAN0524/vaanai';

        // 如果已配置为预设值，不显示弹窗
        if (hasToken === defaultToken && hasRepo === defaultRepo) {
            console.log('✅ 检测到预设配置，跳过配置弹窗');
            return false;
        }

        // 如果没有配置或配置不匹配，需要显示弹窗
        const needsConfig = !hasToken || !hasRepo ||
                            hasToken !== defaultToken ||
                            hasRepo !== defaultRepo;

        if (needsConfig) {
            console.log('⚠️ 需要配置GitHub信息', {
                hasToken: !!hasToken,
                hasRepo: !!hasRepo,
                tokenMatch: hasToken === defaultToken,
                repoMatch: hasRepo === defaultRepo
            });
        }

        return needsConfig;
    }

    showConfigModal() {
        // 创建模态框
        this.modal = document.createElement('div');
        this.modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        this.modal.innerHTML = `
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 12px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                color: #333;
            ">
                <h2 style="margin-top: 0; color: #667eea;">🌥️ Cloudflare Pages 配置</h2>

                <div style="margin: 1.5rem 0;">
                    <p style="margin-bottom: 1rem; line-height: 1.6;">
                        检测到您正在使用 Cloudflare Pages！为了保存留言数据，建议配置 GitHub 备用方案。
                    </p>

                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <h4 style="margin-top: 0; color: #495057;">📋 配置步骤：</h4>
                        <ol style="margin: 0.5rem 0; padding-left: 1.5rem; color: #6c757d;">
                            <li>访问 <a href="https://github.com/settings/tokens" target="_blank" style="color: #667eea;">GitHub Settings</a></li>
                            <li>点击 "Generate new token (classic)"</li>
                            <li>选择权限：<code>repo</code>（完全控制仓库）</li>
                            <li>复制生成的 token</li>
                        </ol>
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">GitHub Token:</label>
                        <input type="password" id="githubToken" placeholder="ghp_xxxxxxxxxxxx" style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 2px solid #e9ecef;
                            border-radius: 6px;
                            font-size: 14px;
                            box-sizing: border-box;
                        ">
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">GitHub 仓库:</label>
                        <input type="text" id="githubRepo" placeholder="VAAN0524/vaanai" style="
                            width: 100%;
                            padding: 0.75rem;
                            border: 2px solid #e9ecef;
                            border-radius: 6px;
                            font-size: 14px;
                            box-sizing: border-box;
                        ">
                    </div>
                </div>

                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button onclick="configHelper.skipConfig()" style="
                        padding: 0.75rem 1.5rem;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    ">跳过</button>
                    <button onclick="configHelper.saveConfig()" style="
                        padding: 0.75rem 1.5rem;
                        background: #667eea;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    ">保存配置</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);
    }

    saveConfig() {
        const token = document.getElementById('githubToken').value.trim();
        const repo = document.getElementById('githubRepo').value.trim();

        if (!token || !repo) {
            this.showMessage('请填写完整的配置信息', 'error');
            return;
        }

        // 验证 token 格式
        if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
            this.showMessage('Token 格式不正确', 'error');
            return;
        }

        // 验证 repo 格式
        if (!repo.includes('/')) {
            this.showMessage('仓库格式不正确，应为：用户名/仓库名', 'error');
            return;
        }

        // 保存配置
        localStorage.setItem('github_token', token);
        localStorage.setItem('github_repo', repo);

        this.showMessage('配置保存成功！页面即将刷新...', 'success');

        // 重新初始化同步系统
        setTimeout(() => {
            location.reload();
        }, 1500);
    }

    skipConfig() {
        this.closeModal();
        this.showMessage('已跳过配置，将使用本地存储', 'info');
    }

    closeModal() {
        if (this.modal) {
            document.body.removeChild(this.modal);
            this.modal = null;
        }
    }

    showMessage(text, type) {
        // 移除现有消息
        const existingMessage = document.querySelector('.config-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 创建新消息
        const message = document.createElement('div');
        message.className = 'config-message';
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10001;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
        `;

        // 根据类型设置背景色
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };
        message.style.backgroundColor = colors[type] || colors.info;
        message.textContent = text;

        document.body.appendChild(message);

        // 显示动画
        setTimeout(() => {
            message.style.opacity = '1';
            message.style.transform = 'translateX(0)';
        }, 100);

        // 3秒后自动消失
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, 3000);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 首先设置预设配置（在创建ConfigHelper之前）
    const defaultToken = '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';
    const defaultRepo = 'VAAN0524/vaanai';

    // 检查是否已配置，如果没有则设置预设值
    const currentToken = localStorage.getItem('github_token');
    const currentRepo = localStorage.getItem('github_repo');

    if (!currentToken) {
        localStorage.setItem('github_token', defaultToken);
        console.log('✅ 已设置默认 GitHub Token');
    }

    if (!currentRepo) {
        localStorage.setItem('github_repo', defaultRepo);
        console.log('✅ 已设置默认 GitHub 仓库');
    }

    // 等待主要脚本加载完成
    setTimeout(() => {
        window.configHelper = new ConfigHelper();

        // 在开发环境下添加配置按钮（可选）
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            addConfigButton();
        }
    }, 1000);
});

// 添加配置按钮（开发环境）
function addConfigButton() {
    const button = document.createElement('button');
    button.innerHTML = '⚙️ 重新配置';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(102, 126, 234, 0.9);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        font-size: 14px;
        cursor: pointer;
        z-index: 9998;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
    `;

    button.addEventListener('mouseenter', () => {
        button.style.background = 'rgba(102, 126, 234, 1)';
        button.style.transform = 'translateY(-2px)';
    });

    button.addEventListener('mouseleave', () => {
        button.style.background = 'rgba(102, 126, 234, 0.9)';
        button.style.transform = 'translateY(0)';
    });

    button.addEventListener('click', () => {
        if (window.configHelper) {
            window.configHelper.showConfigModal();
        }
    });

    document.body.appendChild(button);
    console.log('⚙️ 配置按钮已添加（仅开发环境）');
}