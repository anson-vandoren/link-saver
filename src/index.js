import { URL } from 'url';
// config.js must be first to ensure .env variables are loaded before anything else
import './config.js';
import express from 'express';
import cors from 'cors';
import { join } from 'path';
import { JSDOM } from 'jsdom';
import * as https from 'https';
import * as http from 'http';
import './models/associations.js'; // needs to be near the top
import userRoutes from './routes/user.js';
import linkRoutes from './routes/link.js';
import tagRoutes from './routes/tag.js';
import errorHandler from './middleware/errorHandler.js';
import checkUserRegistered from './middleware/checkUserRegistered.js';
import sequelize from './database.js';
import wsHandler from './websocket.js';
import logger from './logger.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.originalUrl}`);
  next();
});

const __dirname = new URL('.', import.meta.url).pathname;

app.use(checkUserRegistered);
// serve index.html at the root path, and other static content as needed
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '..', 'public', 'dist')));
}
app.use(express.static(join(__dirname, '..', 'public')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/links', checkUserRegistered, linkRoutes);
app.use('/api/tags', tagRoutes);
app.get('/bookmarks', checkUserRegistered, (_req, res) => {
  res.sendFile(join(__dirname, '..', 'public', 'bookmarks.html'));
});
app.get('/signup', (_req, res) => {
  res.sendFile(join(__dirname, '..', 'public', 'signup.html'));
});

// Error handler
app.use(errorHandler);

// WebSocket server
const server = http.createServer(app);

wsHandler.on('scrapeFQDN', async (sock, msg) => {
  const { url } = msg;
  try {
    const { title, description, url: finalUrl } = await fetchTitleAndDescription(url.toString());
    const data = { title, description, url: finalUrl };
    sock.send(JSON.stringify({ type: 'scrapeFQDN', data}));
  } catch (error) {
    logger.error('Failed to fetch title and description:', { error });
    sock.send(JSON.stringify({ type: 'error', data: `Failed to fetch title and description: ${error}` }));
  }
});

async function fetchTitleAndDescription(providedUrl) {
  let url = providedUrl;
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }

    const { data, finalUrl } = await fetchUrlData(url);
    const dom = new JSDOM(data);
    const title = dom.window.document.querySelector('head > title').textContent || '';
    const description = dom.window.document
      .querySelector('head > meta[name="description"]')
      ?.getAttribute('content') || '';

    return { title, description, url: finalUrl };
  } catch (error) {
    logger.error('Failed to fetch title and description:', { error });
    return { title: '', description: '', url };
  }
}

async function fetchUrlData(url) {
  const get = url.startsWith('https') ? https.get : http.get;

  return new Promise((resolve, reject) => {
    const request = get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        const redirectUrl = new URL(res.headers.location, url).href;
        fetchUrlData(redirectUrl)
          .then((redirectData) => {
            resolve({ data: redirectData.data, finalUrl: redirectData.finalUrl });
          })
          .catch(reject);
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve({ data, finalUrl: url });
        });
      } else {
        reject(new Error(`Request failed with status code ${res.statusCode}`));
      }
    });

    request.on('error', (err) => {
      reject(err);
    });

    request.end();
  });
}

// Start the server
try {
  await sequelize.sync();
  logger.info('Database synchronized');
} catch (error) {
  logger.error('Error synchronizing database:', error);
}
server.listen(PORT, '0.0.0.0', () => {
  logger.info('Server started', { port: PORT });
});
await wsHandler.listen(server);
