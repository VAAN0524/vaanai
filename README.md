# Vaan 个人主页 v1.0

> 一个现代化、响应式的个人主页，具备完整的留言板功能和优雅的用户体验。

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-production-brightgreen.svg)

## ✨ 功能特性

### 🎨 界面设计
- 🌊 **水波纹特效**: 点击页面任意位置产生炫酷的多层水波纹效果（8x缩放）
- 📱 **响应式设计**: 完美适配桌面端、平板和移动端
- 🎯 **现代UI设计**: 渐变色彩，流畅动画，卡片式布局
- 🎪 **图标系统**: 集成Lucide图标库，视觉效果出色

### 💬 留言系统
- 📝 **完整留言功能**: 支持昵称和留言内容提交
- 🔢 **实时字符计数**: 昵称20字符，留言500字符限制
- 📍 **地理位置显示**: 显示留言者的大致地理位置
- 🕐 **时间戳记录**: 精确记录留言时间
- 🔄 **实时同步**: 新留言立即显示并持久化

### 🔗 数据同步
- 💾 **GitHub存储**: 使用GitHub Issues作为数据库
- ☁️ **Cloudflare部署**: 优化的静态网站托管
- 🔄 **智能回退**: GitHub → 本地存储 → 默认留言的多层机制
- ⚡ **强制刷新**: 确保数据一致性的刷新机制
- 📊 **30秒缓存**: 平衡性能与实时性的智能缓存

### 🛡️ 隐私保护
- 🔒 **隐私保护模式**: 只显示必要的公开信息
- 🎭 **IP模糊化**: 隐藏真实IP地址，保护用户隐私
- 📍 **位置模糊**: 只显示大致地理区域
- 🔍 **数据最小化**: 遵循隐私保护最佳实践

## 🚀 快速开始

### 在线预览
👉 **[https://vaan.pages.dev](https://vaan.pages.dev)**

### 本地运行
```bash
# 克隆项目
git clone https://github.com/VAAN0524/test.git

# 进入项目目录
cd test

# 使用任意HTTP服务器运行
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# 或者使用Live Server等VS Code插件
```

## 📱 技术栈

### 前端技术
- **HTML5** - 语义化结构
- **CSS3** - 现代样式和动画
- **JavaScript ES6+** - 交互逻辑
- **Lucide** - 图标库

### 后端集成
- **GitHub API v4** - 数据存储
- **Cloudflare Pages** - 静态托管
- **localStorage** - 本地缓存

### 设计工具
- **响应式设计** - CSS Grid + Flexbox
- **动画效果** - CSS Transitions + Animations
- **性能优化** - 懒加载 + 缓存策略

## 📁 项目结构

```
test/
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式文件
├── js/
│   ├── script.js           # 主要逻辑
│   ├── github-sync.js      # GitHub同步
│   ├── cloudflare-sync.js  # Cloudflare同步
│   └── config-helper.js    # 配置助手
├── images/                 # 图片资源
├── config-helper.js        # 全局配置
├── README.md               # 项目说明
├── CHANGELOG.md            # 更新日志
└── LICENSE                 # 开源协议
```

## 🔧 配置说明

### GitHub配置
项目已预配置GitHub仓库和访问令牌，无需额外配置即可使用。

### 自定义配置
如需使用自己的仓库，请修改 `config-helper.js` 中的配置：
```javascript
window.CONFIG = {
    github: {
        token: 'your_github_token',
        repo: 'your_username/your_repo'
    }
};
```

## 🌟 版本历史

### v1.0.0 (2025-10-29)
- 🎉 首次正式发布
- ✨ 完整的个人主页功能
- 💬 留言板系统
- 📱 响应式设计
- 🔒 隐私保护机制
- ⚡ 性能优化

详见 [CHANGELOG.md](CHANGELOG.md)

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

- 感谢所有参与测试和反馈的用户
- 感谢 [Claude Code](https://claude.com/claude-code) 的技术支持
- 感谢 [Lucide](https://lucide.dev/) 提供的优秀图标库

---

**Made with ❤️ by Vaan**

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **后端**: Node.js, Express.js
- **样式**: CSS Grid, Flexbox, CSS 动画
- **图标**: Lucide Icons
- **数据存储**: JSON 文件 + localStorage

## 留言板功能

### 功能说明

- ✅ 输入昵称和留言内容
- ✅ 自动获取访客地理位置和IP信息
- ✅ 实时字符计数
- ✅ 内容安全过滤
- ✅ 本地存储备份
- ✅ 服务器同步保存
- ✅ 留言展示和滚动显示

### 数据同步机制

1. **优先级**: 服务器数据 > 本地数据
2. **自动同步**: 页面加载时自动从服务器同步最新留言
3. **离线支持**: 服务器不可用时自动使用本地存储
4. **实时保存**: 提交留言时同时保存到服务器和本地

### API 接口

- `GET /api/messages` - 获取所有留言
- `POST /api/messages` - 提交新留言
- `GET /api/health` - 服务器健康检查

## 水波纹特效

- 🎯 点击页面任意位置触发
- 🌈 随机色彩变化
- 💫 物理模拟动画
- 🔄 波形干涉效果
- 📏 已放大4倍（从原来的8倍缩放改为32倍）

## 浏览器支持

支持所有现代浏览器：
- Chrome
- Firefox
- Safari
- Edge

## 部署

### Vercel 部署（推荐）

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 中导入项目
3. 自动部署完成

### 传统服务器部署

1. 安装 Node.js 环境
2. 上传项目文件到服务器
3. 运行 `npm install`
4. 使用 PM2 或 forever 保持服务运行

## 开发

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 生产模式运行
npm start
```

## 更新日志

### v1.0.0
- ✨ 新增水波纹特效（放大4倍）
- 🔧 修复留言板服务器保存功能
- 🌐 添加服务器同步机制
- 📱 优化响应式设计
- 🎨 改进UI动画效果

## 联系方式

- Email: 448484359@163.com
- GitHub: https://github.com/VAAN0524

---

© 2025 Vaan. All rights reserved.
