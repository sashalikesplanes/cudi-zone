import express from "express";
import { handler } from '../build/handler.js';
import WebSocket from 'ws';
import expressWs from 'express-ws';
import WebTorrent from "webtorrent";

const port = 3000;
const app = express();
const expressWss = expressWs(app);

let client = new WebTorrent({ uploadLimit: 100000 }); // Limit to a max of 240 GiB per month

// todo figure out nice api!!!!!!!!!!
const magnetLink = 'magnet:?xt=urn:btih:FB94D1F636CF921A7CD37BA2FFBB3C7FFD680113&dn=Back+to+the+Future+%281985%29+1080p+BrRip+x264+-+YIFY&tr=udp%3A%2F%2Ftracker.yify-torrents.com%2Fannounce&tr=udp%3A%2F%2Ftracker.1337x.org%3A80%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969&tr=udp%3A%2F%2Ftracker.istole.it%3A80&tr=udp%3A%2F%2Ftracker.ccc.de%3A80%2Fannounce&tr=http%3A%2F%2Ffr33dom.h33t.com%3A3310%2Fannounce&tr=udp%3A%2F%2Ftracker.publicbt.com%3A80&tr=udp%3A%2F%2Fcoppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=http%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fcoppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.zer0day.to%3A1337%2Fannounce';
const magnetLink2 = 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent';
const magnetLink3 = 'magnet:?xt=urn:btih:45B3BCBBC084FDC3DEC8E4EB6DA53DDD414310D5&dn=Run+Hide+Fight+-+Action+Eng+Rus+Multi-Subs+1080p+%5BH264-Mp4%5D&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2770%2Fannounce&tr=https%3A%2F%2Finferno.demonoid.is%2Fannounce&tr=udp%3A%2F%2Ftracker.pomf.se%3A80%2Fannounce&tr=udp%3A%2F%2Fbt1.archive.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.tiny-vps.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.altrosky.nl%3A6969%2Fannounce&tr=udp%3A%2F%2Fmts.tvbit.co%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.zerobytes.xyz%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker1.bt.moack.co.kr%3A80%2Fannounce&tr=http%3A%2F%2Fvps02.net.orel.ru%3A80%2Fannounce&tr=http%3A%2F%2Ftracker.files.fm%3A6969%2Fannounce&tr=http%3A%2F%2Fopen.acgnxtracker.com%2Fannounce&tr=http%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=http%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fcoppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.zer0day.to%3A1337%2Fannounce';

/* await addOrFindTorrentByMagnet(client, magnetLink2);
console.log('loaded vid 2');
await addOrFindTorrentByMagnet(client, magnetLink3);
console.log('loaded vid 1'); */

/* await Promise.all([
                   // addOrFindTorrentByMagnet(client, magnetLink),
                   addOrFindTorrentByMagnet(client, magnetLink2),
                   // addOrFindTorrentByMagnet(client, magnetLink3),
                  ]); */
console.log('ready to rumble');

function getTorrentHashFromMagnetURI(magnetURI) {
  return magnetURI.match(/btih:([a-f0-9]+)/i)[1].toLowerCase()
}

function findTorrentByHash(client, infoHash) {
  return client.torrents.find((torrent) => {
    return torrent.infoHash.toLowerCase() === infoHash.toLowerCase();
  })
}

async function addOrFindTorrentByMagnet(client, magnetURI) {
  const torrentHash = getTorrentHashFromMagnetURI(magnetURI);
  // search the client for matching torrentURI
  return new Promise(async (resolve, reject) => {
    const torrent = findTorrentByHash(client, torrentHash);
    if (torrent) {
      resolve(torrent);
      return;
    }

    try {
      client.add(magnetURI, { destroyStoreOnDestroy: true }, (torrent) => {
        resolve(torrent);
      });
      return;
    } catch (e) {
      reject(new Error('Could not add torrent: ' + e));
    }
    });
}

function getFileFromTorrent(torrent, listOfExtension) {
  return torrent.files.find((file) => {
    return listOfExtension.some((ext) => file.name.endsWith(ext));
  })
}

let playForbidden = false;

app.ws('/state', (ws) => {
  function sendMessage(msg, data) {
    expressWss.getWss().clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ msg, data }));
      }
    });
  }

  ws.onopen = () => {
    // init clients in the room
    console.log('open on server');
    ws.send('serverInitialMessage');
  };

  ws.onmessage = async (event) => {
    const { msg, data } = JSON.parse(event.data);
    if (msg === 'pause') {
      playForbidden = true;
      sendMessage('pause');
      setTimeout(() => playForbidden = false, 500);
    } else if (msg === 'play') {
      if (!playForbidden) sendMessage('play');
    } else if (msg === 'clientSubmitTorrent') {
      sendMessage('serverRecievedTorrent');
      const torrent = await addOrFindTorrentByMagnet(client, data);
      if (torrent.ready) sendMessage('serverTorrentReady', torrent.infoHash);
      else torrent.on('ready', () => {
        sendMessage('serverTorrentReady', torrent.infoHash);
      });
    } else if (msg === 'clientCanPlay') {
      sendMessage('pause');
    } else if (msg === 'seekedTo') {
      sendMessage('seekedTo', data);
    }
  }
});

app.get('/video/:hash', async (req, res) => {
  const torrent = findTorrentByHash(client, req.params.hash);
  if (!torrent) {
    res.status(404).end('torrent not found');
    return;
  }

  try{
    const file = getFileFromTorrent(torrent, ['.mp4', '.mkv', '.mka']);

    const CHUNK_SIZE_BYTES = 10 ** 7;
    const videoSizeBytes = file.length;

    // Search for one or more digits followd by dash followed by 0 or more digits
    // to match '0' and '1023' in this: bytes=0-1023'
    // dumb ass regex mistake smh
    const range = /(\d+)-(\d*)/.exec(req.headers?.range) || []; // empty array for compatiblity with rest of code

    // Either the requested start, if one exists, or 0
    const startByte = Number(range[1]) || 0;
    const endByte = Number(range[2]) || Math.min(videoSizeBytes - 1, startByte + CHUNK_SIZE_BYTES - 1);
    const contentLength = endByte - startByte + 1;

    console.log(req.headers?.range, startByte, endByte);

    const headers = {
      "Accept-Ranges": "bytes",
      "Content-Type": "video/webm",
      "Content-Length": contentLength,
      "Content-Range": `bytes ${startByte}-${endByte}/${videoSizeBytes}`,
    }

    res.writeHead(206, headers);

    const stream = file.createReadStream({ start: startByte, end: endByte });
    stream.pipe(res);
  } catch (e) {
    console.error(e);
    res.end('Error with torrent: ', e);
  }
});

app.use(handler);
app.listen(port, () => console.log(`express listening on ${port} , serving sveltekit handler`));
