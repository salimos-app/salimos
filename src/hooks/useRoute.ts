import { useState } from 'react';
import {
  fetchRoute,
  LatLng,
  RouteResult,
  TravelProfile,
} from '../services/directionsApi';
import { getCurrentLocation } from '../services/location';

/**
 * Calcula una ruta desde la ubicación actual del usuario hasta un destino,
 * usando el proxy de OpenRouteService del backend. Pide permiso de
 * ubicación en el momento (no antes), como hace Waze/Google Maps.
 */
export function useRoute() {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRoute = async (
    profile: TravelProfile,
    destination: LatLng,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const origin = await getCurrentLocation();
      const result = await fetchRoute(profile, origin, destination);
      setRoute(result);
    } catch (err) {
      setRoute(null);
      setError(
        err instanceof Error ? err.message : 'No se pudo calcular la ruta.',
      );
    } finally {
      setLoading(false);
    }
  };

  const clearRoute = () => {
    setRoute(null);
    setError(null);
  };

  return { route, loading, error, calculateRoute, clearRoute };
}
