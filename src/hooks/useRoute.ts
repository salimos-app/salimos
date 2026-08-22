import { useState } from 'react';
import * as Location from 'expo-location';
import { fetchRoute, LatLng, RouteResult, TravelProfile } from '../services/directionsApi';

/**
 * Calcula una ruta desde la ubicación actual del usuario hasta un destino,
 * usando el proxy de OpenRouteService del backend. Pide permiso de
 * ubicación en el momento (no antes), como hace Waze/Google Maps.
 */
export function useRoute() {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateRoute = async (profile: TravelProfile, destination: LatLng) => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Necesitamos permiso de ubicación para calcular la ruta.');
      }

      const position = await Location.getCurrentPositionAsync({});
      const origin: LatLng = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      const result = await fetchRoute(profile, origin, destination);
      setRoute(result);
    } catch (err) {
      setRoute(null);
      setError(err instanceof Error ? err.message : 'No se pudo calcular la ruta.');
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
