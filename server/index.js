import express from "express";
import { handler } from '../build/handler.js';
import websocket from './sync.js';
import { streamTorrentHandler, addTorrentHandler } from './torrents.js';

const port = 3001;
const app = express();

app.use(express.json())
app.get('/video/:hash', streamTorrentHandler);
app.post('/video', addTorrentHandler)
app.use(handler);
const server = app.listen(port, () => console.log(`express listening on ${port} , serving sveltekit handler`));
websocket(server);
