import WebTorrent from "webtorrent";
import { eventEmmiter } from './events.js';


let client = new WebTorrent({ uploadLimit: 100000 }); // Limit to a max of 240 GiB per month

eventEmmiter.on('addTorrent', async (magnet) => {
  const torrent = await addOrFindTorrentByMagnet(client, magnet);
  if (torrent.ready) {
    eventEmmiter.emit('torrentReady', torrent.infoHash);
  } else {
    torrent.on('ready', () => eventEmmiter.emit('torrentReady', torrent.infoHash));
  }
})

export default async function videoHandler(req, res) {
  const torrent = findTorrentByHash(client, req.params.hash);

  if (!torrent) {
    res.status(404).end('torrent not found');
    return;
  }

  try{
    // find first video file
    const file = getFileFromTorrent(torrent, ['.mp4', '.mkv', '.mka']);

    const CHUNK_SIZE_BYTES = 10 ** 7;
    const videoSizeBytes = file.length;

    // Search for one or more digits followd by dash followed by 0 or more digits
    // to match '0' and '1023' in this: bytes=0-1023'
    const range = /(\d+)-(\d*)/.exec(req.headers?.range) || []; // empty array for compatiblity with rest of code

    // Either the requested start, if one exists, or 0
    const startByte = Number(range[1]) || 0;
    // The requested end, or till the end of the video or a chunk whichever is shorter
    const endByte = Number(range[2]) || Math.min(videoSizeBytes - 1, startByte + CHUNK_SIZE_BYTES - 1);
    const contentLength = endByte - startByte + 1;

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
    res.end('Error with streaming torrent: ', e);
  }
}

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
