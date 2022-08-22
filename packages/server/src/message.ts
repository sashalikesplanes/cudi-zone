import { Request } from 'express';
import { Server } from 'http';
import { Duplex } from 'stream';
import WebSocket, { WebSocketServer } from 'ws';
import url from 'url';

type MessageType = 'video-offer' |
                   'video-answer' |
                   'new-ice' |
                   'partner-check' |
                   'connection' |
                   'add-torrent' |
                   'torrent-ready' |
                   'playback-ready' |
                   'play' |
                   'pause';

interface ServerMessage {
  from: string[];
  messageType: MessageType;
  payload: any | undefined;
}

interface ClientMessage extends ServerMessage {
  to: string[];
}


interface WebSocketWithId extends WebSocket {
  id: string;
}


function sendMessage(clients: Set<WebSocketWithId>, to: string[], msg: ServerMessage) {
  clients.forEach((client) => {
    if (!to.includes(client.id)) return;
    client.send(JSON.stringify(msg));
  })
}

export default (server: Server) => {
  const wss = new WebSocketServer({
    noServer: true,
    path: '/message',
  })

  server.on('upgrade', (req: Request, socket: Duplex, head: Buffer) => {
    wss.handleUpgrade(req, socket, head, (wsOriginal) => {
      const clients = wss.clients as Set<WebSocketWithId>;

      const ws = wsOriginal as WebSocketWithId;
      const queryId = url.parse(req.url, true).query.id;
      if (typeof queryId !== 'string') throw new Error('bad query parameter for id');
      ws.id = queryId;

      ws.emit('connection', ws, req);
      console.log('clients: ', [...clients].map(client => client.id).join(', '))
      sendMessage(clients, [ws.id], {
        from: ['wss'],
        messageType: 'connection',
        payload: undefined,
      })

      ws.onmessage = (event) => {
        const { to, from, messageType, payload } = JSON.parse(String(event.data)) as ClientMessage;
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
            })
            return;
          } else {
            throw new Error('invalid messageType directed to wss');
          }
        }

        sendMessage(wss.clients as Set<WebSocketWithId>, to, {
          from,
          messageType,
          payload
        })
      }
    });
  })
}
