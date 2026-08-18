const https = require('https');
const express = require('express');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// Render asigna el puerto automáticamente via process.env.PORT
const PORT = process.env.PORT || 8082;
const API_HOST = 'cli-api-service.fourvenues.com';
const API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHAiOiJjbGktYXBpLXNlcnZpY2UiLCJpYXQiOjE3ODY5MDQ5MzR9.gagE3yvxbOaER_dbY8JFrAaFSAJrxwVDWeOg_aXPsS8';

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Demasiadas solicitudes, por favor intente más tarde' }
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// CORS headers for all routes
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Proxy API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'NightSpot Proxy API is running',
    endpoints: ['/api/microsites/:slug/metadata', '/api/health'],
    status: 'ok'
  });
});

// Handle OPTIONS preflight requests
app.options('/api', (req, res) => {
  res.writeHead(204);
  res.end();
});

// Proxy all /api/* requests to the external API
app.use('/api', (req, res) => {
  // Skip health check (already handled above)
  if (req.path === '/health') {
    return;
  }

  const path = req.originalUrl;

  const options = {
    hostname: API_HOST,
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  const apiReq = https.request(options, (apiRes) => {
    const chunks = [];
    apiRes.on('data', (chunk) => {
      chunks.push(chunk);
    });
    apiRes.on('end', () => {
      const data = Buffer.concat(chunks).toString('utf8');
      res.writeHead(apiRes.statusCode || 200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      res.end(data);
    });
  });

  apiReq.on('error', (error) => {
    console.error('Proxy request error:', error.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  });

  apiReq.end();
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy API corriendo en http://localhost:${PORT}`);
  console.log(`Proxy accesible desde móvil en http://${localIP}:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});