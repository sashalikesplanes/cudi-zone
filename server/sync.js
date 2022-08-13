import WebSocket from 'ws';
import { eventEmmiter } from './events.js';


export default (server) => {
  // TODO client management
  const wss = new WebSocket.Server({
    noServer: true,
    path: '/sync',
  });

  function sendMessage(msg, data) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ msg, data }));
      }
    });
  }

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws, req) => {
    ws.onmessage = (event) => {
      const { msg, data } = JSON.parse(event.data);
      messageHandler[msg](data);
    }

    const messageHandler = {
      pause: () => sendMessage('pause'),
      play: () => sendMessage('play'),
      clientSubmitTorrent: (data) => {
        sendMessage('serverRecievedTorrent');
        eventEmmiter.emit('addTorrent', data)
      },
      clientCanPlay: () => sendMessage('pause'),
      seekedTo: (data) => sendMessage('seekedTo', data),
    }

    eventEmmiter.on('torrentReady', (hash) => {
      sendMessage('serverTorrentReady', hash)
    });
  });

  return wss;
}
