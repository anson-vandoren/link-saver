import { verify } from 'jsonwebtoken';
import ws from 'ws';
import logger from './logger.js';

class WSHandler {
  constructor() {
    this.handlers = new Map();
    this.connections = new Map();
  }

  listen(server) {
    if (this.socket) {
      logger.debug('WebSocket already listening');
      return Promise.resolve();
    }
    const wss = new ws.Server({ server });

    wss.on('error', (err) => {
      logger.error('WebSocket server error', { err });
    });

    return new Promise((resolve) => {
      wss.on('listening', () => {
        logger.info('WebSocket server listening');
        resolve();
      });

      wss.on('connection', (sock, req) => {
        const token = new URL(req.url, `http://${req.headers.host}`).searchParams.get('token');
        if (!token) {
          logger.warn('Client did not provide a token');
          sock.close();
          return;
        }
        logger.debug('Client connected', { token, ip: req.socket.remoteAddress, port: req.socket.remotePort });
        // Keep track of the remote host since it's not present on the 'close' event
        // eslint-disable-next-line no-param-reassign
        sock.__remoteHost = { ip: req.socket.remoteAddress, port: req.socket.remotePort };
        verify(token, process.env.JWT_SECRET, (err, decoded) => {
          this.onJwtVerified(decoded, err, sock);
        });
      });
    });
  }

  onJwtVerified(decoded, err, sock) {
    if (err) {
      logger.warn('Client provided an invalid token', { err });
      sock.close();
      return;
    }
    logger.debug('Client provided a valid token', { decoded });
    this.connections.set(decoded.id, sock);

    sock.on('message', (message) => this.handleMessage(sock, message));

    sock.on('close', (code, reason) => {
      const { ip, port } = sock.__remoteHost;
      logger.debug('Client disconnected', { code, reason: reason.toString() || undefined, ip, port });
      this.connections.delete(decoded.id);
    });

    sock.on('error', (error) => {
      logger.error('WebSocket error', { error });
    });
  }

  handleMessage(socket, message) {
    const { type, data } = JSON.parse(message);
    if (this.handlers.has(type)) {
      this.handlers.get(type)(socket, data);
    } else {
      logger.warn('Unhandled message type', { type });
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

export default wsHandler;
