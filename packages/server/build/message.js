"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
function sendMessage(ws, msg) {
    ws.send(JSON.stringify(msg));
}
exports.default = (server) => {
    const wss = new ws_1.WebSocketServer({
        noServer: true,
        path: '/message',
    });
    server.on('upgrade', (req, socket, head) => {
        wss.handleUpgrade(req, socket, head, (ws) => {
            ws.emit('connection', ws, req);
            sendMessage(ws, { from: '', messageType: 'connection', payload: undefined });
        });
    });
};
