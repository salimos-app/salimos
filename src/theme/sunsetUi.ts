/**
 * Tokens de UI derivados de la paleta sunset (ver `sunsetPalette.ts`), para
 * botones, pines de mapa, badges, etc. — todavía no está conectado a ningún
 * componente; es la paleta lista para usar cuando se apruebe el diseño.
 *
 * El mapa (src/theme/mapStyle.ts) no usa esta paleta.
 */
import { getSunsetColor } from './sunsetPalette';

/**
 * Paleta cíclica para distinguir elementos del mismo tipo (p.ej. una
 * discoteca por pin), repartida a lo largo de toda la curva sunset → dusk
 * (sin llegar al azul).
 */
export const sunsetCyclePalette = [
  getSunsetColor(0), // amanecer / amarillo cálido
  getSunsetColor(0.2), // naranja
  getSunsetColor(0.4), // coral
  getSunsetColor(0.55), // magenta
  getSunsetColor(0.7), // magenta-violeta
  getSunsetColor(0.85), // violeta
  getSunsetColor(1), // violeta oscuro (justo antes del azul)
];

/** Tokens semánticos puntuales, pensados para acciones/estados de UI. */
export const sunsetUi = {
  /** Acción principal (botones primarios, CTA). */
  actionPrimary: getSunsetColor(0.55),
  actionPrimaryPressed: getSunsetColor(0.65),
  /** Acento cálido (badges destacados, "nuevo", precio). */
  accentWarm: getSunsetColor(0.12),
  /** Acento frío (enlaces secundarios, estado "seleccionado" alterno). */
  accentCool: getSunsetColor(0.82),
  /** Pin por defecto / seleccionado en el mapa (elemento de UI, no del mapa en sí). */
  pinDefault: getSunsetColor(0.5),
  pinSelected: getSunsetColor(0.35),
} as const;
