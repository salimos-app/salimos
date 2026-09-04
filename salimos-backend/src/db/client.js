const { createClient } = require('@libsql/client');

let client = null;

/**
 * Cliente de la base de datos (Turso/libSQL). Se crea de forma perezosa —a
 * diferencia del token de Fourvenues, no hace falta que exista para que el
 * resto del backend (proxy en vivo) siga funcionando— así que solo revienta
 * si algo que de verdad necesita la BD (el barrido, o una ruta que lea de
 * caché) se llama sin las variables de entorno puestas.
 */
function getDb() {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error(
      'Faltan TURSO_DATABASE_URL / TURSO_AUTH_TOKEN. Crea una base gratis en https://turso.tech y copia sus credenciales al .env.'
    );
  }

  client = createClient({ url, authToken });
  return client;
}

module.exports = { getDb };
