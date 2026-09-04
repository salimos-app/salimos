import { Sitio } from '../types/sitio';
import { ParadaTaxi, RadioTaxiInfo } from '../types/taxi';
import { getApiBaseUrls } from '../config/api';

/**
 * Bares, pubs, supermercados y tiendas de conveniencia que conoce el backend
 * (`GET /api/sitios`), en vez de tener el listado hardcodeado en el bundle.
 */
export async function fetchSitios(): Promise<Sitio[]> {
  const urls = getApiBaseUrls().map((baseUrl) => `${baseUrl}/api/sitios`);
  let lastError: unknown = null;

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      if (Array.isArray(payload?.data)) {
        return payload.data as Sitio[];
      }
    } catch (error) {
      lastError = error;
      console.warn(`Fallo cargando sitios desde ${url}:`, error);
    }
  }

  throw lastError ?? new Error('No se pudo cargar el listado de sitios.');
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
  let lastError: unknown = null;

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      if (Array.isArray(payload?.data?.paradas)) {
        return payload.data as ParadasTaxi;
      }
    } catch (error) {
      lastError = error;
      console.warn(`Fallo cargando paradas de taxi desde ${url}:`, error);
    }
  }

  throw lastError ?? new Error('No se pudo cargar el listado de paradas de taxi.');
}
