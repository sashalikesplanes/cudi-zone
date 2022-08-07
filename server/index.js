import express from "express";
import { handler } from '../build/handler.js';
import WebTorrent from "webtorrent";

const port = 5173;
const app = express();

const client = new WebTorrent();
const magnetLink = 'magnet:?xt=urn:btih:FB94D1F636CF921A7CD37BA2FFBB3C7FFD680113&dn=Back+to+the+Future+%281985%29+1080p+BrRip+x264+-+YIFY&tr=udp%3A%2F%2Ftracker.yify-torrents.com%2Fannounce&tr=udp%3A%2F%2Ftracker.1337x.org%3A80%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969&tr=udp%3A%2F%2Ftracker.istole.it%3A80&tr=udp%3A%2F%2Ftracker.ccc.de%3A80%2Fannounce&tr=http%3A%2F%2Ffr33dom.h33t.com%3A3310%2Fannounce&tr=udp%3A%2F%2Ftracker.publicbt.com%3A80&tr=udp%3A%2F%2Fcoppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=http%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fcoppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.zer0day.to%3A1337%2Fannounce';
let file;

client.add(magnetLink, { destroyStoreOnDestroy: true }, (torrent) => {
  file = torrent.files.find(file => {
    return file.name.endsWith('.mp4');
  })
});

app.get('/pause', (req, res) => {
  console.log(file?.length);
})

app.get('/video', (req, res) => {
  if (!file) {
    res.end('plz wait for file to finish loading')
    return;
  }

  console.log(req.headers.range);
  const CHUNK_SIZE_BYTES = 10 ** 6;
  const videoSizeBytes = file?.length;

  const headers = {
    "Content-Length": videoSizeBytes,
    "Accept-Ranges": "bytes",
    "Content-Type": "video/webm",
  }

  if (!req.headers.range) {
    res.write(200, headers);
    const stream = file.createReadStream();
    stream.pipe(res);
  } else {
    // Search for one or more digits followd by dash followed by 0 or more digits
    // to match '0' and '1023' in this: bytes=0-1023'
    const range = /(\d)+-(\d*)/.exec(req.headers.range)
    const startByte = Number(range[1]);
    const endByte = Number(range[2]) || videoSizeBytes - 1;
    const contentLength = endByte - startByte + 1;

    headers["Content-Length"] = contentLength;
    headers["Content-Range"] = `bytes ${startByte}-${endByte}/${videoSizeBytes}`;
    res.writeHead(206, headers);

    const stream = file.createReadStream({ start: startByte, end: endByte });
    stream.pipe(res);
  }

})

app.use(handler);
app.listen(port, () => console.log(`express listening on ${port} , serving sveltekit handler`));
