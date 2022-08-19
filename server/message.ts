import { IncomingMessage, Server } from 'http';
import { Duplex } from 'stream';
import WebSocket, { WebSocketServer } from 'ws';

type MessageType = 'video-offer' | 'video-answer' | 'new-ice' | 'partner-check' | 'connection';
interface Message {
  from: string;
  messageType: MessageType;
  payload: any | undefined;
}
interface RecievedMessage extends Message {
  to: string[];
}

function sendMessage(ws: WebSocket, msg: Message) {
  ws.send(JSON.stringify(msg));
}

export default (server: Server) => {
  const wss = new WebSocketServer({
    noServer: true,
    path: '/message',
  })

  server.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.emit('connection', ws, req);
      sendMessage(ws, { from: '', messageType: 'connection', payload: undefined })
    });
  })
}
