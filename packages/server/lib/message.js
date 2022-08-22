"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const url_1 = __importDefault(require("url"));
function sendMessage(clients, to, msg) {
    clients.forEach((client) => {
        if (!to.includes(client.id))
            return;
        client.send(JSON.stringify(msg));
    });
}
exports.default = (server) => {
    const wss = new ws_1.WebSocketServer({
        noServer: true,
        path: '/message',
    });
    server.on('upgrade', (req, socket, head) => {
        wss.handleUpgrade(req, socket, head, (wsOriginal) => {
            const clients = wss.clients;
            const ws = wsOriginal;
            const queryId = url_1.default.parse(req.url, true).query.id;
            if (typeof queryId !== 'string')
                throw new Error('bad query parameter for id');
            ws.id = queryId;
            ws.emit('connection', ws, req);
            console.log('clients: ', [...clients].map(client => client.id).join(', '));
            sendMessage(clients, [ws.id], {
                from: ['wss'],
                messageType: 'connection',
                payload: undefined,
            });
            ws.onmessage = (event) => {
                const { to, from, messageType, payload } = JSON.parse(String(event.data));
                // deal with message to itself
                if (to.length === 1 && to[0] === 'wss') {
                    if (messageType === 'partner-check') {
                        // broadcast if desired partner is here
                        console.log('partner check payload: ', payload);
                        const isPartnerOnline = [...clients].some(client => client.id === payload);
                        sendMessage(clients, from, {
                            from: ['wss'],
                            messageType: 'partner-check',
                            payload: isPartnerOnline,
                        });
                        return;
                    }
                    else {
                        throw new Error('invalid messageType directed to wss');
                    }
                }
                sendMessage(wss.clients, to, {
                    from,
                    messageType,
                    payload
                });
            };
        });
    });
};
