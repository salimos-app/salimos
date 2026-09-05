/**
 * Caché en memoria con TTL, factorizada del patrón que ya usaba
 * routes/microsites.js para las respuestas de Fourvenues. Cada router crea
 * la suya con `createCache(ttlMs)` para no compartir claves entre dominios
 * distintos (metadata de Fourvenues vs. catálogos propios).
 */
function createCache(ttlMs) {
  const store = new Map();

  function read(key) {
    const hit = store.get(key);
    if (!hit) return null;
    if (Date.now() - hit.at > ttlMs) {
      store.delete(key);
      return null;
    }
    return hit.value;
  }

  function write(key, value) {
    store.set(key, { at: Date.now(), value });
  }

  return { read, write };
}

module.exports = { createCache };
