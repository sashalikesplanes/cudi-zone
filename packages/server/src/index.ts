import express from 'express';
import dotenv from 'dotenv';
import wss from './message';
import { streamTorrentHandler } from './torrents';

dotenv.config();

const app = express();
const port = process.env.PORT;

app.get('/health', (_, res) => {
  res.send('I am working');
})
app.get('/torrent/:hash', streamTorrentHandler);

const server = app.listen(port, () => console.log(`WSS listening on port: ${port}`));
wss(server);

