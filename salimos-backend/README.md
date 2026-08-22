# Salimos Backend

Backend Node/Express que actúa de proxy hacia la API de Fourvenues, para que la
app móvil no tenga que guardar el token de autenticación en el bundle.

## Arrancar en local

```bash
cd salimos-backend
npm install
cp .env.example .env   # y completa FOURVENUES_API_TOKEN
npm run dev
```

El servicio escucha por defecto en el puerto `8082` y expone:

- `GET /api/health`
- `GET /api/microsites/:slug/metadata`

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `PORT` | Puerto HTTP | `8082` |
| `FOURVENUES_API_HOST` | Host de la API de Fourvenues | `cli-api-service.fourvenues.com` |
| `FOURVENUES_API_TOKEN` | Token bearer de Fourvenues (requerido) | — |

## Notas

- Este backend no debe lanzarse desde la app Expo; es un servicio aparte.
- La app móvil debe apuntar a la URL pública del backend desplegado (ver `src/config/api.ts` en la raíz del proyecto).
