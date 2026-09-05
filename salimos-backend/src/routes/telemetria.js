const { Router } = require('express');
const crypto = require('crypto');
const { getDb } = require('../db/client');
const { ensureSchemaOnce } = require('../db/ready');

const router = Router();

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_EVENTOS_POR_LOTE = 50;
const MAX_PROPS_CHARS = 2000;

/**
 * POST /api/telemetria — lote de eventos de uso de una instalación anónima.
 *
 * Cuerpo: `{ installId, eventos: [{ nombre, props?, ts? }] }`. La app los
 * encola y los manda en tandas (al llegar a 20, cada 15 s, o al pasar la app
 * a segundo plano). Se insertan en una sola transacción; los eventos sin
 * `nombre` se descartan en silencio en vez de tumbar el lote entero.
 */
router.post('/', async (req, res) => {
  const body = req.body ?? {};
  const installId = typeof body.installId === 'string' ? body.installId.trim() : '';

  if (!UUID_PATTERN.test(installId)) {
    res.status(400).json({ error: 'installId debe ser un UUID.' });
    return;
  }
  if (!Array.isArray(body.eventos) || body.eventos.length === 0) {
    res.status(400).json({ error: 'eventos debe ser un array no vacío.' });
    return;
  }

  const ahora = Date.now();
  const sentencias = body.eventos.slice(0, MAX_EVENTOS_POR_LOTE).flatMap((evento) => {
    const nombre =
      evento && typeof evento.nombre === 'string' ? evento.nombre.trim().slice(0, 60) : '';
    if (!nombre) return [];

    let props = null;
    if (evento.props && typeof evento.props === 'object') {
      try {
        props = JSON.stringify(evento.props).slice(0, MAX_PROPS_CHARS);
      } catch {
        props = null;
      }
    }

    const ocurrio = Number.isFinite(evento.ts) ? Math.floor(evento.ts) : ahora;

    return [
      {
        sql: `
          INSERT INTO telemetria (id, install_id, evento, props, ocurrio_en, recibido_en)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [crypto.randomUUID(), installId, nombre, props, ocurrio, ahora],
      },
    ];
  });

  if (sentencias.length === 0) {
    res.status(400).json({ error: 'Ningún evento válido en el lote.' });
    return;
  }

  try {
    const db = getDb();
    await ensureSchemaOnce(db);
    await db.batch(sentencias, 'write');
    res.status(204).end();
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

module.exports = router;
