# Guía de Despliegue - NightSpot App

## Construye el APK
¡Para compilar tu propio APK de NightSpot, haz clic aquí! → **[CREAR MI APK](https://expo.dev/accounts/_/projects/nightspot/builds)**

---

## Opción 1: Generar APK con EAS Build (Recomendado)

### Paso 1: Login en Expo
```bash
npx eas login
```

### Paso 2: Configurar el proyecto
```bash
npx eas init
```

### Paso 3: Generar el APK
```bash
npx eas build --platform android --profile preview
```

> ⚠️ EAS Build requiere y tiene una cuenta gratuita de Expo. La build se ejecuta en la nube.

### Alternativa: APK local (sin EAS)
```bash
# Requiere Android Studio y SDK de Android instalado
npx expo run:android --variant release
# El APK se genera en:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 2. Desplegar el Proxy Server (para acceso externo)

### Opción A: Render.com (Gratis)
1. Ve a https://render.com y crea una cuenta
2. Sube este proyecto a GitHub
3. En Render, crea un "New Web Service"
4. Conecta tu repo de GitHub
5. Configura:

| Campo | Valor |
|-------|-------|
| Name | `salimos` |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `node proxy-server.js` |
| Auto-Deploy | Sí |

6. Después del despliegue, obtendrás una URL pública como:
   `https://salimos.onrender.com`

### Opción B: Railway.app (Gratis)
1. Ve a `railway.app`
2. New Project → Deploy from Button
3. Selecciona tu repo de GitHub
4. Railway detecta automáticamente Node y despliega

### Opción C: Vercel (Servidorless)
```json
// vercel.json
{
  "version": 2,
  "builds": [
    { "src": "proxy-server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "proxy-server.js" }
  ]
}
```

---

## 3. Actualizar la URL de producción

Después de desplegar el proxy, actualiza `src/config/api.ts`:

```typescript
export const API_CONFIG = {
  PRODUCTION_API_URL: 'https://salimos.onrender.com',
  // ...resto igual
};
```

---

## 4. Compartir la App

### APK instalable directo:
1. Genera el APK con EAS Build
2. Sube el APK a Google Drive o cualquier hosting
3. Comparte el enlace de descarga
4. El usuario debe permitir "Instalar apps descargadas de la tienda" en Android

### Publicar en Google Play Store (Opcional):
1. Crear cuenta de Google Play Developer ($25)
2. Navega a `https://play.google.com/console`
3. Crear nueva aplicación
4. Subir el APK/AAB generado
5. Completar ficha de la app
6. Publicar

### Publicación Web (sin instalar):
```bash
npx expo start --web
# Compartir el proyecto con "npx expo export --platform web"
```

---

## Flujo Completo de Despliegue

```
┌────────────────────────────┐
│ 1. Desplegar Proxy Server │
│    (Render.com)           │
└─────────┬──────────────────┘
          ↓
┌────────────────────────────┐
│ 2. Actualizar api.ts       │
│    PRODUCTION_API_URL      │
└─────────┬──────────────────┘
          ↓
┌────────────────────────────┐
│ 3. Generar APK            │
│    eas build --platform   │
└─────────┬──────────────────┘
          ↓
┌────────────────────────────┐
│ 4. Distribir APK          │
│    WhatsApp / Drive / Play │
└────────────────────────────┘
```

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| EAS Build falla | `npx eas build:configure` y reintenta |
| App no conecta al API | Ver más la URL en `src/config/api.ts` |
| CORS error | Asegúrate que proxy-server.js incluya CORS headers |
| APK no instala | Permite "instalar de fuentes desconocidas" |
| Proxy no responde | Verifica que el log muestre el puerto correcto |