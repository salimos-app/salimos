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

/**
 * Alertas activas en vivo de varias discotecas a la vez (p.ej. todas las que
 * tienen pin en el mapa), para el badge del pin sin necesidad de un hook por
 * discoteca. La lista de slugs debe ser estable entre renders (misma
 * cantidad y orden) o se pasa como un array memoizado.
 */
export function useAlertsForSlugs(slugs: string[]): Record<string, DiscotecaAlert[]> {
  const [alertsBySlug, setAlertsBySlug] = useState<Record<string, DiscotecaAlert[]>>({});
  const key = slugs.join(',');

  useEffect(() => {
    const unsubscribes = slugs.map((slug) =>
      subscribeToAlerts(slug, (alerts) => {
        setAlertsBySlug((prev) => ({ ...prev, [slug]: alerts }));
      })
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return alertsBySlug;
}
