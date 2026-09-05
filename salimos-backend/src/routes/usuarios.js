const { Router } = require('express');
const { getDb } = require('../db/client');
const { ensureSchemaOnce } = require('../db/ready');

const router = Router();

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Recorta a string no vacío y con tope de longitud, o `null`. */
function texto(valor, max) {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim();
  return limpio ? limpio.slice(0, max) : null;
}

function entero(valor) {
  return Number.isFinite(valor) ? Math.floor(valor) : null;
}

/**
 * POST /api/usuarios — alta o "heartbeat" de una instalación anónima.
 *
 * No crea cuentas: el cuerpo trae el `installId` (UUID que genera la app la
 * primera vez y guarda en el dispositivo) más los metadatos de la descarga.
 * Es idempotente — cada arranque de la app vuelve a llamar aquí y esto hace
 * un upsert: refresca los metadatos, mueve `ultima_vez` y suma una apertura.
 */
router.post('/', async (req, res) => {
  const body = req.body ?? {};
  const installId = texto(body.installId, 40);

  if (!installId || !UUID_PATTERN.test(installId)) {
    res.status(400).json({ error: 'installId debe ser un UUID.' });
    return;
  }

  const ahora = Date.now();

  try {
    const db = getDb();
    await ensureSchemaOnce(db);
    await db.execute({
      sql: `
        INSERT INTO usuarios (
          install_id, plataforma, os_version, device_model, app_version, build_version,
          locale, timezone, install_time, install_referrer, id_for_vendor,
          primera_vez, ultima_vez, aperturas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ON CONFLICT(install_id) DO UPDATE SET
          plataforma = excluded.plataforma,
          os_version = excluded.os_version,
          device_model = excluded.device_model,
          app_version = excluded.app_version,
          build_version = excluded.build_version,
          locale = excluded.locale,
          timezone = excluded.timezone,
          install_time = COALESCE(excluded.install_time, usuarios.install_time),
          install_referrer = COALESCE(excluded.install_referrer, usuarios.install_referrer),
          id_for_vendor = COALESCE(excluded.id_for_vendor, usuarios.id_for_vendor),
          ultima_vez = excluded.ultima_vez,
          aperturas = usuarios.aperturas + 1
      `,
      args: [
        installId,
        texto(body.plataforma, 20),
        texto(body.osVersion, 40),
        texto(body.deviceModel, 80),
        texto(body.appVersion, 30),
        texto(body.buildVersion, 30),
        texto(body.locale, 20),
        texto(body.timezone, 60),
        entero(body.installTime),
        texto(body.installReferrer, 500),
        texto(body.idForVendor, 80),
        ahora,
        ahora,
      ],
    });
    res.status(204).end();
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

module.exports = router;
