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

/**
 * Normaliza la respuesta de /api/microsites/:slug/events (proxy de /api/events
 * de Fourvenues), que a diferencia del feed de /metadata sí trae `image`.
 */
function normalizeEventosConImagen(payload: unknown): Evento[] {
  if (typeof payload !== 'object' || payload === null) {
    return [];
  }

  const rawList = (payload as Record<string, unknown>).data;
  if (!Array.isArray(rawList)) {
    return [];
  }

  return rawList
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).name === 'string',
    )
    .map((item): Evento => {
      const dates = item.dates as { start?: number; end?: number } | undefined;
      const organization = item.organization as
        | { name?: string; slug?: string }
        | undefined;
      const location = item.location as
        | { addressComplete?: string }
        | undefined;

      return {
        name: item.name as string,
        startDate: dates?.start
          ? new Date(dates.start * 1000).toISOString()
          : '',
        endDate: dates?.end ? new Date(dates.end * 1000).toISOString() : '',
        url: `https://site.fourvenues.com/${organization?.slug ?? ''}/events/${item.code as string}`,
        location: {
          name: organization?.name ?? 'Sin ubicación',
          address: { streetAddress: location?.addressComplete ?? '' },
        },
        image: typeof item.image === 'string' ? item.image : undefined,
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

function getEventsUrls(slug: string): string[] {
  return getApiBaseUrls().map(
    (baseUrl) => `${baseUrl}/api/microsites/${slug}/events`,
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
 * Obtiene los próximos eventos de una discoteca, con foto cuando Fourvenues
 * la tenga cargada (a diferencia de /metadata, que es solo el feed schema.org
 * sin imágenes).
 * @param slug Identificador del microsite (ej: "banana")
 */
export async function fetchProximosEventos(slug: string): Promise<Evento[]> {
  const urls = getEventsUrls(slug);
  let lastError: unknown = null;

  for (const url of urls) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      const eventos = normalizeEventosConImagen(payload);

      if (eventos.length > 0) {
        return eventos;
      }
    } catch (error) {
      lastError = error;
      console.warn(`Fallo cargando eventos desde ${url}:`, error);
    }
  }

  // Fallback: si /events falla, al menos se listan los eventos sin foto.
  const metadataUrls = getMetadataUrls(slug);
  for (const url of metadataUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const payload = await response.json();
      const eventos = normalizeEventos(payload);
      if (eventos.length > 0) {
        return eventos;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('No se pudo cargar la lista de eventos.');
}
