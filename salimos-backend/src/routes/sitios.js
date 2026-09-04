const { Router } = require('express');
const { getDb } = require('../db/client');
const { sitioFromRow } = require('../db/rowMappers');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.execute('SELECT * FROM sitios');
    res.json({ data: result.rows.map(sitioFromRow) });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

module.exports = router;
