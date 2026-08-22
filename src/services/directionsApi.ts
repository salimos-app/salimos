import { getApiBaseUrl } from '../config/api';

export type TravelProfile = 'foot-walking' | 'driving-car' | 'cycling-regular';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  /** Puntos [latitud, longitud] listos para pintar como polyline en Leaflet. */
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
}

/**
 * Pide a nuestro backend (proxy de OpenRouteService) la ruta entre dos
 * puntos para un modo de viaje dado. La API key de ORS nunca sale del
 * backend; el cliente solo necesita coordenadas.
 */
export async function fetchRoute(profile: TravelProfile, start: LatLng, end: LatLng): Promise<RouteResult> {
  const startParam = `${start.longitude},${start.latitude}`;
  const endParam = `${end.longitude},${end.latitude}`;
  const url = `${getApiBaseUrl()}/api/directions/${profile}?start=${startParam}&end=${endParam}`;

  const response = await fetch(url);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? `HTTP ${response.status}`);
  }

  const feature = payload?.features?.[0];
  if (!feature) {
    throw new Error('No se encontró una ruta entre esos puntos.');
  }

  const coordinates: [number, number][] = feature.geometry.coordinates.map(
    ([longitude, latitude]: [number, number]) => [latitude, longitude]
  );
  const summary = feature.properties?.summary ?? { distance: 0, duration: 0 };

  return {
    coordinates,
    distanceMeters: summary.distance,
    durationSeconds: summary.duration,
  };
}
