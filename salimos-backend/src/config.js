require('dotenv').config();

const apiToken = process.env.FOURVENUES_API_TOKEN;

if (!apiToken) {
  throw new Error(
    'Falta la variable de entorno FOURVENUES_API_TOKEN. Copia .env.example a .env y complétala.'
  );
}

module.exports = {
  port: process.env.PORT || 8082,
  fourvenues: {
    host: process.env.FOURVENUES_API_HOST || 'cli-api-service.fourvenues.com',
    token: apiToken,
  },
  // Opcional: sin ella /api/directions responde 500 pero el resto del backend funciona.
  ors: {
    apiKey: process.env.ORS_API_KEY || null,
  },
};
