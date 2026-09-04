const { fetchAllEventos } = require('../fourvenues');
const { getDb } = require('../db/client');
const { ensureSchema } = require('../db/schema');

/**
 * Barrido semanal: trae los eventos de cada discoteca con slug de Fourvenues
 * y sustituye su snapshot en la tabla `eventos` (sin tocar precios, ver
 * db/schema.js). Pensado para lanzarse como cron aparte (`npm run sweep`),
 * no desde el proceso del servidor —así un fallo del barrido no tira el
 * proxy en vivo, y un servidor free de Render que se duerme no se lo salta.
 *
 * Si Fourvenues falla para una discoteca, esa discoteca se salta y se deja
 * su snapshot anterior tal cual (mejor datos de la semana pasada que
 * borrarlos y quedarse sin nada).
 */
async function runSweep() {
  const db = getDb();
  await ensureSchema(db);

  const slugsResult = await db.execute('SELECT slug FROM discotecas WHERE slug IS NOT NULL');
  const slugs = slugsResult.rows.map((row) => row.slug);
  const resumen = [];

  for (const slug of slugs) {
    try {
      const eventos = await fetchAllEventos(slug);
      const ahora = Date.now();

      const statements = [
        { sql: 'DELETE FROM eventos WHERE discoteca_slug = ?', args: [slug] },
        ...eventos
          .filter((evento) => typeof evento.id === 'string')
          .map((evento) => ({
            sql: `INSERT INTO eventos
              (id, discoteca_slug, code, name, description, start_date, end_date, image, address, fourvenues_updated_at, synced_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              evento.id,
              slug,
              evento.code ?? null,
              evento.name ?? '',
              evento.description ?? null,
              evento.dates?.start ?? null,
              evento.dates?.end ?? null,
              evento.image ?? null,
              evento.location?.addressComplete ?? null,
              evento.updatedAt ?? null,
              ahora,
            ],
          })),
      ];

      await db.batch(statements, 'write');
      resumen.push({ slug, eventos: eventos.length, ok: true });
    } catch (error) {
      resumen.push({ slug, ok: false, error: error.message });
    }
  }

  return resumen;
}

if (require.main === module) {
  runSweep()
    .then((resumen) => {
      console.log('Barrido de eventos terminado:');
      for (const r of resumen) {
        console.log(
          r.ok ? `  ✓ ${r.slug}: ${r.eventos} eventos` : `  ✗ ${r.slug}: ${r.error}`
        );
      }
      const fallos = resumen.filter((r) => !r.ok).length;
      process.exit(fallos > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('El barrido falló por completo:', error);
      process.exit(1);
    });
}

module.exports = { runSweep };
