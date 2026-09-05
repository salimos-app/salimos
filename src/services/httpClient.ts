/**
 * Pide JSON probando cada URL de `urls` en orden hasta que una responda con
 * éxito y `extract` saque de ahí un valor válido — así es como todos los
 * servicios de la app manejan el fallback entre entornos (local vs
 * producción, ver `getApiBaseUrls`) sin repetir el mismo `for...try/catch`
 * en cada función.
 *
 * `extract` decide qué es "válido": si devuelve `undefined`, se prueba la
 * siguiente URL (útil cuando una respuesta 200 puede venir vacía y hay que
 * seguir intentando). Si todas las URLs fallan o no dan nada válido:
 * devuelve `fallbackValue` si se pasó, o lanza el último error.
 */
export async function fetchWithFallback<T>(
  urls: string[],
  extract: (payload: unknown) => T | undefined,
  options: { label: string; fallbackValue?: T },
): Promise<T> {
  let lastError: unknown = null;

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      const value = extract(payload);
      if (value !== undefined) return value;
    } catch (error) {
      lastError = error;
      console.warn(`Fallo cargando ${options.label} desde ${url}:`, error);
    }
  }

  if ('fallbackValue' in options) {
    return options.fallbackValue as T;
  }
  throw lastError ?? new Error(`No se pudo cargar ${options.label}.`);
}
