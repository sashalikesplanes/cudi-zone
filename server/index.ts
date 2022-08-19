import express from 'express';
import dotenv from 'dotenv';
import wss from './message';

dotenv.config();

const app = express();
const port = process.env.PORT;

app.get('/health', (_, res) => {
  res.send('I am working');
})

const server = app.listen(port, () => console.log(`WSS listening on port: ${port}`));
wss(server);
