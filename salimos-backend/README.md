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
- `GET /api/directions/:profile?start=lon,lat&end=lon,lat` — rutas (ver más abajo)
- `WS /ws` — alertas en vivo de discotecas (ver más abajo)

## Alertas en vivo (WebSocket)

Sistema tipo Waze: los usuarios reportan cosas como "mucha cola" o "sitio
vacío" en una discoteca y el resto de usuarios que tienen esa discoteca
abierta lo ven al instante. Todo vive en memoria (sin base de datos) en
`src/alerts/`:

- `alertTypes.js` — catálogo de tipos de alerta. **Para añadir un tipo nuevo
  solo hay que agregar una entrada a este array**; el store y el WebSocket
  son genéricos y no conocen los tipos de antemano.
- `store.js` — guarda las alertas activas por discoteca (slug) con
  deduplicación (reportar el mismo tipo lo refresca y suma un contador) y
  expiración (`ttlMinutes` por tipo).
- `socket.js` — servidor WebSocket (`ws`) montado en `/ws` sobre el mismo
  puerto HTTP. Cada cliente solo recibe alertas de las discotecas a las que
  se suscribe explícitamente.

Protocolo, mensajes JSON sobre el socket:

```
Cliente -> Servidor
  { type: 'subscribe', slug }                  suscribirse a una discoteca
  { type: 'unsubscribe' }                       darse de baja de la actual
  { type: 'report', slug, alertType, value? }    reportar una alerta

Servidor -> Cliente
  { type: 'catalog', alertTypes }               catálogo, al conectar
  { type: 'alerts:sync', slug, alerts }          estado completo al suscribirse
  { type: 'alerts:update', slug, alert }         alerta nueva o refrescada
  { type: 'alerts:expired', slug, alertId }      una alerta dejó de estar activa
  { type: 'error', message }
```

## Rutas (OpenRouteService)

`GET /api/directions/:profile?start=lon,lat&end=lon,lat` es un proxy hacia la
[Directions API de OpenRouteService](https://openrouteservice.org/dev/#/api-docs/v2/directions/{profile}/get)
(igual que con Fourvenues, la API key se queda en el backend). Desde abril de
2026 el proxy apunta a `api.heigit.org/openrouteservice` (el host
`api.openrouteservice.org` está deprecado y con la cuota recortada). Devuelve el
GeoJSON tal cual lo manda ORS: `features[0].geometry.coordinates` trae la
polyline en formato `[longitud, latitud]` y `features[0].properties.summary`
trae `distance` (metros) y `duration` (segundos).

`:profile` acepta `foot-walking`, `driving-car` o `cycling-regular`.

Consigue una API key gratis en https://openrouteservice.org/dev/#/signup
(el tier gratuito da 2000 peticiones/día, de sobra para esto) y ponla en
`ORS_API_KEY`. Sin ella, `/api/directions` responde `500` pero el resto del
backend (microsites, alertas) sigue funcionando con normalidad.

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `PORT` | Puerto HTTP | `8082` |
| `FOURVENUES_API_HOST` | Host de la API de Fourvenues | `cli-api-service.fourvenues.com` |
| `FOURVENUES_API_TOKEN` | Token bearer de Fourvenues (requerido) | — |
| `ORS_API_KEY` | API key de OpenRouteService (opcional, solo para `/api/directions`) | — |

## Notas

- Este backend no debe lanzarse desde la app Expo; es un servicio aparte.
- La app móvil debe apuntar a la URL pública del backend desplegado (ver `src/config/api.ts` en la raíz del proyecto).
