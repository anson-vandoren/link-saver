const jwt = require('jsonwebtoken');
const WebSocket = require('ws');

class WSHandler {
  constructor() {
    this.handlers = new Map();
    this.connections = new Map();
  }

  listen(server) {
    if (this.socket) {
      console.debug('WebSocket already listening');
      return Promise.resolve();
    }
    const wss = new WebSocket.Server({ server });

    wss.on('error', (err) => {
      console.error('WebSocket server error', err);
    });

    return new Promise((resolve) => {
      wss.on('listening', () => {
        console.log('WebSocket server listening');
        resolve();
      });

      wss.on('connection', (sock, req) => {
        const token = new URL(req.url, `http://${req.headers.host}`).searchParams.get('token');
        if (!token) {
          console.log('Client did not provide a token');
          sock.close();
          return;
        }
        console.log('Client connected', token);
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
          this.onJwtVerified(decoded, err, sock);
        });
      });
    });
  }

  onJwtVerified(decoded, err, sock) {
    if (err) {
      console.log('Client provided an invalid token', err);
      sock.close();
      return;
    }
    console.log('Client provided a valid token', decoded);
    this.connections.set(decoded.id, sock);

    sock.on('message', (message) => this.handleMessage(sock, message));

    sock.on('close', () => {
      console.log('Client disconnected');
      this.connections.delete(decoded.id);
    });

    sock.on('error', (error) => {
      console.error('WebSocket error', error);
    });
  }

  handleMessage(socket, message) {
    const { type, data } = JSON.parse(message);
    if (this.handlers.has(type)) {
      this.handlers.get(type)(socket, data);
    } else {
      console.log('Unhandled message type', type);
    }
  }

  on(type, handler) {
    if (this.handlers.has(type)) {
      throw new Error(`Handler for ${type} already registered`);
    }
    this.handlers.set(type, handler);
  }

  off(type) {
    this.handlers.delete(type);
  }
}

const wsHandler = new WSHandler();

module.exports = { wsHandler };
