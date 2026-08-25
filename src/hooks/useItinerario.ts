import { useState } from 'react';
import { fetchRoute, TravelProfile } from '../services/directionsApi';
import { ParadaItinerario, TramoItinerario } from '../types/itinerario';

/**
 * El tramo que SALE de una parada de taxi se recorre en coche (te lleva el
 * taxi); cualquier otro tramo (a un sitio, a la discoteca, a casa sin
 * taxi...) se recorre a pie.
 */
function profileDesde(parada: ParadaItinerario): TravelProfile {
  return parada.tipo === 'taxi' ? 'driving-car' : 'foot-walking';
}

/**
 * Calcula un itinerario de varias etapas (ubicación → taxi? → sitio? →
 * discoteca → taxi? → casa) encadenando una llamada a `fetchRoute` por cada
 * tramo consecutivo. Recibe la lista de paradas ya resuelta (incluyendo
 * origen y destino final) para no acoplarse a cómo se construye.
 */
export function useItinerario() {
  const [tramos, setTramos] = useState<TramoItinerario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calcular = async (paradas: ParadaItinerario[]) => {
    if (paradas.length < 2) return;

    setLoading(true);
    setError(null);

    try {
      const resultado: TramoItinerario[] = [];
      for (let i = 0; i < paradas.length - 1; i++) {
        const desde = paradas[i];
        const hasta = paradas[i + 1];
        const profile = profileDesde(desde);
        const route = await fetchRoute(profile, desde, hasta);
        resultado.push({
          desde,
          hasta,
          profile,
          distanceMeters: route.distanceMeters,
          durationSeconds: route.durationSeconds,
          coordinates: route.coordinates,
        });
      }
      setTramos(resultado);
    } catch (err) {
      setTramos([]);
      setError(err instanceof Error ? err.message : 'No se pudo calcular el itinerario.');
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setTramos([]);
    setError(null);
  };

  return { tramos, loading, error, calcular, clear };
}
