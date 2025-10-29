const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'messages.json');

// 启动日志
console.log('='.repeat(50));
console.log('🚀 Vaan 个人主页服务器');
console.log('='.repeat(50));
console.log(`📁 工作目录: ${__dirname}`);
console.log(`📄 数据文件: ${DATA_FILE}`);
console.log(`🌐 端口: ${PORT}`);
console.log('='.repeat(50));

// 中间件
app.use(cors({
    origin: '*', // 允许所有来源
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// 请求日志中间件
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    next();
});

// 获取客户端真实IP
function getClientIP(req) {
    return req.headers['x-forwarded-for'] ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.ip ||
           '127.0.0.1';
}

// 地理位置API - 多个备用源
const locationAPIs = [
    {
        name: 'ipapi.co',
        url: 'http://ipapi.co/json/',
        parser: (data) => ({
            ip: data.ip,
            city: data.city,
            region: data.region,
            country: data.country_name,
            location: data.city ? `${data.city}, ${data.country_name}` : data.country_name
        })
    },
    {
        name: 'ip-api.com',
        url: 'http://ip-api.com/json/',
        parser: (data) => ({
            ip: data.query,
            city: data.city,
            region: data.regionName,
            country: data.country,
            location: data.city ? `${data.city}, ${data.country}` : data.country
        })
    },
    {
        name: 'ipify.org (仅IP)',
        url: 'https://api.ipify.org?format=json',
        parser: (data) => ({
            ip: data.ip,
            location: '未知地区'
        })
    }
];

// 获取地理位置信息
async function getLocationInfo(ip) {
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
        return {
            ip: ip,
            city: '本地',
            region: '局域网',
            country: 'China',
            location: '本地网络'
        };
    }

    for (const api of locationAPIs) {
        try {
            console.log(`🌍 尝试地理位置API: ${api.name}`);
            const response = await fetch(api.url, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Vaan-Personal-Website/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const result = api.parser(data);

            console.log(`✅ 地理位置获取成功 (${api.name}):`, result);
            return result;

        } catch (error) {
            console.warn(`❌ 地理位置API失败 (${api.name}):`, error.message);
            continue;
        }
    }

    // 所有API都失败，返回默认信息
    return {
        ip: ip,
        city: '未知',
        region: '未知',
        country: '未知',
        location: '未知地区'
    };
}

// 确保消息文件存在并初始化
async function ensureMessagesFile() {
    try {
        console.log('📁 检查数据文件...');

        // 确保文件存在
        await fs.ensureFile(DATA_FILE);

        // 尝试读取现有数据
        let data = [];
        try {
            data = await fs.readJson(DATA_FILE);
            console.log(`📋 读取到 ${data.length} 条现有留言`);
        } catch (readError) {
            console.log('📝 数据文件为空或损坏，正在初始化...');
        }

        // 如果没有数据，创建初始留言
        if (data.length === 0) {
            console.log('🌟 创建初始留言数据...');
            const initialMessages = [
                {
                    id: Date.now() - 3000,
                    name: "系统管理员",
                    text: "欢迎来到 Vaan 的个人主页！这里支持留言功能，您可以留下您的想法和祝福。",
                    time: new Date(Date.now() - 3000000).toISOString().replace('T', ' ').substring(0, 16),
                    location: "北京, China",
                    ip: "127.0.0.1",
                    isAdmin: true
                },
                {
                    id: Date.now() - 2000,
                    name: "Vaan",
                    text: "感谢您的访问！欢迎留言交流，我会认真阅读每一条留言。",
                    time: new Date(Date.now() - 2000000).toISOString().replace('T', ' ').substring(0, 16),
                    location: "上海, China",
                    ip: "127.0.0.1",
                    isAdmin: true
                },
                {
                    id: Date.now() - 1000,
                    name: "访客用户",
                    text: "网站设计得真漂亮！水波纹效果很炫酷！🌊",
                    time: new Date(Date.now() - 1000000).toISOString().replace('T', ' ').substring(0, 16),
                    location: "深圳, China",
                    ip: "192.168.1.100",
                    isAdmin: false
                }
            ];

            await fs.writeJson(DATA_FILE, initialMessages, { spaces: 2 });
            console.log('✅ 初始留言数据创建成功');
            return initialMessages;
        }

        return data;
    } catch (error) {
        console.error('❌ 初始化数据文件失败:', error);
        return [];
    }
}

// 读取消息
async function readMessages() {
    try {
        const messages = await fs.readJson(DATA_FILE);
        return messages;
    } catch (error) {
        console.error('读取消息失败:', error);
        return [];
    }
}

// 保存消息
async function saveMessages(messages) {
    try {
        await fs.writeJson(DATA_FILE, messages, { spaces: 2 });
        return true;
    } catch (error) {
        console.error('保存消息失败:', error);
        return false;
    }
}

// API路由

// 获取所有消息
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await readMessages();
        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取消息失败'
        });
    }
});

