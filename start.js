#!/usr/bin/env node

// 自动启动脚本 - 解决服务器不可用问题
const fs = require('fs');
const path = require('path');

console.log('🚀 启动 Vaan 个人主页服务器...\n');

// 检查Node.js版本
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 14) {
    console.error('❌ 需要 Node.js 14 或更高版本');
    console.error(`   当前版本: ${nodeVersion}`);
    process.exit(1);
}

console.log(`✅ Node.js 版本检查通过: ${nodeVersion}`);

// 检查package.json是否存在
const packagePath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packagePath)) {
    console.log('📦 package.json 不存在，正在创建...');

    const packageJson = {
        "name": "vaan-personal-website",
        "version": "1.0.0",
        "description": "Vaan的个人主页",
        "main": "server.js",
        "scripts": {
            "start": "node server.js",
            "dev": "nodemon server.js",
            "init": "node start.js"
        },
        "dependencies": {
            "express": "^4.18.2",
            "cors": "^2.8.5",
            "fs-extra": "^11.1.1"
        },
        "devDependencies": {
            "nodemon": "^3.0.2"
        },
        "keywords": ["personal", "website", "portfolio"],
        "author": "Vaan",
        "license": "MIT"
    };

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ package.json 创建成功');
}

// 检查node_modules是否存在
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.log('📦 正在安装依赖包...');

    const { execSync } = require('child_process');
    try {
        execSync('npm install', { stdio: 'inherit', cwd: __dirname });
        console.log('✅ 依赖包安装成功');
    } catch (error) {
        console.error('❌ 依赖包安装失败');
        console.error('   请手动运行: npm install');
        process.exit(1);
    }
} else {
    console.log('✅ 依赖包已存在');
}

// 初始化留言数据
const messagesPath = path.join(__dirname, 'messages.json');
if (!fs.existsSync(messagesPath)) {
    console.log('📝 正在初始化留言数据...');

    const initialMessages = [
        {
            id: 1,
            name: "系统管理员",
            text: "欢迎来到 Vaan 的个人主页！这里支持留言功能，您可以留下您的想法和祝福。",
            time: "2025-01-01 10:00",
            location: "北京, China",
            ip: "127.0.0.1"
        },
        {
            id: 2,
            name: "Vaan",
            text: "感谢您的访问！欢迎留言交流，我会认真阅读每一条留言。",
            time: "2025-01-01 10:05",
            location: "上海, China",
            ip: "127.0.0.1"
        },
        {
            id: 3,
            name: "访客用户",
            text: "网站设计得真漂亮！水波纹效果很炫酷！",
            time: "2025-01-01 11:00",
            location: "深圳, China",
            ip: "192.168.1.100"
        }
    ];

    fs.writeFileSync(messagesPath, JSON.stringify(initialMessages, null, 2));
    console.log('✅ 留言数据初始化成功');
} else {
    console.log('✅ 留言数据文件已存在');
}

// 启动服务器
console.log('\n🌟 正在启动服务器...');
const { spawn } = require('child_process');

const serverProcess = spawn('node', ['server.js'], {
    stdio: 'inherit',
    cwd: __dirname
});

serverProcess.on('error', (error) => {
    console.error('❌ 服务器启动失败:', error.message);
    process.exit(1);
});

serverProcess.on('close', (code) => {
    if (code !== 0) {
        console.error(`❌ 服务器异常退出，代码: ${code}`);
        process.exit(code);
    }
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 正在关闭服务器...');
    serverProcess.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 正在关闭服务器...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
});