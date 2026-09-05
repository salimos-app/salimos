export const colors = {
  // Fondo oscuro tipo club
  background: '#0D0B1E',
  backgroundLight: '#1A1633',
  backgroundCard: '#221D3D',

  // Neones principales
  neonPink: '#FF2E88',
  neonPurple: '#9B5CFF',
  neonBlue: '#00E5FF',
  neonGreen: '#39FF14',
  neonYellow: '#FFD700',

  // Texto
  textPrimary: '#FFFFFF',
  textSecondary: '#B8B3D4',
  textMuted: '#6E6893',

  // Bordes y sombras
  border: '#3A3460',
  borderLight: '#2A2450',
  shadow: '#000000',

  // Acento de marca (para sombras/resplandores; mismo tono que neonPink)
  brandPink: '#FF2E88',

  // Estados
  success: '#39FF14',
  error: '#FF2E88',
  warning: '#FFD700',

  // Gradientes
  gradientStart: '#FF2E88',
  gradientEnd: '#9B5CFF',
} as const;

export const gradients = {
  primary: [colors.neonPink, colors.neonPurple] as const,
  dark: [colors.background, colors.backgroundLight] as const,
  card: [colors.backgroundCard, colors.backgroundLight] as const,
  brand: [colors.neonPink, colors.neonPurple] as const,
  brandSoft: [`${colors.neonPink}CC`, `${colors.neonPurple}CC`] as const,
} as const;

// Paradas del degradado usado para pintar la ruta ("cómo llegar") en el mapa.
export const BRAND_GRADIENT = [colors.gradientStart, colors.gradientEnd] as const;

/**
 * Oscurece un color hex un `amount` (0-1) escalando sus canales RGB — para
 * trazos/bordes que deben leerse como "el mismo color, más oscuro" en vez de
 * un tono completamente distinto (p.ej. el borde de un botón sobre su
 * propio relleno).
 */
export function darkenHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const factor = 1 - Math.min(1, Math.max(0, amount));
  const r = Math.round(((num >> 16) & 0xff) * factor);
  const g = Math.round(((num >> 8) & 0xff) * factor);
  const b = Math.round((num & 0xff) * factor);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
