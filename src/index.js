// Cloudflare Workers 留言 API
// 适配 Cloudflare Pages 部署

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    const url = new URL(request.url)
    const path = url.pathname

    // CORS 头
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // 处理 OPTIONS 请求
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        switch (path) {
            case '/api/health':
                return handleHealth()
            case '/api/messages':
                return request.method === 'GET'
                    ? handleGetMessages()
                    : handlePostMessage(request)
            case '/api/debug':
                return handleDebug()
            default:
                // 对于静态文件，返回 404（让 Cloudflare Pages 处理）
                return new Response('Not Found', { status: 404, headers: corsHeaders })
        }
    } catch (error) {
        console.error('API Error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                message: '服务器内部错误',
                error: error.message
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            }
        )
    }
}

// 健康检查
function handleHealth() {
    return new Response(
        JSON.stringify({
            success: true,
            message: 'Cloudflare Workers 运行正常',
            timestamp: new Date().toISOString(),
            platform: 'Cloudflare Workers'
        }),
        {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    )
}

// 获取留言 - 从 KV 存储读取
async function handleGetMessages() {
    try {
        // 获取所有留言
        const messages = []
        const list = await MESSAGE_CACHE.list()

        for (const key of list.keys) {
            const message = await MESSAGE_CACHE.get(key.name)
            if (message) {
                messages.push(JSON.parse(message))
            }
        }

        // 按时间排序（最新的在前）
        messages.sort((a, b) => new Date(b.time) - new Date(a.time))

        return new Response(
            JSON.stringify({
                success: true,
                data: messages,
                count: messages.length
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        )
    } catch (error) {
        console.error('获取留言失败:', error)
        return new Response(
            JSON.stringify({
                success: false,
                message: '获取留言失败',
                data: getDefaultMessages() // 返回默认留言
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        )
    }
}

// 提交留言 - 保存到 KV 存储
async function handlePostMessage(request) {
    try {
        const data = await request.json()
        const { name, text } = data

        // 验证输入
        if (!name || !text) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '昵称和留言内容不能为空'
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            )
        }

        if (name.length > 20) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '昵称不能超过20个字符'
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            )
        }

        if (text.length > 500) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: '留言内容不能超过500个字符'
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            )
        }

        // 获取客户端信息
        const clientIP = request.headers.get('CF-Connecting-IP') ||
                         request.headers.get('X-Forwarded-For') ||
                         '未知'

        const country = request.cf?.country || '未知'
        const city = request.cf?.city || '未知'
        const location = city !== '未知' ? `${city}, ${country}` : country

        // 创建新留言
        const newMessage = {
            id: Date.now().toString(),
            name: name.trim(),
            text: text.trim(),
            time: new Date().toISOString().replace('T', ' ').substring(0, 16),
            ip: maskIP(clientIP),
            location: location,
            userAgent: request.headers.get('User-Agent') || 'Unknown',
            cf: {
                country: request.cf?.country,
                city: request.cf?.city,
                region: request.cf?.region
            }
        }

        // 保存到 KV 存储
        const key = `message_${newMessage.id}`
        await MESSAGE_CACHE.put(key, JSON.stringify(newMessage), {
            expirationTtl: 60 * 60 * 24 * 365 // 1年过期
        })

        console.log('留言已保存到 KV:', key)

        return new Response(
            JSON.stringify({
                success: true,
                message: '留言保存成功',
                data: newMessage
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        )

    } catch (error) {
        console.error('保存留言失败:', error)
        return new Response(
            JSON.stringify({
                success: false,
                message: '保存留言失败'
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        )
    }
}

// 调试信息
function handleDebug() {
    return new Response(
        JSON.stringify({
            success: true,
            data: {
                platform: 'Cloudflare Workers',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                features: ['KV存储', '地理位置检测', 'CORS支持']
            }
        }),
        {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    )
}

// 默认留言
function getDefaultMessages() {
    const now = Date.now()
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
    ]
}

// IP地址掩码
function maskIP(ip) {
    if (!ip || ip === '未知') return '未知'

    const parts = ip.split('.')
    if (parts.length === 4) {
        return `${parts[0]}.***.***.${parts[3]}`
    }

    // 对于IPv6或其他格式
    if (ip.length > 8) {
        return ip.substring(0, 4) + '***' + ip.substring(ip.length - 4)
    }

    return ip
}