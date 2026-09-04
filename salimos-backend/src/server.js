const http = require('http');
const express = require('express');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const config = require('./config');
const micrositesRouter = require('./routes/microsites');
const directionsRouter = require('./routes/directions');
const discotecasRouter = require('./routes/discotecas');
const sitiosRouter = require('./routes/sitios');
const taxisRouter = require('./routes/taxis');
const internalRouter = require('./routes/internal');
const { attachAlertsSocket } = require('./alerts/socket');

const app = express();

// Render (y cualquier PaaS) sirve detrás de un balanceador: sin esto,
// `req.ip` es la IP del proxy y el rate-limiter mete a TODOS los usuarios
// en el mismo cubo (se agota enseguida). Con 1 hop de confianza el límite
// pasa a ser por usuario real.
app.set('trust proxy', 1);

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
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes, por favor intente más tarde' },
  })
);

app.get('/', (req, res) => {
  res.json({
    message: 'Salimos backend está funcionando',
    endpoints: [
      '/api/discotecas',
      '/api/sitios',
      '/api/taxis',
      '/api/microsites/:slug/metadata',
      '/api/microsites/:slug/events',
      '/api/microsites/:slug/events/:eventId/tickets-types',
      '/api/discotecas/:slug/eventos-cache',
      'POST /api/internal/sweep',
      '/api/directions/:profile',
      '/api/health',
      'ws:/ws',
    ],
    status: 'ok',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/microsites', micrositesRouter);
app.use('/api/directions', directionsRouter);
app.use('/api/discotecas', discotecasRouter);
app.use('/api/sitios', sitiosRouter);
app.use('/api/taxis', taxisRouter);
app.use('/api/internal', internalRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const server = http.createServer(app);
attachAlertsSocket(server);

server.listen(config.port, '0.0.0.0', () => {
  console.log(`Salimos backend escuchando en el puerto ${config.port} (HTTP + WebSocket /ws)`);
});
