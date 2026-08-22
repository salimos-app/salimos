# Guía de Despliegue - Salimos

## Construye el APK

¡Para compilar tu propio APK de Salimos, haz clic aquí! → **[CREAR MI APK](https://expo.dev/accounts/_/projects/salimos/builds)**

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

> ⚠️ EAS Build requiere una cuenta gratuita de Expo. La build se ejecuta en la nube.

### Alternativa: APK local (sin EAS)
```bash
# Requiere Android Studio y SDK de Android instalado
npx expo run:android --variant release
# El APK se genera en:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 2. Desplegar el backend (para acceso externo)

El backend vive en [`salimos-backend/`](salimos-backend/) y es un servicio Node/Express
independiente de la app Expo (ver su [README](salimos-backend/README.md)).

### Opción A: Render.com (Gratis)
1. Ve a https://render.com y crea una cuenta
2. Sube este proyecto a GitHub
3. En Render, crea un "New Web Service" a partir del repo (usa el `render.yaml` incluido,
   que ya apunta a `salimos-backend/` como `rootDir`)
4. Define la variable de entorno `FOURVENUES_API_TOKEN` en el panel de Render (no está
   en el repo por seguridad)
5. Después del despliegue, obtendrás una URL pública como:
   `https://salimos.onrender.com`

### Opción B: Railway.app (Gratis)
1. Ve a `railway.app`
2. New Project → Deploy from GitHub
3. Selecciona tu repo, configura `salimos-backend` como directorio raíz del servicio
4. Define `FOURVENUES_API_TOKEN` en las variables de entorno

---

## 3. Actualizar la URL de producción

Después de desplegar el backend, actualiza `src/config/api.ts`:

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
│ 1. Desplegar backend Node  │
│    (Render.com)            │
└─────────┬──────────────────┘
          ↓
┌────────────────────────────┐
│ 2. Actualizar api.ts        │
│    PRODUCTION_API_URL       │
└─────────┬──────────────────┘
          ↓
┌────────────────────────────┐
│ 3. Generar APK              │
│    eas build --platform     │
└─────────┬──────────────────┘
          ↓
┌────────────────────────────┐
│ 4. Distribuir APK           │
│    WhatsApp / Drive / Play  │
└────────────────────────────┘
```

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| EAS Build falla | `npx eas build:configure` y reintenta |
| App no conecta al API | Revisa la URL en `src/config/api.ts` |
| CORS error | Asegúrate que `salimos-backend/src/server.js` incluya los headers CORS |
| APK no instala | Permite "instalar de fuentes desconocidas" |
| Backend no responde | Verifica que `FOURVENUES_API_TOKEN` esté configurado y el log muestre el puerto correcto |
