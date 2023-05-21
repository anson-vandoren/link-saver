import './config';
import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import cors from 'cors';
import * as http from 'http';
import serveStatic from 'serve-static';
import * as path from 'path';
import { appRouter } from './routers/index';
import { createContext } from './context';
import logger from './logger';
import wsHandler from './websocket';
import { decodeAndVerifyJwtToken } from './jwt';
import { DbContext } from './db';

process.on('SIGINT', () => {
  logger.warn('Received SIGINT signal. Shutting down gracefully.');
  // Add your cleanup code here
  process.exit(0);
});

let dirname;
if (typeof import.meta.url !== 'undefined') {
  console.log(import.meta)
  dirname = path.dirname(new URL(import.meta.url).pathname);
} else {
  dirname = __dirname;
}

const PORT = 3001;

const corsMiddleware = cors();

// tRPC
const tRpcHandler = createHTTPHandler({
  middleware: corsMiddleware,
  router: appRouter,
  createContext,
  onError(opts) {
    const { error, input, type, path: reqPath, ctx } = opts;
    let userId: number | undefined;
    if (ctx?.user) {
      const { user } = ctx;
      userId = user?.id;
    }
    logger.error('tRPC error', {
      error,
      input,
      type,
      path: reqPath,
      userId,
      errMsg: error.message,
      errStack: error.stack,
    });
  },
});

// serve static content
const staticRootPath = path.join(dirname, '..', 'www');
logger.info('Serving static content from', { staticRootPath });
const staticHandler = serveStatic(staticRootPath, {
  extensions: ['html'],
});

const dbContext = DbContext.create();

function logTrpcRequest(req: http.IncomingMessage) {
  if (!req.url) return;
  const url = new URL(req.url, 'http://localhost');
  const basePath = '/api/v2/';
  const restOfPath = url.pathname.slice(basePath.length);
  const endpoints = restOfPath.split(',');
  const method = req.method?.toUpperCase() ?? '';
  if (method === 'GET') {
    const queryParams = Object.fromEntries(url.searchParams.entries());
    try {
      const input = JSON.parse(queryParams.input) as Record<string, string>;
      logger.debug('tRPC request', {
        method: req.method,
        endpoints,
        input,
      });
    } catch (error) {
      logger.debug('tRPC request', { method, path: url.pathname, queryParams });
    }
  } else if (method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (body.length) {
        let asJson: Record<string, string> = {};
        try {
          asJson = JSON.parse(body) as Record<string, string>;
          logger.debug('tRPC request', { method, body: asJson, endpoints });
        } catch (error) {
          logger.debug('tRPC request', { method, body });
        }
      }
    });
  } else {
    logger.debug('tRPC request', { method, path: req.url });
  }
}

const server = http.createServer((req, res) => {
  // if an API call, send to tRPC
  if (req.url?.startsWith('/api/v2')) {
    logTrpcRequest(req);
    req.url = req.url.replace('/api/v2', '');
    tRpcHandler(req, res).catch((err: Error) => {
      logger.error('Failed to handle tRPC request:', { error: err });
      res.statusCode = 500;
      res.end('Failed to handle tRPC request');
    });
    return;
  }
  const isHtmlRequest = req.headers.accept?.includes('text/html');
  // if no users, send to signup.html
  const hasRegisteredUsers = dbContext.User.hasRegisteredUsers();
  if (isHtmlRequest && !hasRegisteredUsers && req.url !== '/signup.html') {
    logger.info('No registered users, redirecting to signup.html');
    res.writeHead(302, { Location: '/signup.html' });
    res.end();
    return;
  }
  // if not logged in, but there is at least one user, send to index.html
  const token = req.headers.authorization?.split(' ')[1] ?? '';
  if (isHtmlRequest && token && req.url !== '/index.html' && req.url !== '/signup.html') {
    try {
      decodeAndVerifyJwtToken(dbContext, token ?? '');
    } catch (error) {
      logger.error('Failed to decode and verify JWT token:', { error, token: token ?? 'undefined' });
      res.writeHead(302, { Location: '/index.html' });
      res.end();
      return;
    }
  }
  corsMiddleware(req, res, (err: Error) => {
    logger.debug('Incoming request', { path: req.url, method: req.method });
    if (err) {
      logger.error('Failed to serve static content:', { error: err });
      res.statusCode = 500;
      res.end('Failed to serve static content');
      return;
    }
    logger.debug('Serving static content', { path: req.url, method: req.method });
    staticHandler(req, res, () => {
      res.statusCode = 404;
      res.end('Not found');
    });
  });
});

// Start the server
server.listen({ port: PORT, host: '0.0.0.0' }, () => {
  logger.info('Server started', { port: PORT });
});
wsHandler.listen(server).then(() => {
  logger.info('Websocket server started');
}).catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Failed to start websocket server:', { message });
});
