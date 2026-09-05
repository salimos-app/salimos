const { ensureSchema } = require('./schema');

let promesa = null;

/**
 * Garantiza el esquema una sola vez por proceso. El barrido semanal
 * (src/jobs/sweepEventos.js) llama a `ensureSchema` directamente porque él
 * es el dueño de las tablas de catálogo; las rutas que escriben datos que
 * el barrido no crea (registro anónimo, telemetría) usan esto para no
 * ejecutar los `CREATE TABLE IF NOT EXISTS` en cada request.
 */
function ensureSchemaOnce(db) {
  if (!promesa) {
    promesa = ensureSchema(db).catch((error) => {
      promesa = null;
      throw error;
    });
  }
  return promesa;
}

module.exports = { ensureSchemaOnce };
