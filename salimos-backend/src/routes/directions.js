const { Router } = require('express');
const https = require('https');
const config = require('../config');

const router = Router();

const PROFILES = new Set(['foot-walking', 'driving-car', 'cycling-regular']);
const COORD_PATTERN = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;

function fetchFromOrs(profile, start, end) {
  return new Promise((resolve, reject) => {
    const path =
      `/v2/directions/${profile}?api_key=${encodeURIComponent(config.ors.apiKey)}` +
      `&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;

    https
      .get({ hostname: 'api.openrouteservice.org', path }, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({ statusCode: res.statusCode || 200, body: Buffer.concat(chunks).toString('utf8') });
        });
      })
      .on('error', reject);
  });
}

// GET /api/directions/:profile?start=lon,lat&end=lon,lat
router.get('/:profile', async (req, res) => {
  const { profile } = req.params;
  const { start, end } = req.query;

  if (!config.ors.apiKey) {
    return res.status(500).json({ error: 'El backend no tiene configurada ORS_API_KEY.' });
  }
  if (!PROFILES.has(profile)) {
    return res.status(400).json({ error: `Perfil inválido. Usa uno de: ${Array.from(PROFILES).join(', ')}` });
  }
  if (typeof start !== 'string' || typeof end !== 'string' || !COORD_PATTERN.test(start) || !COORD_PATTERN.test(end)) {
    return res.status(400).json({ error: 'start y end son obligatorios, en formato "longitud,latitud".' });
  }

  try {
    const { statusCode, body } = await fetchFromOrs(profile, start, end);
    res.status(statusCode).type('application/json; charset=utf-8').send(body);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

module.exports = router;
