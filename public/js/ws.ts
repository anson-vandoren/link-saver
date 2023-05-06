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
  private handlers: Map<string, (data: unknown) => void> = new Map();

  connect(token: string) {
    this.socket = establishWebSocket(token);
    if (!this.socket) {
      return;
    }
    this.socket.addEventListener('message', (event: { data: string }) => {
      const { type, data } = JSON.parse(event.data) as WebSocketMessage;
      if (this.handlers.has(type)) {
        this.handlers.get(type)?.(data);
      }
    });
  }

  on(type: string, handler: (data: unknown) => void) {
    if (this.handlers.has(type)) {
      throw new Error(`Handler for ${type} already registered`);
    }
    this.handlers.set(type, handler);
  }

  off(type: string) {
    this.handlers.delete(type);
  }

  send(type: string, data: Record<string, unknown>): boolean {
    if (!this.socket) return false;
    try {
      this.socket.send(JSON.stringify({ type, data }));
    } catch (err) {
      console.debug('Failed to send message', err);
      return false;
    }
    return true;
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
