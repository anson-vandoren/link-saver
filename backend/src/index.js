require('dotenv').config();
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user');
const linkRoutes = require('./routes/link');
const errorHandler = require('./middleware/errorHandler');
const sequelize = require('./database');
const WebSocket = require('ws');
const http = require('http');
const https = require('https');
const jwt = require('jsonwebtoken');
const { JSDOM } = require('jsdom');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/links', linkRoutes);

// Error handler
app.use(errorHandler);

// WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

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

  ws.on('message', async (message) => {
    let url = message.toString();
    try {
      const { title, description, url: finalUrl } = await fetchTitleAndDescription(url);
      ws.send(JSON.stringify({ title, description, url: finalUrl }));
    } catch (error) {
      console.error('Failed to fetch title and description:', error);
      ws.send(JSON.stringify({ title: '', description: '', url }));
      return;
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

async function fetchTitleAndDescription(url) {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }

    const { data, finalUrl } = await fetchUrlData(url);
    const dom = new JSDOM(data);
    const title = dom.window.document.querySelector('head > title').textContent || '';
    const description =
      dom.window.document.querySelector('head > meta[name="description"]')?.getAttribute('content') || '';

    return { title, description, url: finalUrl };
  } catch (error) {
    console.error('Failed to fetch title and description:', error);
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
        fetchUrlData(redirectUrl).then((redirectData) => {
          resolve({ data: redirectData.data, finalUrl: redirectData.finalUrl });
        }).catch(reject);
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
(async () => {
  try {
    await sequelize.sync();
    console.log('Database synchronized');
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error synchronizing database:', error);
  }
})();
