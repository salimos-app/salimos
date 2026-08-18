import { Platform } from 'react-native';

/**
 * Configuración centralizada de la API.
 */
export const API_CONFIG = {
  // URL pública del backend en Render
  PRODUCTION_API_URL: 'https://backend-salimos.onrender.com',

  // Solo se usa en local si se quiere depurar el backend en la máquina
  LOCAL_API_URL: 'http://10.0.2.2:8082',

  // Token de autenticación
  API_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHAiOiJjbGktYXBpLXNlcnZpY2UiLCJpYXQiOjE3ODY5MDQ5MzR9.gagE3yvxbOaER_dbY8JFrAaFSAJrxwVDWeOg_aXPsS8',

  // Producción: usar siempre la URL pública del backend
  isProduction: true,
};

/**
 * Obtiene las URLs base (sin /api/microsites) a intentar según plataforma y entorno.
 */
export function getApiBaseUrls(): string[] {
  const urls: string[] = [];

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    urls.push(API_CONFIG.PRODUCTION_API_URL);
    return urls;
  }

  // En móvil y en producción usamos solo la URL pública del backend
  urls.push(API_CONFIG.PRODUCTION_API_URL);
  return urls;
}

/**
 * Obtiene la URL base del proxy (backwards-compatible con código existente).
 */
export function getApiBaseUrl(): string {
  return getApiBaseUrls()[0];
}

/**
 * Obtiene la URL completa para un endpoint del proxy.
 */
export function getProxyUrl(endpoint: string): string {
  return `${getApiBaseUrl()}${endpoint}`;
}