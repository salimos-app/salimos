import { Platform, AppState } from 'react-native';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import { getApiBaseUrl } from '../config/api';

/**
 * Registro anónimo + telemetría de uso.
 *
 * No hay cuentas ni login: la primera vez que arranca la app se genera un
 * UUID ("installId") y se guarda en el dispositivo (SecureStore en móvil,
 * localStorage en web). Ese id identifica la instalación en el backend
 * (`POST /api/usuarios`) junto con los metadatos de la descarga, y etiqueta
 * cada evento de telemetría (`POST /api/telemetria`).
 *
 * Los eventos se encolan en memoria y se mandan en lotes: al acumular
 * `LOTE_MAXIMO`, cada `FLUSH_MS`, o cuando la app pasa a segundo plano.
 */

const INSTALL_ID_KEY = 'salimos.installId';
const LOTE_MAXIMO = 20;
const FLUSH_MS = 15_000;
const COLA_TOPE = 200;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface EventoTelemetria {
  nombre: string;
  props?: Record<string, unknown>;
  ts: number;
}

let installIdCache: string | null = null;
let installIdPromesa: Promise<string> | null = null;
let cola: EventoTelemetria[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let iniciado = false;

async function leerGuardado(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function escribirGuardado(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Sin almacenamiento: el id vivirá solo en memoria esta sesión.
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // idem
  }
}

/** UUID anónimo por instalación; se crea una vez y se persiste en el dispositivo. */
export function getInstallId(): Promise<string> {
  if (installIdCache) return Promise.resolve(installIdCache);
  if (installIdPromesa) return installIdPromesa;

  installIdPromesa = (async () => {
    const guardado = await leerGuardado(INSTALL_ID_KEY);
    if (guardado && UUID_PATTERN.test(guardado)) {
      installIdCache = guardado;
      return guardado;
    }
    const nuevo = Crypto.randomUUID();
    await escribirGuardado(INSTALL_ID_KEY, nuevo);
    installIdCache = nuevo;
    return nuevo;
  })();

  return installIdPromesa;
}

async function postJson(path: string, body: unknown): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

/** Metadatos de la descarga/instalación (best-effort: cada campo cae a `null` si falla). */
async function recogerMetadatos() {
  const [installTime, installReferrer, idForVendor] = await Promise.all([
    Application.getInstallationTimeAsync()
      .then((fecha) => fecha?.getTime() ?? null)
      .catch(() => null),
    Platform.OS === 'android'
      ? Application.getInstallReferrerAsync().catch(() => null)
      : Promise.resolve(null),
    Platform.OS === 'ios'
      ? Application.getIosIdForVendorAsync().catch(() => null)
      : Promise.resolve(null),
  ]);

  let locale: string | null = null;
  let timezone: string | null = null;
  try {
    locale = Localization.getLocales()[0]?.languageTag ?? null;
    timezone = Localization.getCalendars()[0]?.timeZone ?? null;
  } catch {
    // expo-localization no disponible en este entorno.
  }

  return {
    plataforma: Platform.OS,
    osVersion: String(Platform.Version),
    deviceModel: Device.modelName ?? null,
    appVersion: Application.nativeApplicationVersion ?? null,
    buildVersion: Application.nativeBuildVersion ?? null,
    locale,
    timezone,
    installTime,
    installReferrer,
    idForVendor,
  };
}

/** Alta / heartbeat de esta instalación en el backend. */
export async function registrarInstalacion(): Promise<void> {
  try {
    const installId = await getInstallId();
    const metadatos = await recogerMetadatos();
    await postJson('/api/usuarios', { installId, ...metadatos });
  } catch (error) {
    console.warn('No se pudo registrar la instalación:', error);
  }
}

/** Encola un evento de telemetría. No lanza — la telemetría nunca debe romper la app. */
export function track(nombre: string, props?: Record<string, unknown>): void {
  cola.push({ nombre, props, ts: Date.now() });

  if (cola.length >= LOTE_MAXIMO) {
    void flush();
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => void flush(), FLUSH_MS);
  }
}

/** Envía lo que haya en cola. Si falla, devuelve el lote a la cola (con tope) para reintentar. */
export async function flush(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (cola.length === 0) return;

  const lote = cola.slice(0, 50);
  cola = cola.slice(lote.length);

  try {
    const installId = await getInstallId();
    await postJson('/api/telemetria', { installId, eventos: lote });
  } catch (error) {
    console.warn('No se pudo enviar telemetría:', error);
    cola = [...lote, ...cola].slice(0, COLA_TOPE);
  }
}

/**
 * Arranca el registro anónimo y la telemetría. Idempotente: llamar una vez
 * al montar la app.
 */
export function initTelemetria(): void {
  if (iniciado) return;
  iniciado = true;

  void registrarInstalacion();

  AppState.addEventListener('change', (estado) => {
    if (estado === 'background' || estado === 'inactive') {
      void flush();
    }
  });

  track('app_abierta');
}
