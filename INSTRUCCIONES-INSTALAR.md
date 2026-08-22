# 📲 Cómo Instalar Salimos sin que Play Protect lo bloquee

## ¿Por qué salta Play Protect?

Play Protect es el sistema de seguridad de Google que avisa al instalar apps que **no provienen de Google Play Store**. Como Salimos se distribuye como APK directo, Google muestra un aviso. **La app es 100% segura** — es solo una app de discotecas.

---

## ✅ Opción 1: Instalación normal (recomendada)

### En el teléfono Android:

1. **Descarga el APK** y ábrelo (o ábrelo desde WhatsApp/Drive)

2. Cuando aparezca **"Play Protect"** con el aviso, pulsa:

   > **"Más detalles"** → **"Instalar de todos modos"**

3. Si aparece otro aviso sobre **"instalar apps desconocidas"**:
   - Pulsa **"Ajustes"**
   - Activa **"Permitir desde esta fuente"**
   - Vuelve atrás y pulsa **"Instalar"**

4. Ya está instalada ✅

---

## ⚙️ Opción 2: Configurar el teléfono ANTES de instalar

### Android 13/14/15 (para que sea más fácil):
```
Ajustes → Seguridad → Apps desconocidas
   → WhatsApp (o el navegador que uses) → Permitir instalar apps desconocidas
```

### Otra ruta:
```
Ajustes → Seguridad y privacidad → Apps con acceso especial
   → Instalar apps desconocidas → Permitir la fuente
```

---

## 🔴 Opción 3: Desactivar Play Protect temporalmente (NO recomendado)

Solo si prefieres no ver el aviso:
```
Google Play Store → Tu perfil (icono) → Play Protect
   → Ajustes → Desactivar "Analizar apps con Play Protect"
```

> ⚠️ Desactivarlo reduce la seguridad de tu teléfono. Mejor usa Opción 1 o 2.

---

## 📋 Preguntas frecuentes

| Pregunta | Respuesta |
|----------|-----------|
| **¿Es segura la app?** | Sí, es una app de información de discotecas, no pide permisos sensibles |
| **¿Por qué Google avisa?** | Porque no está publicada en Play Store aún |
| **¿Cómo evitar el aviso para siempre?** | Publicar en Google Play Store ($25 única vez) |
| **¿Funciona en cualquier Android?** | Sí, Android 7.0 o superior |

---

## 📤 Cómo compartir a otras personas

1. Envía el archivo `.apk` por WhatsApp, Telegram o Google Drive
2. Envía también este documento o estas instrucciones:
   - Descargar el APK
   - Pulsar "Más detalles" → "Instalar de todos modos" cuando salte Play Protect
   - Aceptar "Permitir desde esta fuente"
   - Listo ✅

---

## 🛡️ Verificación de seguridad (opcional)

Para verificar que el APK es seguro:
```bash
# En tu PC, con el SDK de Android instalado:
apksigner verify --print-certs Salimos.apk
```

La app está firmada con un keystore generado por EAS Build, lo que garantiza que:
- ✅ No ha sido modificada desde la compilación
- ✅ Pertenece al desarrollador `@bartusito`
- ✅ No contiene malware