// 添加新消息
app.post('/api/messages', async (req, res) => {
    try {
        console.log('📝 收到留言提交请求:', req.body);

        const { name, text } = req.body;
        const clientIP = getClientIP(req);

        // 验证输入
        if (!name || !text) {
            return res.status(400).json({
                success: false,
                message: '昵称和留言内容不能为空'
            });
        }

        if (name.length > 20) {
            return res.status(400).json({
                success: false,
                message: '昵称不能超过20个字符'
            });
        }

        if (text.length > 500) {
            return res.status(400).json({
                success: false,
                message: '留言内容不能超过500个字符'
            });
        }

        // 内容过滤
        const forbiddenWords = ['<script', 'javascript:', 'onclick', 'onerror', 'onload'];
        const containsForbidden = forbiddenWords.some(word =>
            text.toLowerCase().includes(word) || name.toLowerCase().includes(word)
        );

        if (containsForbidden) {
            return res.status(400).json({
                success: false,
                message: '请勿输入不安全的内容'
            });
        }

        // 获取地理位置信息
        console.log('🌍 正在获取地理位置信息...');
        let locationInfo;
        try {
            locationInfo = await getLocationInfo(clientIP);
        } catch (locationError) {
            console.warn('⚠️ 地理位置获取失败，使用默认值:', locationError.message);
            locationInfo = {
                ip: clientIP,
                location: '未知地区'
            };
        }

        // 创建新消息
        const newMessage = {
            id: Date.now(),
            name: String(name).trim(),
            text: String(text).trim(),
            location: locationInfo.location,
            ip: locationInfo.ip,
            time: new Date().toISOString().replace('T', ' ').substring(0, 16),
            userAgent: req.get('User-Agent') || 'Unknown'
        };

        console.log('✨ 创建新留言:', newMessage);

        // 读取现有消息
        const messages = await readMessages();

        // 添加新消息
        messages.push(newMessage);

        // 保存到文件
        const saved = await saveMessages(messages);

        if (saved) {
            console.log(`💾 留言保存成功，当前总数: ${messages.length}`);
            res.json({
                success: true,
                message: '留言保存成功',
                data: newMessage
            });
        } else {
            console.error('❌ 留言保存失败');
            res.status(500).json({
                success: false,
                message: '留言保存失败'
            });
        }

    } catch (error) {
        console.error('❌ 保存消息时出错:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '服务器运行正常',
        timestamp: new Date().toISOString(),
        ip: getClientIP(req),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// 调试信息API
app.get('/api/debug', async (req, res) => {
    try {
        const stats = await fs.stat(DATA_FILE);
        const messages = await readMessages();

        res.json({
            success: true,
            data: {
                server: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    uptime: process.uptime(),
                    memory: process.memoryUsage()
                },
                dataFile: {
                    path: DATA_FILE,
                    exists: true,
                    size: stats.size,
                    modified: stats.mtime,
                    messageCount: messages.length
                },
                messages: messages.slice(-5), // 最近5条留言
                requestIP: getClientIP(req)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取调试信息失败',
            error: error.message
        });
    }
});

// 清空数据API (仅开发环境)
app.delete('/api/messages', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
            success: false,
            message: '生产环境不允许清空数据'
        });
    }

    try {
        fs.writeFileSync(DATA_FILE, '[]');
        res.json({
            success: true,
            message: '数据已清空'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '清空数据失败',
            error: error.message
        });
    }
});

// 启动服务器
app.listen(PORT, async () => {
    console.log(`\n🎉 服务器启动成功！`);
    console.log(`🌐 本地访问: http://localhost:${PORT}`);
    console.log(`📁 数据文件: ${DATA_FILE}`);
    console.log(`🕒 启动时间: ${new Date().toLocaleString()}`);

    try {
        // 确保消息文件存在并初始化
        const messages = await ensureMessagesFile();
        console.log(`📋 初始消息数量: ${messages.length}`);

        if (messages.length > 0) {
            console.log('📝 示例留言:');
            messages.slice(-3).forEach((msg, index) => {
                console.log(`   ${index + 1}. ${msg.name}: ${msg.text.substring(0, 30)}...`);
            });
        }

        console.log('\n🔗 可用的API端点:');
        console.log('   GET  /api/health   - 健康检查');
        console.log('   GET  /api/messages  - 获取所有留言');
        console.log('   POST /api/messages  - 提交新留言');
        console.log('   GET  /api/debug    - 调试信息');

        console.log('\n✨ 服务器已准备就绪，可以接收留言！');

    } catch (error) {
        console.error('❌ 初始化失败:', error);
    }
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 服务器正在关闭...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 服务器正在关闭...');
    process.exit(0);
});