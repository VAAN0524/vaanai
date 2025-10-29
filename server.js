const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'messages.json');

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 确保消息文件存在
async function ensureMessagesFile() {
    try {
        await fs.ensureFile(DATA_FILE);
        const data = await fs.readJson(DATA_FILE).catch(() => []);
        return data;
    } catch (error) {
        console.error('确保消息文件存在时出错:', error);
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
        const { name, text, location, ip } = req.body;

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

        // 创建新消息
        const newMessage = {
            id: Date.now(),
            name: String(name).trim(),
            text: String(text).trim(),
            location: location || '未知地区',
            ip: ip || '未知',
            time: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };

        // 读取现有消息
        const messages = await readMessages();

        // 添加新消息
        messages.push(newMessage);

        // 保存到文件
        const saved = await saveMessages(messages);

        if (saved) {
            res.json({
                success: true,
                message: '留言保存成功',
                data: newMessage
            });
        } else {
            res.status(500).json({
                success: false,
                message: '留言保存失败'
            });
        }

    } catch (error) {
        console.error('保存消息时出错:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '服务器运行正常',
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📁 数据文件: ${DATA_FILE}`);

    // 确保消息文件存在
    ensureMessagesFile().then(messages => {
        console.log(`📋 初始消息数量: ${messages.length}`);
    });
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