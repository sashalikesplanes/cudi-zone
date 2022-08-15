import WebSocket from 'ws';
import { eventEmmiter } from './events.js';

let rooms = [{
  firstId: '415785b7-19dd-442a-bc58-55e4317fb3c5',
  secondId: '88010dad-22bf-4416-8da6-95b575966f61'
}];


export default (server) => {
  // TODO client management
  const wss = new WebSocket.Server({
    noServer: true,
    path: '/sync',
  });

  function sendMessage(msg, data) {
    const room = rooms[0];
    console.log('in send message', data, room)
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && (client.id === room.firstId || client.id === room.secondId)) {
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
      console.log(msg)
      const handler = messageHandler[msg];
      handler(data, rooms[0]);
      console.log(rooms, ws.id);
    }

    ws.onclose = (event) => {
      // TODO remove from room
      // rooms = [];
    }

    const messageHandler = {
      pause: (_, room) => sendMessage('pause', undefined, room),
      play: (_, room) => sendMessage('play', undefined, room),
      clientSubmitTorrent: (magnetUri, room) => {
        console.log('in submit torrent callback', room)
        sendMessage('serverRecievedTorrent', '', room);
        eventEmmiter.emit('addTorrent', magnetUri)
      },
      clientCanPlay: (_, room) => sendMessage('pause', undefined, room),
      seekedTo: (timeSeconds, room) => sendMessage('seekedTo', timeSeconds, room),
      clientConnection: (clientUserId, room) => {
        ws.id = clientUserId[0];
        // happy path, noone is in any rooms
        if (ws.id !== rooms[0].firstId && ws.id !== rooms[0].secondId) {
          console.log('denied from joining room')
          sendMessage('connectionDenied', undefined, room);
        }
        // check if there exists own room
        // check if there exists a partner room
        // create room otherwise join partner room
        // happy path, room doesnt exist
      }
    }

    eventEmmiter.on('torrentReady', (hash) => {
      sendMessage('serverTorrentReady', hash)
    });
  });

  return wss;
}
