# Vaan 个人主页 v2.0

> 一个现代化、响应式的个人主页，采用深色新拟态（Dark Neumorphism）设计风格，具备完整的留言板功能和优雅的用户体验。

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-production-brightgreen.svg)
![Style](https://img.shields.io/badge/style-Dark%20Neumorphism-purple.svg)

## ✨ 功能特性

### 🎨 界面设计 (v2.0 全新升级)
- **深色新拟态风格**: 采用现代化的深色新拟态设计语言
- **玻璃态效果**: 导航栏和卡片采用毛玻璃模糊效果
- **渐变网格背景**: 动态移动的网格背景增强视觉层次
- **渐变光晕**: 两个彩色光晕在背景中脉动
- **粒子光效**: 带发光效果的浮动粒子
- **3D悬停效果**: 卡片悬停时的3D变换和光泽扫过
- **技能条流光**: 三色渐变持续流动的技能进度条
- **光泽扫过动画**: 按钮和卡片的动态光泽效果

### 🌊 交互动画
- **水波纹特效**: 点击页面产生炫酷的多层水波纹效果
- **打字机效果**: Hero区域的打字机文字动画
- **导航下划线**: 导航链接悬停时的下划线滑入
- **图标旋转**: 社交链接和图标悬停时的旋转效果
- **发光阴影**: 多个元素的脉冲发光动画
- **视差滚动**: 可选的滚动视差效果

### 💬 留言系统
- 📝 **完整留言功能**: 支持昵称和留言内容提交
- 🔢 **实时字符计数**: 昵称20字符，留言500字符限制
- 📍 **地理位置显示**: 显示留言者的大致地理位置
- 🕐 **时间戳记录**: 精确记录留言时间
- 🔄 **实时同步**: 新留言立即显示并持久化
- 🎨 **美化留言卡片**: 左侧彩色边条和位移效果

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
git clone https://github.com/VAAN0524/vaanai.git

# 进入项目目录
cd vaanai

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
  - CSS Grid + Flexbox 布局
  - Backdrop-filter 毛玻璃效果
  - CSS 渐变和动画
- **JavaScript ES6+** - 交互逻辑
- **Lucide** - 图标库

### 后端集成
- **GitHub API v4** - 数据存储
- **Cloudflare Pages** - 静态托管
- **localStorage** - 本地缓存

### 设计特性
- **深色新拟态** - 现代化的UI设计语言
- **玻璃态效果** - Backdrop-filter 模糊
- **渐变动画** - 多层渐变效果
- **3D变换** - 卡片悬停效果
- **性能优化** - 懒加载 + 缓存策略

## 📁 项目结构

```
vaanai/
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式文件（深色新拟态）
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

## 🎨 设计特色

### 深色新拟态风格
- **凸起效果**: 元素从表面凸起的立体效果
- **凹陷效果**: 按压状态的凹陷效果
- **光影系统**: 精心设计的亮色和暗色阴影
- **圆角设计**: 统一的圆角系统

### 玻璃态效果
- **毛玻璃模糊**: backdrop-filter 实现的模糊效果
- **半透明背景**: 渐变半透明背景
- **边框高光**: 微妙的边框高光效果

### 动画系统
- **淡入动画**: fadeInUp、fadeInScale
- **滑入动画**: slideInLeft、slideInRight
- **悬停效果**: 3D变换、光泽扫过
- **脉冲效果**: pulse-glow、heartbeat

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

### v2.0.0 (2025-01-17) - 深色新拟态设计
- 🎨 **全新设计**: 深色新拟态风格
- ✨ **玻璃态效果**: 毛玻璃导航栏和卡片
- 🌈 **渐变背景**: 动态网格和光晕背景
- 💫 **3D悬停**: 卡片的3D变换效果
- 🎯 **技能条流光**: 三色渐变流动动画
- 🌊 **光泽扫过**: 按钮和卡片的光泽效果
- 📱 **响应式优化**: 更好的移动端体验
- 🎭 **动画增强**: 多个新的动画效果

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
- 灵感来源于现代新拟态设计趋势

---

**Made with ❤️ by Vaan**

## 联系方式

- Email: 448484359@163.com
- GitHub: https://github.com/VAAN0524

---

© 2025 Vaan. All rights reserved.
