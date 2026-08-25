import { SitioCategoria } from '../types/sitio';
import { colors } from '../theme/colors';

// Bares/pubs en un color, supermercados/tiendas de conveniencia en otro.
export const SITIO_ESTILO: Record<SitioCategoria, { icon: string; color: string; etiqueta: string }> = {
  bar: { icon: '🍺', color: colors.neonPurple, etiqueta: 'Bar' },
  pub: { icon: '🍻', color: colors.neonPurple, etiqueta: 'Pub' },
  supermarket: { icon: '🛒', color: colors.neonGreen, etiqueta: 'Supermercado' },
  convenience: { icon: '🏪', color: colors.neonGreen, etiqueta: 'Tienda de conveniencia' },
};
