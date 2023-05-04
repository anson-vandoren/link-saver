import { WebSocketMessage } from '../../shared/apiTypes';
import { getToken } from './utils';

function establishWebSocket(token: string) {
  if (!token) {
    return undefined;
  }
  const { origin } = window.location;
  const WSS_BASE = origin.replace('http', 'ws');
  const WSS_URL = `${WSS_BASE}?token=${token}`;
  const socket = new WebSocket(WSS_URL);

  return socket;
}

class WSHandler {
  private socket: WebSocket | undefined;
  private handlers: Record<string, (data: unknown) => void>;

  constructor() {
    this.handlers = {};
  }

  connect(token: string) {
    this.socket = establishWebSocket(token);
    if (!this.socket) {
      return;
    }
    this.socket.addEventListener('message', (event: { data: string }) => {
      const { type, data } = JSON.parse(event.data) as WebSocketMessage;
      if (this.handlers[type]) {
        this.handlers[type](data);
      }
    });
  }

  on(type: string, handler: (data: unknown) => void) {
    if (this.handlers[type]) {
      throw new Error(`Handler for ${type} already registered`);
    }
    this.handlers[type] = handler;
  }

  off(type: string) {
    delete this.handlers[type];
  }

  send(type: string, data: Record<string, unknown>) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    this.socket.send(JSON.stringify({ type, data }));
  }
}

const wsHandler = new WSHandler();
let token: string | undefined;
try {
  token = getToken();
} catch (_err) { /* ignore */ }
if (token) {
  wsHandler.connect(token);
}

export {
  wsHandler,
};
