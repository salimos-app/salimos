import { Sitio } from '../types/sitio';
import { ParadaTaxi, RadioTaxiInfo } from '../types/taxi';
import { getApiBaseUrls } from '../config/api';
import { fetchWithFallback } from './httpClient';

/**
 * Bares, pubs, supermercados y tiendas de conveniencia que conoce el backend
 * (`GET /api/sitios`), en vez de tener el listado hardcodeado en el bundle.
 */
export async function fetchSitios(): Promise<Sitio[]> {
  const urls = getApiBaseUrls().map((baseUrl) => `${baseUrl}/api/sitios`);
  return fetchWithFallback(
    urls,
    (payload) => {
      const data = (payload as { data?: unknown })?.data;
      return Array.isArray(data) ? (data as Sitio[]) : undefined;
    },
    { label: 'sitios' },
  );
}

export interface ParadasTaxi {
  paradas: ParadaTaxi[];
  radioTaxi: RadioTaxiInfo;
}

/**
 * Paradas de taxi y teléfono de Radio Taxi que conoce el backend
 * (`GET /api/taxis`), en vez de tenerlos hardcodeados en el bundle.
 */
export async function fetchParadasTaxi(): Promise<ParadasTaxi> {
  const urls = getApiBaseUrls().map((baseUrl) => `${baseUrl}/api/taxis`);
  return fetchWithFallback(
    urls,
    (payload) => {
      const data = (payload as { data?: ParadasTaxi })?.data;
      return Array.isArray(data?.paradas) ? data : undefined;
    },
    { label: 'paradas de taxi' },
  );
}
