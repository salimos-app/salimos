const express = require('express');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const config = require('./config');
const micrositesRouter = require('./routes/microsites');

const app = express();

app.use(morgan('combined'));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Demasiadas solicitudes, por favor intente más tarde' },
  })
);

app.get('/', (req, res) => {
  res.json({
    message: 'Salimos backend está funcionando',
    endpoints: ['/api/microsites/:slug/metadata', '/api/health'],
    status: 'ok',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/microsites', micrositesRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Salimos backend escuchando en el puerto ${config.port}`);
});
