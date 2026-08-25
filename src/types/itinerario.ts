import { TravelProfile } from '../services/directionsApi';

export type TipoParadaItinerario = 'ubicacion' | 'taxi' | 'sitio' | 'discoteca' | 'casa';

/** Una parada del itinerario (ubicación actual, taxi, bar/súper/bazar, discoteca o casa). */
export interface ParadaItinerario {
  tipo: TipoParadaItinerario;
  id: string;
  label: string;
  icon: string;
  latitude: number;
  longitude: number;
}

/** Un tramo calculado entre dos paradas consecutivas del itinerario. */
export interface TramoItinerario {
  desde: ParadaItinerario;
  hasta: ParadaItinerario;
  profile: TravelProfile;
  distanceMeters: number;
  durationSeconds: number;
  coordinates: [number, number][];
}
