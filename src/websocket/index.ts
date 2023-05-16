import { z } from 'zod';
import { JwtPayload, verify, VerifyErrors } from 'jsonwebtoken';
import ws, { RawData } from 'ws';
import http from 'http';
import https from 'https';
import logger from '../logger';

const WebSocketMessageSchema = z.object({
  type: z.string(),
  data: z.unknown(),
});

type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

function parseRawData(message: RawData): WebSocketMessage | undefined {
  const asString = message.toString();
  const rawParsed: unknown = JSON.parse(asString);
  if (typeof rawParsed !== 'object' || rawParsed === null) {
    return undefined;
  }
  const { type, data } = rawParsed as WebSocketMessage;
  if (typeof type !== 'string') {
    return undefined;
  }
  return { type, data };
}

type SocketEx = ws.WebSocket & { __remoteHost: { ip: string; port: number } };
type WsMessageHandler = (socket: ws, data: unknown) => void;
class WSHandler {
  private handlers: Map<string, WsMessageHandler> = new Map();
  private connections: Map<number, ws> = new Map();
  private socket: ws.Server | undefined;

  listen(server: http.Server | https.Server): Promise<void> {
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
        const { address, port } = wss.address() as ws.AddressInfo;
        logger.info('WebSocket server listening', { address, port });
        resolve();
      });

      wss.on('connection', (sock: SocketEx, req) => {
        const { url } = req;
        if (!url) {
          logger.warn('Client did not provide a URL');
          sock.close();
          return;
        }
        const { host } = req.headers;
        if (!host) {
          logger.warn('Client did not provide a host');
          sock.close();
          return;
        }
        const token = new URL(url, `http://${host}`).searchParams.get('token');
        if (!token) {
          logger.warn('Client did not provide a token');
          sock.close();
          return;
        }
        logger.debug('Incoming WebSocket connection', { url, host, token });
        const ip = req.socket.remoteAddress;
        const port = req.socket.remotePort;
        logger.debug('Client connected', { token, ip, port });

        // Keep track of the remote host since it's not present on the 'close' event
        if (!ip || !port) {
          logger.warn('Client did not provide a remote address or port', { ip: ip ?? 'not present', port: port ?? 'not present' });
          sock.close();
          return;
        }
        if (sock.__remoteHost) {
          logger.warn('Client already has a remote address or port', { remoteHost: sock.__remoteHost });
          sock.close();
          return;
        }
        // eslint-disable-next-line no-param-reassign
        sock.__remoteHost = { ip, port };
        const { JWT_SECRET } = process.env;
        if (!JWT_SECRET) {
          logger.error('JWT_SECRET not set');
          sock.close();
          return;
        }
        verify(token, JWT_SECRET, (err, decoded) => {
          if (!decoded) {
            logger.warn('Client provided an invalid token', { err });
            sock.close();
            return;
          }
          if (typeof decoded === 'string') {
            logger.warn('Client provided a string token', { decoded });
            sock.close();
            return;
          }
          this.onJwtVerified(decoded, sock, err);
        });
      });
    });
  }

  onJwtVerified(decoded: JwtPayload, sock: SocketEx, err: VerifyErrors | null): void {
    if (err) {
      logger.warn('Client provided an invalid token', { err });
      sock.close();
      return;
    }
    logger.debug('Client provided a valid token', { decoded });
    const { id } = decoded;
    const userId = Number(id);
    if (Number.isNaN(userId)) {
      logger.warn('Client provided an invalid user ID', { userId: String(userId) });
      sock.close();
      return;
    }
    if (this.connections.has(userId)) {
      logger.warn('Client already connected', { userId });
      sock.close();
      return;
    }
    this.connections.set(userId, sock);

    sock.on('message', (message) => this.handleMessage(sock, message));

    sock.on('close', (code, reason) => {
      const { ip, port } = sock.__remoteHost;
      logger.debug('Client disconnected', { code, reason: reason.toString() || 'no reason given', ip, port });
      this.connections.delete(userId);
    });

    sock.on('error', (error) => {
      logger.error('WebSocket error', { error });
    });
  }

  handleMessage(socket: SocketEx, message: RawData): void {
    const { type, data } = parseRawData(message) ?? {};
    if (!type) {
      logger.warn('Invalid message', { message, asStr: message.toString() });
      return;
    }
    const handler = this.handlers.get(type);
    if (handler) {
      handler(socket, data);
    } else {
      logger.warn('Unhandled message type', { type });
    }
  }

  on(type: string, handler: WsMessageHandler): void {
    if (this.handlers.has(type)) {
      throw new Error(`Handler for ${type} already registered`);
    }
    this.handlers.set(type, handler);
  }

  off(type: string): void {
    this.handlers.delete(type);
  }

  connectionFor(userId: number): ws | undefined {
    return this.connections.get(userId);
  }
}

const wsHandler = new WSHandler();

export default wsHandler;
