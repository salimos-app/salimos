export function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return minutes >= 60
    ? `${Math.floor(minutes / 60)} h ${minutes % 60} min`
    : `${minutes} min`;
}

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('es-ES', { weekday: 'long' });
const DAY_MONTH_FORMATTER = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long' });

/** "Viernes, 4 de septiembre" a partir de un ISO string. */
export function formatFechaLarga(fechaISO: string): string {
  const fecha = new Date(fechaISO);
  const diaSemana = WEEKDAY_FORMATTER.format(fecha);
  return `${diaSemana.charAt(0).toUpperCase()}${diaSemana.slice(1)}, ${DAY_MONTH_FORMATTER.format(fecha)}`;
}
