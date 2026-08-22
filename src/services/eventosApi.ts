import { Evento } from '../types/evento';
import { getApiBaseUrls } from '../config/api';

function normalizeEventos(payload: any): Evento[] {
  const rawList =
    payload?.data?.itemListElement ?? payload?.itemListElement ?? [];

  return rawList
    .map((entry: any) => entry?.item ?? entry)
    .filter((item: any) => item && typeof item === 'object' && item.name)
    .map((item: any) => ({
      name: item.name,
      startDate: item.startDate,
      endDate: item.endDate,
      url: item.url,
      location: item.location ?? {
        name: 'Sin ubicación',
        address: { streetAddress: '' },
      },
    }));
}

export interface DiscotecaCoordinates {
  latitude: number;
  longitude: number;
  nombre: string;
  direccion: string;
}

/**
 * Obtiene las URLs de metadata de microsites según la plataforma y entorno.
 * Ejemplos:
 *  - Local:  http://localhost:8082/api/microsites/banana/metadata
 *  - Render: https://backend-salimos.onrender.com/api/microsites/banana/metadata
 */
function getMetadataUrls(slug: string): string[] {
  return getApiBaseUrls().map(
    (baseUrl) => `${baseUrl}/api/microsites/${slug}/metadata`,
  );
}

/**
 * Obtiene las coordenadas de una discoteca desde la API.
 * @param slug Identificador del microsite (ej: "banana")
 */
export async function fetchDiscotecaCoordinates(
  slug: string,
): Promise<DiscotecaCoordinates> {
  const urls = getMetadataUrls(slug);
  let lastError: unknown = null;

  for (const url of urls) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();

      // Extrae las coordenadas del primer evento (todos tienen la misma ubicación)
      const firstItem =
        payload?.data?.itemListElement?.[0]?.item ||
        payload?.itemListElement?.[0]?.item;
      if (firstItem?.location?.geo) {
        return {
          latitude: firstItem.location.geo.latitude,
          longitude: firstItem.location.geo.longitude,
          nombre: firstItem.location.name,
          direccion: firstItem.location.address?.streetAddress || '',
        };
      }
    } catch (error) {
      lastError = error;
      console.warn(`Fallo cargando coordenadas desde ${url}:`, error);
    }
  }

  throw (
    lastError ?? new Error('No se pudo cargar las coordenadas de la discoteca.')
  );
}

/**
 * Obtiene los próximos eventos de una discoteca.
 * @param slug Identificador del microsite (ej: "banana")
 */
export async function fetchProximosEventos(slug: string): Promise<Evento[]> {
  const urls = getMetadataUrls(slug);
  let lastError: unknown = null;

  for (const url of urls) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const eventos = normalizeEventos(payload);

      if (Array.isArray(eventos) && eventos.length > 0) {
        return eventos;
      }
    } catch (error) {
      lastError = error;
      console.warn(`Fallo cargando eventos desde ${url}:`, error);
    }
  }

  throw lastError ?? new Error('No se pudo cargar la lista de eventos.');
}
