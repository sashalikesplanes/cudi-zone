import type { ServerMessage, ClientMessage } from '$lib/messages';

let ws: WebSocket;
let wsProtocol: string;
const wsUrl = import.meta.env.DEV ? 'localhost:3003' : 'cudiserver.kiselev.lu';

export type handleMessageCallback = (message: ServerMessage) => void;

const onMessageCallbacks: handleMessageCallback[] = [];
const messageQueue: ClientMessage[] = [];

export async function onMessage(id: string, partnerId: string, callback: (message: ServerMessage) => void) {
  onMessageCallbacks.push(callback);
  if (onMessageCallbacks.length === 1) {
    setupWebsocket(id, partnerId);
  }
}

export function unsubcribeFromMessages(callback: (message: ServerMessage) => void) {
  onMessageCallbacks.splice(onMessageCallbacks.indexOf(callback), 1);
  if (onMessageCallbacks.length === 0) destroyWebsocket();
}

export function sendMessage(msg: ClientMessage) {
  console.log('sending', msg);
  if (ws.readyState === 0) {
    messageQueue.push(msg);
    ws.onopen = () => messageQueue.forEach(msg => ws.send(JSON.stringify(msg)));
  } else if (ws.readyState === 1) {
    ws.send(JSON.stringify(msg));
  } else throw new Error('sending to closed websocket');
}

function setupWebsocket(id: string, partnerId: string) {
  const wsProtocol = 'ws://';
  ws = new WebSocket(`${wsProtocol}${wsUrl}/message?id=${id}`);

  ws.onmessage = async (event) => {
    onMessageCallbacks.forEach(callback => callback(JSON.parse(event.data)));
  };

  ws.onerror = (event) => {
    console.error('WS error', event);
  };

  ws.onclose = () => {
    console.log('WEB SOCKET Closed');
  };

  sendMessage({
    to: ['wss'],
    from: [id],
    messageType: 'partner-check',
    payload: partnerId
  });
};

function destroyWebsocket() {
  if (ws && ws.OPEN) ws.close();
};

// wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
