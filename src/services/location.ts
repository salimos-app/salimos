import * as Location from 'expo-location';
import { LatLng } from './directionsApi';

/**
 * Pide permiso de ubicación en el momento (no antes) y devuelve la posición
 * actual, como hace Waze/Google Maps.
 */
export async function getCurrentLocation(): Promise<LatLng> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Necesitamos permiso de ubicación para calcular la ruta.');
  }

  const position = await Location.getCurrentPositionAsync({});
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}
