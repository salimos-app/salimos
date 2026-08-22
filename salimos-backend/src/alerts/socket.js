const { WebSocketServer } = require('ws');
const { ALERT_TYPES } = require('./alertTypes');
const { listAlerts, reportAlert, sweepExpired } = require('./store');

const SWEEP_INTERVAL_MS = 30 * 1000;

/**
 * Protocolo (JSON sobre un único WebSocket en /ws):
 *
 * Cliente -> Servidor
 *   { type: 'subscribe', slug }              suscribirse a las alertas de una discoteca
 *   { type: 'unsubscribe' }                  darse de baja de la discoteca actual
 *   { type: 'report', slug, alertType, value? } reportar una alerta
 *
 * Servidor -> Cliente
 *   { type: 'catalog', alertTypes }          catálogo de tipos, al conectar
 *   { type: 'alerts:sync', slug, alerts }    estado completo al suscribirse
 *   { type: 'alerts:update', slug, alert }   alerta nueva o refrescada
 *   { type: 'alerts:expired', slug, alertId } una alerta dejó de estar activa
 *   { type: 'error', message }
 */
function attachAlertsSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  // slug -> Set<WebSocket>
  const rooms = new Map();

  function joinRoom(ws, slug) {
    leaveRoom(ws);
    if (!rooms.has(slug)) {
      rooms.set(slug, new Set());
    }
    rooms.get(slug).add(ws);
    ws.discotecaSlug = slug;
  }

  function leaveRoom(ws) {
    if (!ws.discotecaSlug) return;
    rooms.get(ws.discotecaSlug)?.delete(ws);
    ws.discotecaSlug = null;
  }

  function send(ws, message) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  function broadcast(slug, message) {
    const clients = rooms.get(slug);
    if (!clients) return;
    const payload = JSON.stringify(message);
    for (const client of clients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  }

  wss.on('connection', (ws) => {
    send(ws, { type: 'catalog', alertTypes: ALERT_TYPES });

    ws.on('message', (raw) => {
      let message;
      try {
        message = JSON.parse(raw.toString());
      } catch {
        send(ws, { type: 'error', message: 'JSON inválido' });
        return;
      }

      switch (message?.type) {
        case 'subscribe': {
          if (typeof message.slug !== 'string' || !message.slug) return;
          joinRoom(ws, message.slug);
          send(ws, { type: 'alerts:sync', slug: message.slug, alerts: listAlerts(message.slug) });
          break;
        }
        case 'unsubscribe': {
          leaveRoom(ws);
          break;
        }
        case 'report': {
          if (typeof message.slug !== 'string' || typeof message.alertType !== 'string') return;
          try {
            const alert = reportAlert(message.slug, message.alertType, message.value);
            broadcast(message.slug, { type: 'alerts:update', slug: message.slug, alert });
          } catch (error) {
            send(ws, { type: 'error', message: error.message });
          }
          break;
        }
        default:
          break;
      }
    });

    ws.on('close', () => leaveRoom(ws));
  });

  const sweepInterval = setInterval(() => {
    sweepExpired((slug, alert) => {
      broadcast(slug, { type: 'alerts:expired', slug, alertId: alert.id });
    });
  }, SWEEP_INTERVAL_MS);
  sweepInterval.unref?.();

  return wss;
}

module.exports = { attachAlertsSocket };
