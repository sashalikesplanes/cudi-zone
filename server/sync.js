import WebSocket from 'ws';
import { eventEmmiter } from './events.js';


export default (server) => {
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
    ws.onmessage = async (event) => {
      const { msg, data } = JSON.parse(event.data);
      if (msg === 'pause') {
        // TODO add logic to not allow play immidiatly after pause
        sendMessage('pause');
        // setTimeout(() => playForbidden = false, 500);
      } else if (msg === 'play') {
        sendMessage('play');
      } else if (msg === 'clientSubmitTorrent') {
        sendMessage('serverRecievedTorrent');
        eventEmmiter.emit('addTorrent', data)
      } else if (msg === 'clientCanPlay') {
        sendMessage('pause');
      } else if (msg === 'seekedTo') {
        sendMessage('seekedTo', data);
      }
    }

    eventEmmiter.on('torrentReady', (hash) => {
      sendMessage('serverTorrentReady', hash)
    });
  });

  return wss;
}
