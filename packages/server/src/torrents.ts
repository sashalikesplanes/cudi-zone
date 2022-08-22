import { Request, Response } from "express";
import WebTorrent from "webtorrent";
import WebSocket from 'ws';

// @ts-ignore this is a specified property in the docs
let client = new WebTorrent({ uploadLimit: 100_000}); // Limit to a max of 240 GiB per month

const ws = new WebSocket('ws://localhost:3003/message?id=torrentServer');

ws.onmessage = async (event) => {
  const { from, messageType, payload } = JSON.parse(String(event.data));
  if (messageType === 'add-torrent') {
    const torrent = await addOrFindTorrentByMagnet(client, payload);
    if (torrent.ready) sendTorrent(from, torrent.infoHash);
    else torrent.on('ready', () => sendTorrent(from, torrent.infoHash));
  }

  function sendTorrent(to: string[], torrentHash: string) {
    ws.send(JSON.stringify({
      to, 
      from: ['torrentServer'],
      messageType: 'torrent-ready',
      payload: torrentHash,
    }))
  }
}

export async function streamTorrentHandler(req: Request, res: Response) {
  const torrent = findTorrentByHash(client, req.params.hash);

  if (!torrent) {
    res.status(404).end('torrent not found');
    return;
  }

  try{
    // find first video file
    const file = getFileFromTorrent(torrent, ['.mp4', '.mkv', '.mka']);

    if (!file) {
      res.status(404).end('torrent does not have video file');
      return;
    }

    const CHUNK_SIZE_BYTES = 10 ** 7;
    const videoSizeBytes = file.length;

    // Search for one or more digits followd by dash followed by 0 or more digits
    // to match '0' and '1023' in this: bytes=0-1023'
    const range = /(\d+)-(\d*)/.exec(req.headers?.range || '') || []; // empty array for compatiblity with rest of code

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
    const error = e as Error;
    console.error(e);
    res.status(504).end('Error with streaming torrent: ' + error);
  }
}

function getTorrentHashFromMagnetUri(magnetUri: string) {
  const hashMatch = magnetUri.match(/btih:([a-f0-9]+)/i);
  if (hashMatch && hashMatch[1]) return hashMatch[1].toLowerCase();
  else throw new Error('could not find hash in magner uri')
}

function findTorrentByHash(client: WebTorrent.Instance, infoHash: string) {
  return client.torrents.find((torrent) => {
    return torrent.infoHash.toLowerCase() === infoHash.toLowerCase();
  })
}

async function addOrFindTorrentByMagnet(client: WebTorrent.Instance, magnetUri: string): Promise<WebTorrent.Torrent> {
  const torrentHash = getTorrentHashFromMagnetUri(magnetUri);
  // search the client for matching torrentUri
  return new Promise(async (resolve, reject) => {
    const torrent = findTorrentByHash(client, torrentHash);
    if (torrent) {
      resolve(torrent);
      return;
    }

    try {
      client.add(magnetUri, { destroyStoreOnDestroy: true }, (torrent) => {
        resolve(torrent);
      });
      return;
    } catch (e) {
      reject(new Error('Could not add torrent: ' + e));
    }
    });
}

function getFileFromTorrent(torrent: WebTorrent.Torrent, listOfExtension: string[]) {
  return torrent.files.find((file) => {
    return listOfExtension.some((ext) => file.name.endsWith(ext));
  })
}
