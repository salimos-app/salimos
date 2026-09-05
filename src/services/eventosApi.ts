import { Evento, Location, TicketType } from '../types/evento';
import { DiscotecaSinColor } from '../types/discoteca';
import { getApiBaseUrls } from '../config/api';
import { fetchWithFallback } from './httpClient';

/** Un array no vacío, o `undefined` para que `fetchWithFallback` siga probando URLs. */
function nonEmpty<T>(list: T[]): T[] | undefined {
  return list.length > 0 ? list : undefined;
}

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
        id: typeof item.id === 'string' ? item.id : undefined,
      };
    });
}

/**
 * Obtiene el listado de discotecas que conoce el backend (`GET /api/discotecas`),
 * en vez de tener la lista hardcodeada en el bundle de la app.
 */
export async function fetchDiscotecas(): Promise<DiscotecaSinColor[]> {
  const urls = getApiBaseUrls().map((baseUrl) => `${baseUrl}/api/discotecas`);
  return fetchWithFallback(
    urls,
    (payload) => {
      const data = (payload as { data?: unknown })?.data;
      return Array.isArray(data)
        ? nonEmpty(data as DiscotecaSinColor[])
        : undefined;
    },
    { label: 'discotecas' },
  );
}

export interface DiscotecaCoordinates {
  latitude: number;
  longitude: number;
  nombre: string;
  direccion: string;
}

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
 * @param slug Identificador del microsite en Fourvenues
 */
export async function fetchDiscotecaCoordinates(
  slug: string,
): Promise<DiscotecaCoordinates> {
  return fetchWithFallback(
    getMetadataUrls(slug),
    (payload) => {
      const p = payload as Record<string, unknown>;
      // Extrae las coordenadas del primer evento (todos tienen la misma ubicación).
      const data = p?.data as Record<string, unknown> | undefined;
      const itemListElement =
        (data?.itemListElement as unknown[] | undefined) ??
        (p?.itemListElement as unknown[] | undefined);
      const firstItem = (itemListElement?.[0] as Record<string, unknown> | undefined)
        ?.item as Record<string, unknown> | undefined;
      const location = firstItem?.location as Record<string, unknown> | undefined;
      const geo = location?.geo as { latitude?: number; longitude?: number } | undefined;
      if (!geo) return undefined;

      const address = location?.address as { streetAddress?: string } | undefined;
      return {
        latitude: geo.latitude as number,
        longitude: geo.longitude as number,
        nombre: location?.name as string,
        direccion: address?.streetAddress || '',
      };
    },
    { label: 'coordenadas de la discoteca' },
  );
}

/**
 * Solo la foto del próximo evento con imagen (o `null`). Pega únicamente
 * contra /events, sin el fallback a /metadata de `fetchProximosEventos`:
 * al arrancar solo interesa la foto para el pin, y /metadata nunca trae
 * imágenes, así que ese fallback solo sumaría peticiones inútiles.
 * @param slug Identificador del microsite en Fourvenues
 */
export async function fetchEventImage(slug: string): Promise<string | null> {
  return fetchWithFallback(
    getEventsUrls(slug),
    (payload) => normalizeEventosConImagen(payload).find((evento) => evento.image)?.image,
    { label: `foto de evento (${slug})`, fallbackValue: null },
  );
}

/**
 * Obtiene los próximos eventos de una discoteca, con foto cuando Fourvenues
 * la tenga cargada (a diferencia de /metadata, que es solo el feed schema.org
 * sin imágenes). Si /events falla del todo, cae a /metadata (sin fotos).
 * @param slug Identificador del microsite en Fourvenues
 */
export async function fetchProximosEventos(slug: string): Promise<Evento[]> {
  try {
    return await fetchWithFallback(
      getEventsUrls(slug),
      (payload) => nonEmpty(normalizeEventosConImagen(payload)),
      { label: `eventos (${slug})` },
    );
  } catch (error) {
    try {
      return await fetchWithFallback(
        getMetadataUrls(slug),
        (payload) => nonEmpty(normalizeEventos(payload)),
        { label: `eventos, fallback a metadata (${slug})` },
      );
    } catch {
      throw error;
    }
  }
}

function normalizeTicketTypes(payload: unknown): TicketType[] {
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
        typeof item === 'object' && item !== null && typeof (item as Record<string, unknown>).id === 'string',
    )
    .map((item): TicketType => {
      const options = Array.isArray(item.options) ? item.options : [];
      return {
        id: item.id as string,
        name: typeof item.name === 'string' ? item.name : '',
        isSoldOut: item.isSoldOut === true,
        options: options
          .filter((opt): opt is Record<string, unknown> => typeof opt === 'object' && opt !== null)
          .map((opt) => ({
            id: String(opt.id ?? ''),
            name: typeof opt.name === 'string' ? opt.name : '',
            price: typeof opt.price === 'number' ? opt.price : 0,
            isSoldOut: opt.isSoldOut === true,
          })),
      };
    });
}

/**
 * Tipos de entrada y precios de un evento concreto (tramos, disponibilidad).
 * Necesita `eventId` (el `id` que trae `fetchProximosEventos`, no el `code`
 * corto de la URL pública) porque Fourvenues indexa los precios por ahí.
 * @param slug Identificador del microsite en Fourvenues
 * @param eventId Id interno del evento (`Evento.id`)
 */
export async function fetchEventTicketTypes(
  slug: string,
  eventId: string,
): Promise<TicketType[]> {
  const urls = getApiBaseUrls().map(
    (baseUrl) => `${baseUrl}/api/microsites/${slug}/events/${eventId}/tickets-types`,
  );
  return fetchWithFallback(urls, normalizeTicketTypes, {
    label: 'precios de entradas',
  });
}

/** Precio más barato disponible entre los tipos de entrada de un evento, o `null` si no hay ninguno a la venta. */
export function precioDesde(tiposEntrada: TicketType[]): number | null {
  const precios = tiposEntrada
    .filter((tipo) => !tipo.isSoldOut)
    .flatMap((tipo) => tipo.options.filter((opt) => !opt.isSoldOut).map((opt) => opt.price));
  return precios.length > 0 ? Math.min(...precios) : null;
}
