/**
 * Recorre `items` ejecutando `task` sobre cada uno, pero con como mucho
 * `limit` tareas en vuelo a la vez. Sirve para no disparar de golpe una
 * petición por discoteca al arrancar (eso revienta el rate-limiter del
 * backend): las fotos de evento entran "poco a poco" mientras el mapa ya
 * se ve con la imagen genérica.
 *
 * No lanza: si `task` falla para un elemento, se ignora y se sigue con el
 * resto (ese pin se queda con su imagen genérica).
 */
export async function forEachLimit<T>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items];

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const item = queue.shift() as T;
      try {
        await task(item);
      } catch {
        // por elemento: se ignora
      }
    }
  }

  const workers = Array.from({ length: Math.max(1, Math.min(limit, queue.length)) }, worker);
  await Promise.all(workers);
}
