/**
 * Color de acento por categoría de punto en el mapa: uno fijo por
 * categoría (no rotado por índice) — paleta de marca, ver CLAUDE.md →
 * Decisiones de diseño → Paleta de colores.
 */
export const CATEGORY_COLORS = {
  taxi: '#febd2a',
  supermercado: '#de6164',
  bar: '#9511a1',
  discoteca: '#5d01a6',
} as const;

/**
 * Color "de arriba" del degradado de cada pin del mapa: el tono vecino más
 * cálido de la paleta (taxi, el más cálido, sube a un amarillo más claro).
 * Imita el recorrido del isotipo (cálido arriba-derecha → frío
 * abajo-izquierda).
 */
export const CATEGORY_PIN_HIGHLIGHT = {
  taxi: '#ffe07a',
  supermercado: '#f58c46',
  bar: '#bf3984',
  discoteca: '#9511a1',
} as const;
