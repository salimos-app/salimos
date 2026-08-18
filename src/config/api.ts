import { Platform } from 'react-native';

/**
 * Configuración centralizada de la API.
 */
export const API_CONFIG = {
  // URL del proxy server desplegado (RENDER)
  PRODUCTION_API_URL: 'https://nightspot-proxy.onrender.com',

  // URL local para desarrollo
  LOCAL_API_URL: 'http://localhost:8082',

  // Puerto del proxy local
  LOCAL_PORT: 8082,

  // Host base de la API externa de Fourvenues (sin path)
  FOURVENUES_BASE_URL: 'https://cli-api-service.fourvenues.com',

  // Token de autenticación
  API_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHAiOiJjbGktYXBpLXNlcnZpY2UiLCJpYXQiOjE3ODY5MDQ5MzR9.gagE3yvxbOaER_dbY8JFrAaFSAJrxwVDWeOg_aXPsS8',

  // Determina si estamos en modo producción
  isProduction: __DEV__ === false,
};

/**
 * Obtiene las URLs base (sin /api/microsites) a intentar según plataforma y entorno.
 */
export function getApiBaseUrls(): string[] {
  const urls: string[] = [];

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Desarrollo web → proxy local primero, fallback API directa
      urls.push(`http://${hostname}:${API_CONFIG.LOCAL_PORT}`);
      urls.push(API_CONFIG.FOURVENUES_BASE_URL);
    } else {
      // Web producida → proxy público, fallback API directa
      urls.push(API_CONFIG.PRODUCTION_API_URL);
      urls.push(API_CONFIG.FOURVENUES_BASE_URL);
    }
  } else {
    // Dispositivos móviles (Android/iOS)
    if (API_CONFIG.isProduction) {
      // APK producción → API directa de Fourvenues (funciona sin proxy)
      urls.push(API_CONFIG.FOURVENUES_BASE_URL);
      urls.push(API_CONFIG.PRODUCTION_API_URL);
    } else {
      // Desarrollo → proxy local, fallback API directa
      urls.push(`http://localhost:${API_CONFIG.LOCAL_PORT}`);
      urls.push(API_CONFIG.FOURVENUES_BASE_URL);
    }
  }

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