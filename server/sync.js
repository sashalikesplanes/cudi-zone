// TODO rewrite in typescript
import WebSocket from 'ws';
import { eventEmmiter } from './events.js';
import fetch from 'node-fetch';


function createRooms(wss) {
  // suffix one refers to the client which connected first
  const rooms = []

  function makeRoom({ id1, id2 }) {
    rooms.push({
      client1: {
        id: id1,
        connected: false,
        ready: false,
      },
      client2: {
        id: id2,
        connected: false,
        ready: false,
      },
      torrentHash: '',
      pausedRecently: false,
      torrentSubmitted: false,
      torrentReady: false,
      offerCandidates: [],
      offer: undefined,
    })
  }

  function existsRoom({ id1, id2 }) {
    return rooms.some((room) => {
      return ((room.client1.id === id1 && room.client2.id === id2) || (room.client1.id === id2 && room.client2.id === id1))
    })
  }


  function deleteRoom(id) {
    const room = findRoom(id);
    broadcastToRoom(room, 'error', 'Room deleted');
    rooms.splice(rooms.indexOf(room), 1);
  }

  function clientConnected(id) {
    const room = findRoom(id);
    if (room.client1.id === id) room.client1.connected = true;
    else if (room.client2.id === id) room.client2.connected = true;

    if (room.client1.connected && room.client2.connected) {
      if (!room.offer) broadcastToRoom(room, 'error', 'Second client connected but no offer');
      else {
        broadcastToClient(id, 'secondClientConnected', JSON.stringify(room.offer))
      }
    } 
    else broadcastToClient(id, 'firstClientConnected')
  }


  function clientReady(id) {
    const room = findRoom(id);
    if (room.client1.id === id) room.client1.ready = true;
    else if (room.client2.id === id) room.client2.ready = true;

    // enter pause state to indicate playback is ready to begin
    if (room.client1.ready && room.client2.ready) broadcastToRoom(room, 'pause');
  }

  async function addTorrent(id, magnetUri, host) {
    const room = findRoom(id);
    if (!room.client1.connected || !room.client2.connected) {
      broadcastToRoom(room, 'error', 'Adding torrent before both are connected')
    }

    const res = await fetch(`http://${host}/video`, {
      method: 'post',
      body: JSON.stringify({ magnetUri }),
      headers: {'Content-Type': 'application/json'}
    });

    const data = await res.json();
    room.torrentHash = data.hash;
    broadcastToRoom(room, 'serverRecievedTorrent');
  }

  function torrentReady(hash) {
    rooms.forEach((room) => {
      room.torrentReady = true;
      broadcastToRoom(room, 'serverTorrentReady', hash)
    })
  }

  function pauseRoom(id) {
    const room = findRoom(id);
    room.pausedRecently = true;
    setTimeout(() => {
      if (room) room.pausedRecently = false, 500
    });
    broadcastToRoom(room, 'pause');
  }

  function playRoom(id) {
    const room = findRoom(id);
    if (!room.pausedRecently) broadcastToRoom(room, 'play')
  }

  function seekTo(id, timeInSeconds) {
    const room = findRoom(id);
    broadcastToRoom(room, 'seekedTo', timeInSeconds);
  }

  function findRoom(id) {
    return rooms.find((room) => {
      return (room.client1.id === id ||room.client2.id === id);
    })
  }


  function broadcastToRoom(room, msg, data) {
    // send a message to both clients in the room
    const clients = wss.clients;
    clients.forEach((client) => {
      if (client.id === room.client1.id || client.id === room.client2.id) {
        client.send(JSON.stringify({ msg, data }));
      }
    })
  }

  function broadcastToClient(clientId, msg, data) {
    wss.clients.forEach((client) => {
      if (client.id === clientId) client.send(JSON.stringify({ msg, data }));
    })
  }

  function broadcastToOtherClient(clientId, msg, data) {
    const room = findRoom(clientId);
    const otherClientId = room.client1.id === clientId ? room.client2.id : room.client1.id;
    broadcastToClient(otherClientId, 'newCandidate', data);
  }

  function isPartnerBusy(clientId, partnerId) {
    const room = findRoom(partnerId)
    if (!room) return false;
    return ((room.client1.id === partnerId && room.client2.id !== clientId) || (room.client1.id !== clientId && room.client2.id === partnerId));
  }

  function addNewOfferCandidate(clientId, offerCandidate) {
    const room = findRoom(clientId);
    room.offerCandidates.push(offerCandidate);
  }

  function addNewOffer(clientId, offerJSON) {
    const offer = JSON.parse(offerJSON);
    const room = findRoom(clientId);
    room.offer = offer;
  }

  function sendAnswer(clientId, anwserJSON) {
    const room = findRoom(clientId);
    broadcastToRoom(room, 'newAnswer', anwserJSON);
  }

  return {
    makeRoom, // ({ id1, id2 }) x
    existsRoom, // ({ id1, id2 }) x
    isPartnerBusy, // id
    deleteRoom, // id x
    clientConnected, // id x
    clientReady, // id x
    torrentReady, // hash, mark all rooms as ready
    addTorrent, // (id, magnetUri) x
    pauseRoom, // id x
    playRoom, // id x
    seekTo, // id, time x
    addNewOfferCandidate,
    addNewOffer,
    broadcastToRoom,
    sendAnswer,
    broadcastToOtherClient,
  }
}


export default (server) => {
  // TODO client management
  const wss = new WebSocket.Server({
    noServer: true,
    path: '/sync',
  });

  const rooms = createRooms(wss);

  eventEmmiter.on('torrentReady', (hash) => {
    console.log('sync sees torrent is ready')
    rooms.torrentReady(hash);
  });

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws, req) => {
    const clientId = req.url.match(/\?id=(.+)$/)[1];
    ws.id = clientId;
    ws.onmessage = (event) => {
      const { msg, data } = JSON.parse(event.data);
      if (msg === 'clientConnection') {
        const partnerId = data;
        // add checks in case partner is in a room with someone else, for now assume no such conflicts
        if (rooms.isPartnerBusy(clientId, partnerId)) {
          ws.send(JSON.stringify({ msg: 'error', data: 'partner busy'}));
          return;
        }
        if (!rooms.existsRoom({ id1: partnerId, id2: clientId })) {
          rooms.makeRoom({ id1: clientId, id2: partnerId });
        }
        rooms.clientConnected(clientId);
      } else if (msg === 'pause') rooms.pauseRoom(clientId);
      else if (msg === 'play') rooms.playRoom(clientId);
      else if (msg === 'clientSubmitTorrent') rooms.addTorrent(clientId, data, req.headers.host);
      else if (msg === 'clientReady') rooms.clientReady(clientId);
      else if (msg === 'seekedTo') rooms.seekTo(clientId, data);
      else if (msg === 'newOfferCandidate') rooms.addNewOfferCandidate(clientId, data);
      else if (msg === 'newOffer') rooms.addNewOffer(clientId, data);
      else if (msg === 'newAnswer') rooms.sendAnswer(clientId, data);
      else if (msg === 'newCandidate') rooms.broadcastToOtherClient(clientId, 'newCandidate', data);

        // now as soon as the client opens the connection
        // there is a gurantee that a room exists hence we can 
        // just broadcast to any room
    }

    ws.onclose = () => {
      rooms.deleteRoom(clientId);
    }
  })


  return wss;
}

/* function sendMessage(msg, data) {
  const room = rooms[0];
  console.log('in send message', data, room)
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && (client.id === room.firstId || client.id === room.secondId)) {
      client.send(JSON.stringify({ msg, data }));
    }
  });
}

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

  }

}); */
