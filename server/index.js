import express from "express";
import { handler } from '../build/handler.js';
import websocket from './sync.js';
import videoHandler from './torrents.js';

const port = 3001;
const app = express();

app.get('/video/:hash', videoHandler);
app.use(handler);
const server = app.listen(port, () => console.log(`express listening on ${port} , serving sveltekit handler`));
websocket(server);
