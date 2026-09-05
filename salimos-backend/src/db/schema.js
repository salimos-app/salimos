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

/**
 * Discotecas conocidas por la app (ver src/db/seed.js para los datos y su
 * procedencia). `orden` conserva el orden de presentación original: importa
 * para el color cíclico y para elegir "la primera" como centro inicial del
 * mapa en el frontend.
 */
const CREATE_DISCOTECAS_TABLE = `
  CREATE TABLE IF NOT EXISTS discotecas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    slug TEXT UNIQUE,
    direccion TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    latitud REAL NOT NULL,
    longitud REAL NOT NULL,
    genero TEXT NOT NULL,
    precio_entrada INTEGER,
    rating REAL,
    horario TEXT,
    imagen TEXT NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0
  )
`;

/** Bares, pubs, supermercados y tiendas de conveniencia (OpenStreetMap). */
const CREATE_SITIOS_TABLE = `
  CREATE TABLE IF NOT EXISTS sitios (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    categoria TEXT NOT NULL,
    latitud REAL NOT NULL,
    longitud REAL NOT NULL,
    direccion TEXT
  )
`;

/** Paradas de taxi (OpenStreetMap). El teléfono de Radio Taxi va en app_settings. */
const CREATE_PARADAS_TAXI_TABLE = `
  CREATE TABLE IF NOT EXISTS paradas_taxi (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    latitud REAL NOT NULL,
    longitud REAL NOT NULL
  )
`;

/** Configuración suelta clave/valor (ej: nombre y teléfono de Radio Taxi). */
const CREATE_APP_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`;

/**
 * Registro anónimo de instalaciones de la app. No hay cuentas ni login: la
 * app genera un UUID la primera vez que arranca (ver
 * src/services/telemetria.ts en el frontend) y lo manda aquí junto con los
 * metadatos de la descarga (plataforma, versión, `install_referrer` de Play
 * Store...). Cada arranque posterior es un upsert que refresca `ultima_vez`
 * y suma una apertura. Ningún dato personal — el `id_for_vendor` es un id
 * por proveedor que el sistema operativo resetea al desinstalar.
 */
const CREATE_USUARIOS_TABLE = `
  CREATE TABLE IF NOT EXISTS usuarios (
    install_id TEXT PRIMARY KEY,
    plataforma TEXT,
    os_version TEXT,
    device_model TEXT,
    app_version TEXT,
    build_version TEXT,
    locale TEXT,
    timezone TEXT,
    install_time INTEGER,
    install_referrer TEXT,
    id_for_vendor TEXT,
    primera_vez INTEGER NOT NULL,
    ultima_vez INTEGER NOT NULL,
    aperturas INTEGER NOT NULL DEFAULT 1
  )
`;

/**
 * Telemetría de uso: un evento por fila (`app_abierta`, `discoteca_seleccionada`,
 * `ruta_calculada`...), con `props` como JSON libre y ligado a una instalación
 * por `install_id`. La app los encola y los manda en lotes (ver `flush` en
 * src/services/telemetria.ts). `ocurrio_en` lo pone el cliente; `recibido_en`
 * el backend (para detectar relojes desfasados o reenvíos).
 */
const CREATE_TELEMETRIA_TABLE = `
  CREATE TABLE IF NOT EXISTS telemetria (
    id TEXT PRIMARY KEY,
    install_id TEXT NOT NULL,
    evento TEXT NOT NULL,
    props TEXT,
    ocurrio_en INTEGER NOT NULL,
    recibido_en INTEGER NOT NULL
  )
`;

const CREATE_TELEMETRIA_INSTALL_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_telemetria_install ON telemetria(install_id)
`;

const CREATE_TELEMETRIA_EVENTO_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_telemetria_evento ON telemetria(evento)
`;

async function ensureSchema(db) {
  await db.execute(CREATE_EVENTOS_TABLE);
  await db.execute(CREATE_SLUG_INDEX);
  await db.execute(CREATE_START_DATE_INDEX);
  await db.execute(CREATE_DISCOTECAS_TABLE);
  await db.execute(CREATE_SITIOS_TABLE);
  await db.execute(CREATE_PARADAS_TAXI_TABLE);
  await db.execute(CREATE_APP_SETTINGS_TABLE);
  await db.execute(CREATE_USUARIOS_TABLE);
  await db.execute(CREATE_TELEMETRIA_TABLE);
  await db.execute(CREATE_TELEMETRIA_INSTALL_INDEX);
  await db.execute(CREATE_TELEMETRIA_EVENTO_INDEX);
}

module.exports = { ensureSchema };
