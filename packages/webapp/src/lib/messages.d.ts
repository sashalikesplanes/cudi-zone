type MessageType = 'video-offer' |
                   'video-answer' |
                   'new-ice' |
                   'partner-check' |
                   'connection' |
                   'add-torrent' |
                   'torrent-ready' |
                   'playback-ready' |
                   'play' |
                   'seek-to' |
                   'pause';

export interface ServerMessage {
  from: string[];
  messageType: MessageType;
  payload: any | undefined;
}

export interface ClientMessage extends ServerMessage {
  to: string[];
}
