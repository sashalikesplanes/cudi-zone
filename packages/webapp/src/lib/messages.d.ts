type MessageType = 'video-offer' | 'video-answer' | 'new-ice' | 'partner-check' | 'connection';

export interface ServerMessage {
  from: string;
  messageType: MessageType;
  payload: any | undefined;
}

export interface ClientMessage extends ServerMessage {
  to: string[];
}
