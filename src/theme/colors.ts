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
