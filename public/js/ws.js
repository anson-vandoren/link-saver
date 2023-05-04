function establishWebSocket(token) {
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
  constructor() {
    this.socket = undefined;
    this.handlers = {};
  }

  connect(token) {
    this.socket = establishWebSocket(token);
    if (!this.socket) {
      return;
    }
    this.socket.addEventListener('message', (event) => {
      const { type, data } = JSON.parse(event.data);
      if (this.handlers[type]) {
        this.handlers[type](data);
      }
    });
  }

  on(type, handler) {
    if (this.handlers[type]) {
      throw new Error(`Handler for ${type} already registered`);
    }
    this.handlers[type] = handler;
  }

  off(type) {
    delete this.handlers[type];
  }

  send(type, data) {
    this.socket.send(JSON.stringify({ type, data }));
  }
}

const wsHandler = new WSHandler();
const token = localStorage.getItem('token');
if (token) {
  wsHandler.connect(token);
}

export {
  wsHandler,
};
