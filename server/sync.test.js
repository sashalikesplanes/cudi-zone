import { expect } from 'chai';
import WebSocket from 'ws';
import websocket from './sync.js';
import http from 'http';

describe('Websocket sync server tests', () => {
  let server;

  before((done) => {
    server = http.createServer();
    websocket(server);
    server.listen(7575, () => {
      console.log('server listening');
      done();
    });
  });

  after((done) => {
      server.close();
      server.unref();
      done();
      process.exit();
    }
  );

  it('Connect test', (done) => {
    const ws = new WebSocket('ws://localhost:7575/sync');
    ws.onopen = done;
  })

  it('Play test', (done) => {
    const ws = new WebSocket('ws://localhost:7575/sync');

    ws.onmessage = (event) => {
      const { msg, data } = JSON.parse(event.data);
      expect(msg).to.equal('play');
      // done();
    }
    ws.onopen = () => {
      ws.send(JSON.stringify({ msg: 'play' }));
    };
  })

  it('Pause test', (done) => {
    const ws = new WebSocket('ws://localhost:7575/sync');

    ws.onmessage = (event) => {
      const { msg, data } = JSON.parse(event.data);
      expect(msg).to.equal('play');
      // done();
    }
    ws.onopen = () => {
      ws.send(JSON.stringify({ msg: 'pause' }));
    };
  })
})
