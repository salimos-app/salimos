import { Evento, Location } from '../types/evento';
import { getApiBaseUrls } from '../config/api';

function normalizeEventos(payload: unknown): Evento[] {
  if (typeof payload !== 'object' || payload === null) {
    return [];
  }

  const p = payload as Record<string, unknown>;
  const rawList =
    (p?.data as Record<string, unknown> | undefined)?.itemListElement ??
    (p?.itemListElement as unknown[] | undefined) ??
    [];

  if (!Array.isArray(rawList)) {
    return [];
  }

  return rawList
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) return null;
      const e = entry as Record<string, unknown>;
      return e?.item ?? entry;
    })
    .filter(
      (item): item is Record<string, unknown> =>
        item !== null &&
        typeof item === 'object' &&
        'name' in item &&
        typeof (item as Record<string, unknown>).name === 'string',
    )
    .map((item): Evento => {
      const location = item.location as Record<string, unknown> | undefined;
      const parsedLocation: Location = location
        ? {
            name:
              typeof location.name === 'string'
                ? location.name
                : 'Sin ubicación',
            address: {
              streetAddress:
                typeof (location.address as Record<string, unknown> | undefined)
                  ?.streetAddress === 'string'
                  ? ((location.address as Record<string, unknown>)
                      .streetAddress as string)
                  : '',
            },
          }
        : {
            name: 'Sin ubicación',
            address: { streetAddress: '' },
          };

      return {
        name: item.name as string,
        startDate: typeof item.startDate === 'string' ? item.startDate : '',
        endDate: typeof item.endDate === 'string' ? item.endDate : '',
        url: typeof item.url === 'string' ? item.url : '',
        location: parsedLocation,
      };
    });
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
