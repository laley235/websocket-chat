const WebSocket = require('ws'); // 引入 ws 库

// 从环境变量中获取端口，默认为 8081
const PORT = process.env.PORT || 8081;

// 创建 WebSocket 服务器，监听指定端口
const wss = new WebSocket.Server({ port: PORT, host: '0.0.0.0' }); // 注意绑定到 0.0.0.0

// 保存连接的客户端和用户名
const clients = new Map();

wss.on('connection', (ws) => {
    console.log('New client connected');

    const clientId = Date.now();
    clients.set(clientId, { ws });

    // 向新客户端发送欢迎消息
    ws.send(
        JSON.stringify({
            type: 'welcome',
            message: 'Welcome to the WebSocket chat!',
            onlineUsers: wss.clients.size,
        })
    );

    ws.on('message', (data) => {
        const rawMessage = data.toString(); // 将 Buffer 转换为字符串
        console.log('Raw data received from client:', rawMessage);

        try {
            const message = JSON.parse(rawMessage); // 尝试解析 JSON

            if (message.type === 'setUsername') {
                const username = message.username?.trim();
                if (!username) {
                    ws.send('Error: Username cannot be empty');
                    return;
                }
                clients.get(clientId).username = username;
                console.log(`User set their username: ${username}`);
            } else if (message.type === 'message') {
                const username = clients.get(clientId).username || 'Anonymous';
                const broadcastMessage = `${username}: ${message.text}`;
                console.log(`Broadcasting message: ${broadcastMessage}`);

                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(broadcastMessage);
                    }
                });
            }
        } catch (err) {
            console.error('Error processing message:', err.message);
            ws.send('Error: Please send a valid JSON message'); // 向客户端提示无效格式
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(clientId);
    });
});

wss.on('error', (err) => {
    console.error('WebSocket server error:', err.message);
});

// 输出服务启动信息
console.log(`WebSocket server is running on ws://0.0.0.0:${PORT}`);
