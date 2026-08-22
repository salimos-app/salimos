import { useEffect, useState } from 'react';
import { subscribeToAlerts, subscribeToCatalog, reportAlert } from '../services/alertsSocket';
import { AlertType, DiscotecaAlert } from '../types/alert';

/** Catálogo de tipos de alerta disponibles (lo define el backend). */
export function useAlertCatalog(): AlertType[] {
  const [catalog, setCatalog] = useState<AlertType[]>([]);

  useEffect(() => subscribeToCatalog(setCatalog), []);

  return catalog;
}

/** Alertas activas en vivo de una discoteca, más una función para reportar nuevas. */
export function useDiscotecaAlerts(slug: string) {
  const [alerts, setAlerts] = useState<DiscotecaAlert[]>([]);

  useEffect(() => subscribeToAlerts(slug, setAlerts), [slug]);

  return {
    alerts,
    report: (alertType: string, value?: number) => reportAlert(slug, alertType, value),
  };
}
