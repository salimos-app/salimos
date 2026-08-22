import { getWsUrl } from '../config/api';
import { AlertType, DiscotecaAlert } from '../types/alert';

/**
 * Cliente WebSocket compartido para las alertas en vivo de las discotecas
 * (estilo Waze: mucha cola, sitio vacío, etc). Una única conexión para toda
 * la app, con reconexión automática y suscripción por discoteca (slug).
 *
 * El catálogo de tipos de alerta lo define el backend
 * (salimos-backend/src/alerts/alertTypes.js), así que añadir un tipo nuevo
 * ahí lo hace aparecer aquí sin tocar este archivo.
 */

type AlertsListener = (alerts: DiscotecaAlert[]) => void;
type CatalogListener = (catalog: AlertType[]) => void;

let socket: WebSocket | null = null;
let catalog: AlertType[] = [];
const catalogListeners = new Set<CatalogListener>();

const alertsBySlug = new Map<string, Map<string, DiscotecaAlert>>();
const listenersBySlug = new Map<string, Set<AlertsListener>>();
const subscribedSlugs = new Set<string>();

let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelayMs = 1000;
const MAX_RECONNECT_DELAY_MS = 15000;

function notifySlug(slug: string): void {
  const alerts = Array.from(alertsBySlug.get(slug)?.values() ?? []);
  listenersBySlug.get(slug)?.forEach((listener) => listener(alerts));
}

function send(message: Record<string, unknown>): void {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function handleMessage(raw: string): void {
  let message: any;
  try {
    message = JSON.parse(raw);
  } catch (error) {
    console.warn('Mensaje de alertas inválido:', error);
    return;
  }

  switch (message?.type) {
    case 'catalog': {
      catalog = message.alertTypes ?? [];
      catalogListeners.forEach((listener) => listener(catalog));
      break;
    }
    case 'alerts:sync': {
      const room = new Map<string, DiscotecaAlert>();
      (message.alerts ?? []).forEach((alert: DiscotecaAlert) =>
        room.set(alert.id, alert),
      );
      alertsBySlug.set(message.slug, room);
      notifySlug(message.slug);
      break;
    }
    case 'alerts:update': {
      const room =
        alertsBySlug.get(message.slug) ?? new Map<string, DiscotecaAlert>();
      room.set(message.alert.id, message.alert);
      alertsBySlug.set(message.slug, room);
      notifySlug(message.slug);
      break;
    }
    case 'alerts:expired': {
      const room = alertsBySlug.get(message.slug);
      if (room?.delete(message.alertId)) {
        notifySlug(message.slug);
      }
      break;
    }
    default:
      break;
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectDelayMs = Math.min(reconnectDelayMs * 2, MAX_RECONNECT_DELAY_MS);
    ensureSocket();
  }, reconnectDelayMs);
}

function ensureSocket(): void {
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  const ws = new WebSocket(getWsUrl());
  socket = ws;

  ws.onopen = () => {
    reconnectDelayMs = 1000;
    subscribedSlugs.forEach((slug) => send({ type: 'subscribe', slug }));
  };

  ws.onmessage = (event) => handleMessage(event.data);

  ws.onclose = () => scheduleReconnect();
  ws.onerror = () => ws.close();
}

/** Se suscribe al catálogo de tipos de alerta disponibles. */
export function subscribeToCatalog(listener: CatalogListener): () => void {
  catalogListeners.add(listener);
  if (catalog.length) listener(catalog);
  ensureSocket();
  return () => catalogListeners.delete(listener);
}

/** Se suscribe a las alertas activas de una discoteca. */
export function subscribeToAlerts(
  slug: string,
  listener: AlertsListener,
): () => void {
  if (!listenersBySlug.has(slug)) {
    listenersBySlug.set(slug, new Set());
  }
  const listeners = listenersBySlug.get(slug)!;
  const isFirstListener = listeners.size === 0;
  listeners.add(listener);
  subscribedSlugs.add(slug);

  ensureSocket();
  if (isFirstListener) send({ type: 'subscribe', slug });

  listener(Array.from(alertsBySlug.get(slug)?.values() ?? []));

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      listenersBySlug.delete(slug);
      subscribedSlugs.delete(slug);
      send({ type: 'unsubscribe', slug });
    }
  };
}

/** Reporta una alerta para una discoteca (value obligatorio si el tipo lo requiere). */
export function reportAlert(
  slug: string,
  alertType: string,
  value?: number,
): void {
  send({ type: 'report', slug, alertType, value });
}
