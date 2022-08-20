export type MessageType = 'video-offer' | 'video-answer' | 'new-ice' | 'partner-check' | 'connection';

export interface Message {
  from: string;
  messageType: MessageType;
  payload: any | undefined;
}

export interface SentMessage extends Message {
  to: string[];
}

