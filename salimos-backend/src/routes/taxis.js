const { Router } = require('express');
const { getDb } = require('../db/client');
const { paradaTaxiFromRow } = require('../db/rowMappers');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const [paradasResult, settingsResult] = await Promise.all([
      db.execute('SELECT * FROM paradas_taxi'),
      db.execute({
        sql: 'SELECT key, value FROM app_settings WHERE key IN (?, ?)',
        args: ['radio_taxi_nombre', 'radio_taxi_telefono'],
      }),
    ]);

    const settings = Object.fromEntries(settingsResult.rows.map((row) => [row.key, row.value]));

    res.json({
      data: {
        paradas: paradasResult.rows.map(paradaTaxiFromRow),
        radioTaxi: {
          nombre: settings.radio_taxi_nombre ?? null,
          telefono: settings.radio_taxi_telefono ?? null,
        },
      },
    });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

module.exports = router;
