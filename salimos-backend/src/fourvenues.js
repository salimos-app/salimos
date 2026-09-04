const https = require('https');
const config = require('./config');

/** Cliente HTTP crudo hacia la API de Fourvenues (ver API.md para las rutas conocidas). */
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

const NINETY_DAYS_SECONDS = 90 * 24 * 60 * 60;

/**
 * Todos los eventos futuros (90 días) de un local, agregando todas las
 * páginas de /api/events. Lanza si Fourvenues responde con algo != 200 en
 * cualquier página.
 */
async function fetchAllEventos(slug) {
  const startDate = Math.floor(Date.now() / 1000);
  const endDate = startDate + NINETY_DAYS_SECONDS;

  const events = [];
  let page = 1;
  let totalPages = 1;

  do {
    const query = new URLSearchParams({
      slug,
      startDate: String(startDate),
      endDate: String(endDate),
      page: String(page),
    });

    const { statusCode, body } = await fetchFromFourvenues(`/api/events?${query}`);

    if (statusCode !== 200) {
      throw new Error(`Fourvenues respondió ${statusCode} para slug=${slug}: ${body}`);
    }

    const parsed = JSON.parse(body);
    events.push(...(parsed.data ?? []));
    totalPages = parsed.metadata?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);

  return events;
}

module.exports = { fetchFromFourvenues, fetchAllEventos, NINETY_DAYS_SECONDS };
