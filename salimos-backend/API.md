# API de Fourvenues — lo que sabemos

Documentación de ingeniería inversa de `https://cli-api-service.fourvenues.com`,
la API que consume este backend (ver `FOURVENUES_API_HOST` en `.env`). No es
una API pública documentada por Fourvenues — todo lo de aquí se ha deducido
probando peticiones reales y capturando tráfico de `site.fourvenues.com`
(la web pública de compra de entradas). Si Fourvenues cambia algo sin avisar,
esto puede dejar de ser exacto.

## Autenticación

Todas las rutas piden cabecera `Authorization: Bearer <token>`. El token es
un JWT sin expiración visible con payload `{"app":"cli-api-service","iat":...}`
— no identifica a un usuario ni a una organización concreta, parece un token
de aplicación genérico. Aun así **nunca debe ir en el bundle de la app ni en
el repo**: vive solo en `FOURVENUES_API_TOKEN` (backend, `.env`, no versionado).

Sin token: `401 {"message":"Unauthorized"}` en cualquier ruta.

## Endpoints confirmados

### `GET /api/microsites/:slug/metadata`

Feed tipo schema.org (`itemListElement`) de los eventos de un local. Es el
más antiguo/básico: **no trae imágenes ni precios**, solo nombre, fechas y
dirección. `:slug` tiene que ser exacto (ver [Slugs](#slugs-cómo-funcionan)).

- 200 con datos si el slug existe y tiene eventos.
- 404 `{"message":"Organization not found","cause":"entity_not_found"}` si el
  slug no corresponde a ninguna organización real.

Lo usa nuestro backend en [`GET /api/microsites/:slug/metadata`](#rutas-que-expone-este-backend)
tal cual, sin transformar.

### `GET /api/events?slug=X&startDate=&endDate=&page=`

Lista de eventos de una organización, paginada. A diferencia de `/metadata`
**sí trae imagen** (`image`), datos del organizador (`organizer`, con CIF y
dirección fiscal — no confundir con la ubicación real del evento, que va en
`location.addressComplete`), y el `id` interno del evento (necesario para
`/tickets-types`, ver más abajo) y su `code` corto (el que aparece en las
URLs públicas de `site.fourvenues.com`).

Parámetros:
- `slug` (requerido) — exacto, sensible a mayúsculas. Sin él: `409 {"message":"Slug is required","cause":"invalid_field"}`.
- `startDate` / `endDate` — timestamps Unix en **segundos**.
- `page` — paginación; la respuesta trae `metadata.totalPages` para saber cuándo parar.

Respuesta:
```json
{
  "data": [ { "id": "...", "code": "APG3", "slug": "viernes-latinos--...", "name": "...",
              "organization": { "slug": "banana", "name": "BANANA", "image": "...", "cover": "..." },
              "organizer": { "name": "...", "cif": "...", "city": "...", "province": "..." },
              "dates": { "date": 1788472800, "start": 1788555600, "end": 1788580800, "canceled": null },
              "location": { "addressComplete": "..." },
              "image": "...", "artists": [], "isUntilLate": true } ],
  "metadata": { "page": 1, "perPage": 50, "total": 12, "totalPages": 1, "order": { "type": "desc", "by": "startDate" } }
}
```

Nuestro backend agrega todas las páginas y las cachea 10 min bajo
`GET /api/microsites/:slug/events` (ver [microsites.js](src/routes/microsites.js)).

### `GET /api/events/:code`

Detalle de **un solo evento** por su `code` corto (el de la URL pública:
`.../events/<slug-evento>-<CODE>`). Más completo que el de arriba:
coordenadas exactas (`location.coordinates`), dirección estructurada
(`location.address`, `location.municipality`, `location.postalCode`...),
`services` (qué ofrece: `"listas"`, `"entradas"`, `"reservados"`), edad
mínima (`age`, aunque esta también viene ya en `/api/events` de arriba —
no hace falta pedir el detalle solo por eso), un campo `perch` sin
documentar (visto siempre `"casual"` en las discotecas de este proyecto;
por el valor, parece ser el código de vestimenta, pero no está confirmado
por Fourvenues) y `bookingFlowStart`, que indica el siguiente paso del
flujo de compra (visto: `"zones"`).

**No trae precios.** Para eso hace falta el `id` interno (no el `code`) y el
endpoint de abajo.

Lo expone nuestro backend cacheado 10 min en
`GET /api/microsites/:slug/events/:code/detail` (ver [microsites.js](src/routes/microsites.js)).

### `GET /api/events/:eventId/tickets-types?slug=X`

Tipos de entrada de un evento, con precios reales. Necesita el **`id`**
interno del evento (el campo `id` de `/api/events`, no el `code` de 4
caracteres). Capturado del tráfico real de `site.fourvenues.com` al abrir el
flujo de compra.

```json
{
  "data": [
    {
      "id": "qbc5p5eibvcn47p70bi8jb03wcb7kfpu",
      "name": "ENTRADAS CON CONSUMICIÓN",
      "type": "limitada",
      "isSoldOut": true,
      "nominative": true,
      "availableOptionId": "1783442730185",
      "options": [
        { "id": "1783442697611", "name": "Primer Tramo",  "price": 10, "ggddType": "porcentaje", "ggddAmount": 10, "isSoldOut": true },
        { "id": "1783442711483", "name": "Segundo Tramo", "price": 12, "ggddType": "porcentaje", "ggddAmount": 10, "isSoldOut": true },
        { "id": "1783442730185", "name": "Tercer Tramo",  "price": 15, "ggddType": "porcentaje", "ggddAmount": 10, "isSoldOut": true }
      ],
      "fields": { "name": {...}, "email": {...}, "phone": {...}, "birthDate": {...}, "gender": {...} }
    }
  ]
}
```

Notas:
- `options` son los tramos de precio (venta anticipada escalonada: cuanto
  más tarde compras, más caro). `availableOptionId` marca cuál está activo
  ahora mismo.
- `ggddType`/`ggddAmount` es el recargo de gestión que se suma al `price`
  base al pagar (en lo visto siempre `"porcentaje"`, 10%).
- `isSoldOut` existe tanto a nivel de tipo de entrada como de cada tramo —
  hay que comprobar los dos.
- `fields` describe el formulario de compra (qué pide Fourvenues al
  comprador), no son datos del evento en sí.

Lo expone nuestro backend cacheado 10 min en
`GET /api/microsites/:slug/events/:eventId/tickets-types` (añadido en esta
sesión, ver [microsites.js](src/routes/microsites.js)).

### `GET /api/tickets-types/:optionId/pricing?organizationId=&applicationId=&amount=&eventIdentifier=`

Capturado del tráfico real, pero **no integrado en el backend todavía**.
Recalcula el precio de un tramo concreto (`:optionId`, el `id` de un
`options[]` de arriba) para una cantidad de entradas (`amount`). Necesita
además `organizationId` (id de la organización) y `applicationId` (id fijo
de la app cliente, `Jjihluagf0008jhmmg5quynfoF0KLG1W` en las capturas — no
confirmado si es el mismo para todas las organizaciones o depende de la
integración/dominio desde el que se compra).

```json
{ "data": { "ids": ["1783442855822"], "prices": [10],
    "options": [ { "id": "1783442855822", "name": "Primer Tramo", "price": 10, "ggdd": { "type": "porcentaje", "amount": 10 } } ] } }
```

Para simplemente **mostrar** precios (que es lo que necesita la app), con
`/tickets-types` alcanza — este endpoint parece pensado para el momento
exacto de checkout, ya con cantidad elegida. No merece la pena cablearlo
hasta que haga falta comprar de verdad desde la app.

## Slugs: cómo funcionan

- Coincidencia **exacta** y **sensible a mayúsculas**. `Banana` ≠ `banana`.
- No hay coincidencia difusa: `kandhala` (sin el `1` final) da 404 aunque
  `kandhala1` sea un slug real.
- Slug inexistente → `404 {"message":"User not found","cause":"entity_not_found"}`
  en `/api/events`, o `404 {"message":"Organization not found",...}` en
  `/api/microsites/:slug/metadata` (mensajes de error distintos para el
  mismo tipo de fallo, según el endpoint).
- Sin slug → `409 {"message":"Slug is required","cause":"invalid_field"}`.

### Callejón sin salida: no hay búsqueda por ciudad

Investigado a fondo (ver historial de esta sesión) porque parecía prometedor
y **no lo es** — que quede documentado para no volver a perder tiempo en
ello:

Probando `slug=sevilla` en `/api/events` sale un `200` con ~90 eventos de
organizaciones de toda España (Alicante, Murcia, Madrid, Mallorca...), no
solo de Sevilla. Parecía un filtro geográfico. **No lo es.** Comprobado:

- `sevilla`, `madrid`, `granada`, `ibiza`, `marbella`, `bilbao` devuelven
  `200` en `/api/events` pero `404` en `/api/microsites/:slug/metadata` (no
  son organizaciones reales con ficha propia).
- `barcelona`, `malaga`, `cadiz`, `valencia`, `zaragoza`, y la ciudad real de
  este proyecto (`elpuertodesantamaria`) dan **404** — el mismo 404 que
  cualquier slug inventado.
- Los locales que aparecen dentro del feed de `sevilla`/`granada` están
  repartidos por toda España sin relación geográfica real con esos nombres
  (p. ej. el slug `marbella` es un local que existe **en Valencia**, y el
  slug `bilbao` es un local **en Italia**) — o sea que ni siquiera esos
  nombres de "ciudad" están ligados a la ciudad real.
- Conclusión: `sevilla`/`granada`/etc. son casualmente los slugs de cuentas
  o entidades internas de Fourvenues sin relación con geolocalización (ver
  hipótesis en el propio hilo de la sesión). **No sirve para listar
  discotecas de una zona.** La única forma fiable de tener una discoteca en
  la app sigue siendo curar su slug a mano y verificarlo con `/metadata`.

## Errores comunes

| Situación | Status | Body |
|---|---|---|
| Sin token | 401 | `{"message":"Unauthorized"}` |
| Slug no existe (`/api/events`) | 404 | `{"message":"User not found","cause":"entity_not_found"}` |
| Slug no existe (`/api/microsites/:slug/metadata`) | 404 | `{"message":"Organization not found","cause":"entity_not_found"}` |
| Falta `slug` en `/api/events` | 409 | `{"message":"Slug is required","cause":"invalid_field"}` |
| Ruta que no existe de verdad (framework) | 404 | `{"message":"Route GET:... not found","error":"Not Found","statusCode":404}` — distinto formato, así se distingue de un 404 "de negocio" |
| Rango de fechas sin eventos | 200 | `{"data":[],"metadata":null}` (o `metadata` con `total:0`) — no es error |

## Rutas que expone este backend

Proxy hacia lo de arriba, con el token siempre en el servidor y caché en
memoria de 10 min (`CACHE_TTL_MS` en [microsites.js](src/routes/microsites.js)):

| Ruta propia | Proxy hacia Fourvenues | Devuelve |
|---|---|---|
| `GET /api/microsites/:slug/metadata` | `GET /api/microsites/:slug/metadata` | Igual, sin tocar |
| `GET /api/microsites/:slug/events` | `GET /api/events?slug=X&startDate=hoy&endDate=+90d` (todas las páginas agregadas) | `{"data": [...]}` con imagen |
| `GET /api/microsites/:slug/events/:eventId/tickets-types` | `GET /api/events/:eventId/tickets-types?slug=X` | Igual, sin tocar |
| `GET /api/microsites/:slug/events/:code/detail` | `GET /api/events/:code` | Igual, sin tocar |
| `GET /api/discotecas/:slug/eventos-cache` | *(no pega a Fourvenues, lee de la BD)* | Snapshot semanal de eventos, ver abajo |

`:eventId` es el `id` que trae cada evento en `/api/microsites/:slug/events`
(campo `Evento.id` en la app), **no** el `code` corto de la URL pública.

## Registro anónimo y telemetría

Dos rutas de **escritura** (el resto del backend es proxy de solo lectura).
Usan las mismas credenciales de Turso que el snapshot; crean sus tablas solas
la primera vez (`ensureSchemaOnce`, no hace falta `npm run seed:data`).

### `POST /api/usuarios`

Alta o heartbeat de una instalación anónima. **Sin cuentas ni login.** La app
genera un UUID la primera vez que arranca, lo guarda en el dispositivo
(SecureStore / localStorage) y lo reenvía en cada arranque.

```json
{ "installId": "e2b1...-uuid", "plataforma": "android", "osVersion": "14",
  "deviceModel": "Pixel 7", "appVersion": "1.0.0", "buildVersion": "1",
  "locale": "es-ES", "timezone": "Europe/Madrid", "installTime": 1725000000000,
  "installReferrer": "utm_source=google-play&utm_medium=organic", "idForVendor": null }
```

- Solo `installId` (UUID) es obligatorio; el resto es best-effort.
- Idempotente: upsert por `installId` — refresca metadatos, mueve `ultima_vez`,
  suma `aperturas`. `install_time` / `install_referrer` / `id_for_vendor` no se
  pisan con `null` una vez guardados.
- `install_referrer` (solo Android) sale de `getInstallReferrerAsync()` de
  Play Store: es la única señal de "de dónde vino la descarga". Play Console /
  App Store Connect **no** dan datos de descarga por usuario.
- Respuesta: `204` sin cuerpo. `400` si el `installId` no es un UUID.

### `POST /api/telemetria`

Lote de eventos de uso. La app los encola y los manda en tandas (20 eventos,
cada 15 s, o al pasar a segundo plano).

```json
{ "installId": "e2b1...-uuid", "eventos": [
  { "nombre": "app_abierta", "ts": 1725000000000 },
  { "nombre": "discoteca_seleccionada", "props": { "slug": "banana" }, "ts": 1725000005000 } ] }
```

- Máx. 50 eventos por lote; `props` se serializa a JSON y se recorta a 2000 chars.
- Eventos sin `nombre` se descartan en silencio (no tumban el lote).
- `ocurrio_en` lo pone el cliente (`ts`), `recibido_en` el backend.
- Respuesta: `204`. `400` si `installId` no es UUID o `eventos` va vacío.

Consultar los datos: SQL directo contra Turso (`SELECT * FROM usuarios`,
`SELECT evento, COUNT(*) FROM telemetria GROUP BY evento`, etc.). No hay panel.

## Snapshot semanal (Turso) — `npm run sweep`

`GET /api/microsites/:slug/events` pega a Fourvenues en vivo cada vez (con
caché de solo 10 min). Para no depender de que Fourvenues responda rápido
en cada arranque de la app, hay un barrido aparte que trae los eventos de
todas las discotecas con slug real y los guarda en una base de datos
[Turso](https://turso.tech) (SQLite alojado, tier gratuito sin tarjeta:
5 GB, 500M lecturas/mes, 10M escrituras/mes — de sobra para esto).

- **Por qué no un `.sqlite` local:** el filesystem de Render (plan gratuito)
  es efímero — cualquier archivo escrito en disco desaparece en cada
  redeploy/reinicio/spin-down, y los servicios gratuitos ni siquiera pueden
  adjuntar un disco persistente. Turso vive fuera de Render, así que da
  igual cuántas veces se reinicie el backend.
- **Qué guarda:** solo lo estable — nombre, fechas, imagen, dirección,
  `code` (ver tabla `eventos` en [db/schema.js](src/db/schema.js)).
  **Nunca precios** — los tramos de entrada pasan de disponible a agotado
  en horas, no en días, así que se quedan fuera del snapshot y se piden en
  vivo (`/tickets-types`, con su propia caché corta).
- **Cómo corre:** `npm run sweep` (`src/jobs/sweepEventos.js`) — pensado
  para lanzarse como **cron aparte** (p. ej. un Render Cron Job semanal),
  no dentro del proceso del servidor: así un fallo del barrido no tira el
  proxy en vivo, y no depende de que el servidor esté despierto en ese
  momento exacto.
- **Si Fourvenues falla para una discoteca** esa discoteca se salta y se
  deja su snapshot de la semana anterior tal cual (mejor datos viejos que
  vaciar la tabla). Si tiene éxito, se borra su snapshot anterior y se
  inserta el nuevo en una sola transacción (`db.batch(...)`).
- **Variables de entorno:** `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`
  (crear base + token en [app.turso.tech](https://app.turso.tech), nunca
  en el repo — van en `.env` local / variables de entorno de Render, igual
  que `FOURVENUES_API_TOKEN`).
- **Se archiva sola si nadie la toca 10 días** (política del free tier de
  Turso): los datos no se borran, pero hay que "despertarla" vía su API
  antes de poder consultarla. El propio barrido semanal (escribe cada 7
  días) evita que esto pase mientras el cron siga corriendo — si el cron
  se cae y además nadie usa la app en 10 días, sí se archivaría.

## Notas

- Rate limiter propio en `/api` (300 req / 15 min por IP) además del que
  tenga Fourvenues por su cuenta — motivo por el que existe la caché.
- `startDate`/`endDate` siempre en segundos, no milisegundos.
- `updatedAt` en los eventos sí va en milisegundos (inconsistencia de la
  propia API de Fourvenues, no nuestra).
