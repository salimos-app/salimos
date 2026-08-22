const { ALERT_TYPES_BY_ID } = require('./alertTypes');

// slug -> Map<alertKey, alert>
const alertsBySlug = new Map();

function keyFor(typeId, value) {
  return value === undefined || value === null ? typeId : `${typeId}:${value}`;
}

function getRoom(slug) {
  if (!alertsBySlug.has(slug)) {
    alertsBySlug.set(slug, new Map());
  }
  return alertsBySlug.get(slug);
}

function listAlerts(slug) {
  return Array.from(getRoom(slug).values());
}

/**
 * Registra un reporte. Si ya existe una alerta activa del mismo tipo
 * (y valor, cuando aplica) se refresca su expiración y se suma al contador
 * en lugar de crear un duplicado.
 */
function reportAlert(slug, typeId, value) {
  const type = ALERT_TYPES_BY_ID.get(typeId);
  if (!type) {
    throw new Error(`Tipo de alerta desconocido: ${typeId}`);
  }
  if (type.requiresValue && (value === undefined || value === null || Number.isNaN(Number(value)))) {
    throw new Error(`El tipo de alerta "${typeId}" requiere un valor numérico`);
  }

  const room = getRoom(slug);
  const normalizedValue = type.requiresValue ? Number(value) : null;
  const key = keyFor(typeId, normalizedValue);
  const now = Date.now();
  const expiresAt = now + type.ttlMinutes * 60 * 1000;

  const existing = room.get(key);
  const alert = existing
    ? { ...existing, count: existing.count + 1, lastReportedAt: now, expiresAt }
    : {
        id: key,
        typeId,
        value: normalizedValue,
        count: 1,
        firstReportedAt: now,
        lastReportedAt: now,
        expiresAt,
      };

  room.set(key, alert);
  return alert;
}

/**
 * Recorre todas las alertas y elimina las vencidas, notificando por cada una.
 */
function sweepExpired(onExpire) {
  const now = Date.now();
  for (const [slug, room] of alertsBySlug) {
    for (const [key, alert] of room) {
      if (alert.expiresAt <= now) {
        room.delete(key);
        onExpire(slug, alert);
      }
    }
  }
}

module.exports = { listAlerts, reportAlert, sweepExpired };
