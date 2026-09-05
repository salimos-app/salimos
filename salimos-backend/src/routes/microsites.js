const { Router } = require('express');
const { fetchFromFourvenues, NINETY_DAYS_SECONDS } = require('../fourvenues');
const { createCache } = require('../cache');

const router = Router();

// Caché en memoria de las respuestas de Fourvenues. Los eventos y las
// coordenadas de un local no cambian de un minuto a otro, así que servirlas
// desde aquí evita machacar a Fourvenues (y el rate-limiter propio) cada vez
// que un cliente arranca. Solo se cachean respuestas correctas.
const { read: readCache, write: writeCache } = createCache(10 * 60 * 1000);

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

/**
 * Tipos de entrada de un evento (tramos de precio, disponibilidad). Pega
 * contra /api/events/:eventId/tickets-types de Fourvenues, que a diferencia
 * de /api/events (metadata del feed) sí incluye precios. Necesita el `id`
 * interno del evento (el que devuelve /api/events como `id`), no el `code`
 * corto que aparece en las URLs públicas de site.fourvenues.com.
 */
router.get('/:slug/events/:eventId/tickets-types', async (req, res) => {
  const cacheKey = `tickets-types:${req.params.eventId}`;
  const cached = readCache(cacheKey);
  if (cached) {
    res.type('application/json; charset=utf-8').send(cached);
    return;
  }

  try {
    const { statusCode, body } = await fetchFromFourvenues(
      `/api/events/${req.params.eventId}/tickets-types?slug=${req.params.slug}`
    );
    if (statusCode === 200) {
      writeCache(cacheKey, body);
    }
    res.status(statusCode).type('application/json; charset=utf-8').send(body);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

/**
 * Detalle de un evento (Fourvenues `/api/events/:code`), para lo que no
 * trae ya /events: código de vestimenta (`perch` en la respuesta real de
 * Fourvenues, sin documentar oficialmente) y qué ofrece (`services`:
 * "listas"/"entradas"/"reservados"). Necesita el `code` corto de 4
 * caracteres (el de la URL pública), no el `id` interno.
 */
router.get('/:slug/events/:code/detail', async (req, res) => {
  const cacheKey = `event-detail:${req.params.code}`;
  const cached = readCache(cacheKey);
  if (cached) {
    res.type('application/json; charset=utf-8').send(cached);
    return;
  }

  try {
    const { statusCode, body } = await fetchFromFourvenues(`/api/events/${req.params.code}`);
    if (statusCode === 200) {
      writeCache(cacheKey, body);
    }
    res.status(statusCode).type('application/json; charset=utf-8').send(body);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

module.exports = router;
