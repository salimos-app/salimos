const { Router } = require('express');
const { getDb } = require('../db/client');
const { discotecaFromRow } = require('../db/rowMappers');
const { createCache } = require('../cache');

const router = Router();

// El catálogo de discotecas lo edita una persona a mano, no cambia de un
// minuto a otro: cachearlo evita golpear Turso en cada apertura de la app
// (que es exactamente el patrón de tráfico esperado) a medida que crece el
// número de usuarios. TTL corto (comparado con microsites.js) porque, a
// diferencia de los datos de Fourvenues, conviene que un cambio manual se
// refleje razonablemente rápido.
const { read: readCache, write: writeCache } = createCache(5 * 60 * 1000);

router.get('/', async (req, res) => {
  const cacheKey = 'discotecas';
  const cached = readCache(cacheKey);
  if (cached) {
    res.json({ data: cached });
    return;
  }

  try {
    const db = getDb();
    const result = await db.execute('SELECT * FROM discotecas ORDER BY orden ASC');
    const data = result.rows.map(discotecaFromRow);
    writeCache(cacheKey, data);
    res.json({ data });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

/**
 * Snapshot semanal de eventos (tabla `eventos`, la puebla el barrido en
 * src/jobs/sweepEventos.js). Sin precios a propósito, ver db/schema.js.
 * Distinto de GET /api/microsites/:slug/events, que pega en vivo a
 * Fourvenues en cada petición.
 */
router.get('/:slug/eventos-cache', async (req, res) => {
  const cacheKey = `eventos-cache:${req.params.slug}`;
  const cached = readCache(cacheKey);
  if (cached) {
    res.json({ data: cached });
    return;
  }

  try {
    const db = getDb();
    const ahora = Math.floor(Date.now() / 1000);
    const result = await db.execute({
      sql: 'SELECT * FROM eventos WHERE discoteca_slug = ? AND (end_date IS NULL OR end_date >= ?) ORDER BY start_date ASC',
      args: [req.params.slug, ahora],
    });
    writeCache(cacheKey, result.rows);
    res.json({ data: result.rows });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

module.exports = router;
