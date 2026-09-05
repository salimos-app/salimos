const { Router } = require('express');
const { getDb } = require('../db/client');
const { sitioFromRow } = require('../db/rowMappers');
const { createCache } = require('../cache');

const router = Router();

// Mismo razonamiento que en discotecas.js: catálogo editado a mano, TTL
// corto para no tardar en reflejar cambios pero evitar golpear Turso en
// cada apertura de la app.
const { read: readCache, write: writeCache } = createCache(5 * 60 * 1000);

router.get('/', async (req, res) => {
  const cacheKey = 'sitios';
  const cached = readCache(cacheKey);
  if (cached) {
    res.json({ data: cached });
    return;
  }

  try {
    const db = getDb();
    const result = await db.execute('SELECT * FROM sitios');
    const data = result.rows.map(sitioFromRow);
    writeCache(cacheKey, data);
    res.json({ data });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

module.exports = router;
