import { API_URL } from './common.js';

function establishWebSocket(token) {
  if (!token) {
    console.log('No token found, skipping WebSocket connection');
    return;
  }
  const WSS_BASE = API_URL.replace('http', 'ws');
  const WSS_URL = `${WSS_BASE}?token=${token}`;
  const socket = new WebSocket(WSS_URL);

  socket.addEventListener('open', (event) => {
    console.log('WebSocket connection opened:', event);
  });

  socket.addEventListener('close', (event) => {
    console.log('WebSocket connection closed:', event);
  });

  socket.addEventListener('error', (event) => {
    console.error('WebSocket error:', event);
  });

  return socket;
}

class WSHandler {
  constructor() {
    this.socket = null;
    this.handlers = {};
  }

  connect(token) {
    this.socket = establishWebSocket(token);
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
} else {
  // go to login page
  window.location.href = '/';
}

export { wsHandler };
