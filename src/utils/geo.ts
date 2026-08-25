export interface LatLngLike {
  latitude: number;
  longitude: number;
}

/** Distancia en línea recta entre dos coordenadas, en metros (fórmula de Haversine). */
export function distanceMeters(a: LatLngLike, b: LatLngLike): number {
  const R = 6371000;
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLng = (b.longitude - a.longitude) * rad;
  const lat1 = a.latitude * rad;
  const lat2 = b.latitude * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Ordena una lista por cercanía a un punto de referencia (el primero es el
 * más óptimo). Sin punto de referencia, devuelve la lista tal cual.
 */
export function ordenarPorCercania<T>(
  items: T[],
  referencia: LatLngLike | null,
  coordenadasDe: (item: T) => LatLngLike,
): T[] {
  if (!referencia) return items;
  return [...items].sort(
    (a, b) => distanceMeters(referencia, coordenadasDe(a)) - distanceMeters(referencia, coordenadasDe(b)),
  );
}
