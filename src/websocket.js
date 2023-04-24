const jwt = require('jsonwebtoken');
const WebSocket = require('ws');

class WSHandler {
  constructor() {
    this.socket = null;
    this.handlers = {};
  }

  listen(server) {
    if (this.socket) {
      console.debug('WebSocket already listening');
      return Promise.resolve();
    }
    const wss = new WebSocket.Server({ server });

    return new Promise((resolve) => {
      wss.on('connection', (ws, req) => {
        const token = new URL(req.url, `http://${req.headers.host}`).searchParams.get('token');
        if (!token) {
          console.log('Client did not provide a token');
          ws.close();
          return;
        }
        console.log('Client connected', token);
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
          if (err) {
            console.log('Client provided an invalid token', err);
            ws.close();
            return;
          }
          console.log('Client provided a valid token', decoded);
        });

        this.socket = ws;

        ws.on('close', () => {
          console.log('Client disconnected');
        });

        ws.on('message', (message) => {
          const { type, data } = JSON.parse(message);
          if (this.handlers[type]) {
            this.handlers[type](data);
          } else {
            console.log('Unhandled message type', type);
          }
        });
        resolve();
      });
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

module.exports = { wsHandler };
