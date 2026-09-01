const { Router } = require('express');
const https = require('https');
const config = require('../config');

const router = Router();

// Caché en memoria de las respuestas de Fourvenues. Los eventos y las
// coordenadas de un local no cambian de un minuto a otro, así que servirlas
// desde aquí evita machacar a Fourvenues (y el rate-limiter propio) cada vez
// que un cliente arranca. Solo se cachean respuestas correctas.
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

function readCache(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache(key, value) {
  cache.set(key, { at: Date.now(), value });
}

function fetchFromFourvenues(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.fourvenues.host,
      port: 443,
      path,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.fourvenues.token}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 200,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

router.get('/:slug/metadata', async (req, res) => {
  const cacheKey = `metadata:${req.params.slug}`;
  const cached = readCache(cacheKey);
  if (cached) {
    res.type('application/json; charset=utf-8').send(cached);
    return;
  }

  try {
    const { statusCode, body } = await fetchFromFourvenues(
      `/api/microsites/${req.params.slug}/metadata`
    );
    if (statusCode === 200) {
      writeCache(cacheKey, body);
    }
    res.status(statusCode).type('application/json; charset=utf-8').send(body);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

const NINETY_DAYS_SECONDS = 90 * 24 * 60 * 60;

/**
 * Eventos con imagen. A diferencia de /metadata (feed schema.org sin
 * imágenes), este pega contra /api/events de Fourvenues, que sí devuelve
 * `image` por evento.
 */
router.get('/:slug/events', async (req, res) => {
  const cacheKey = `events:${req.params.slug}`;
  const cached = readCache(cacheKey);
  if (cached) {
    res.json({ data: cached });
    return;
  }

  try {
    const startDate = Math.floor(Date.now() / 1000);
    const endDate = startDate + NINETY_DAYS_SECONDS;

    const events = [];
    let page = 1;
    let totalPages = 1;

    do {
      const query = new URLSearchParams({
        slug: req.params.slug,
        startDate: String(startDate),
        endDate: String(endDate),
        page: String(page),
      });

      const { statusCode, body } = await fetchFromFourvenues(`/api/events?${query}`);

      if (statusCode !== 200) {
        res.status(statusCode).type('application/json; charset=utf-8').send(body);
        return;
      }

      const parsed = JSON.parse(body);
      events.push(...(parsed.data ?? []));
      totalPages = parsed.metadata?.totalPages ?? 1;
      page += 1;
    } while (page <= totalPages);

    writeCache(cacheKey, events);
    res.json({ data: events });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

module.exports = router;
