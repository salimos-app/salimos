/**
 * Snapshot semanal de eventos (ver src/jobs/sweepEventos.js). Guarda lo
 * estable —nombre, fechas, imagen, dirección— nunca precios: los tramos de
 * entrada cambian de agotado a disponible en horas, no en días, así que
 * viven aparte, en vivo (GET /api/microsites/:slug/events/:eventId/tickets-types).
 */
const CREATE_EVENTOS_TABLE = `
  CREATE TABLE IF NOT EXISTS eventos (
    id TEXT PRIMARY KEY,
    discoteca_slug TEXT NOT NULL,
    code TEXT,
    name TEXT NOT NULL,
    description TEXT,
    start_date INTEGER,
    end_date INTEGER,
    image TEXT,
    address TEXT,
    fourvenues_updated_at INTEGER,
    synced_at INTEGER NOT NULL
  )
`;

const CREATE_SLUG_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_eventos_slug ON eventos(discoteca_slug)
`;

const CREATE_START_DATE_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_eventos_start_date ON eventos(start_date)
`;

async function ensureSchema(db) {
  await db.execute(CREATE_EVENTOS_TABLE);
  await db.execute(CREATE_SLUG_INDEX);
  await db.execute(CREATE_START_DATE_INDEX);
}

module.exports = { ensureSchema };
