const { Router } = require('express');
const { DISCOTECAS } = require('../discotecas/discotecas');
const { getDb } = require('../db/client');

const router = Router();

router.get('/', (req, res) => {
  res.json({ data: DISCOTECAS });
});

/**
 * Snapshot semanal de eventos (tabla `eventos`, la puebla el barrido en
 * src/jobs/sweepEventos.js). Sin precios a propósito, ver db/schema.js.
 * Distinto de GET /api/microsites/:slug/events, que pega en vivo a
 * Fourvenues en cada petición.
 */
router.get('/:slug/eventos-cache', async (req, res) => {
  try {
    const db = getDb();
    const ahora = Math.floor(Date.now() / 1000);
    const result = await db.execute({
      sql: 'SELECT * FROM eventos WHERE discoteca_slug = ? AND (end_date IS NULL OR end_date >= ?) ORDER BY start_date ASC',
      args: [req.params.slug, ahora],
    });
    res.json({ data: result.rows });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

module.exports = router;
