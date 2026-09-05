import { SitioCategoria } from '../types/sitio';
import { CATEGORY_COLORS } from '../theme/categoryColors';

// Bares/pubs en un color, supermercados/tiendas de conveniencia en otro.
export const SITIO_ESTILO: Record<SitioCategoria, { icon: string; color: string; etiqueta: string }> = {
  bar: { icon: '🍺', color: CATEGORY_COLORS.bar, etiqueta: 'Bar' },
  pub: { icon: '🍻', color: CATEGORY_COLORS.bar, etiqueta: 'Pub' },
  supermarket: { icon: '🛒', color: CATEGORY_COLORS.supermercado, etiqueta: 'Supermercado' },
  convenience: { icon: '🏪', color: CATEGORY_COLORS.supermercado, etiqueta: 'Tienda de conveniencia' },
};
