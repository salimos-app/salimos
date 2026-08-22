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
  let message: unknown;
  try {
    message = JSON.parse(raw);
  } catch (error) {
    console.warn('Mensaje de alertas inválido:', error);
    return;
  }

  if (typeof message !== 'object' || message === null) {
    return;
  }

  const msg = message as Record<string, unknown>;
  switch (msg?.type) {
    case 'catalog': {
      catalog = (msg.alertTypes ?? []) as AlertType[];
      catalogListeners.forEach((listener) => listener(catalog));
      break;
    }
    case 'alerts:sync': {
      const room = new Map<string, DiscotecaAlert>();
      ((msg.alerts ?? []) as DiscotecaAlert[]).forEach((alert) =>
        room.set(alert.id, alert),
      );
      alertsBySlug.set(msg.slug as string, room);
      notifySlug(msg.slug as string);
      break;
    }
    case 'alerts:update': {
      const room =
        alertsBySlug.get(msg.slug as string) ??
        new Map<string, DiscotecaAlert>();
      room.set((msg.alert as DiscotecaAlert).id, msg.alert as DiscotecaAlert);
      alertsBySlug.set(msg.slug as string, room);
      notifySlug(msg.slug as string);
      break;
    }
    case 'alerts:expired': {
      const room = alertsBySlug.get(msg.slug as string);
      if (room?.delete(msg.alertId as string)) {
        notifySlug(msg.slug as string);
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
