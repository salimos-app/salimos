/**
 * Estilo de mapa vectorial (MapLibre Style Spec) a juego con la marca.
 *
 * Usa tiles vectoriales gratuitos de OpenFreeMap (sin API key) y repinta las
 * capas base con la paleta de `colors.ts` en vez de usar su estilo por
 * defecto, para conseguir un mapa oscuro, limpio y coherente con el resto
 * de la app.
 */
import { colors } from './colors';

export const MAP_TILES_URL = 'https://tiles.openfreemap.org/planet';
export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Fuentes vectoriales (misma fuente que usa el estilo "liberty" de OpenFreeMap). */
const sources = {
  openmaptiles: {
    type: 'vector',
    url: MAP_TILES_URL,
    attribution: MAP_ATTRIBUTION,
  },
};

/**
 * Set reducido de capas: solo lo que aporta al UX del mapa de la app
 * (agua, parques, edificios, vías, límites, labels de calles/lugares).
 * Se evita el ruido de POIs/iconos que trae el estilo por defecto.
 */
/** Colores propios del mapa (terreno y agua), independientes del tema de la UI. */
const MAP_TERRAIN_COLOR = '#060711';
const MAP_WATER_COLOR = '#0D0B1E';

const layers = [
  {
    id: 'background',
    type: 'background',
    paint: { 'background-color': MAP_TERRAIN_COLOR },
  },
  {
    id: 'water',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'water',
    paint: { 'fill-color': MAP_WATER_COLOR },
  },
  {
    id: 'landuse-park',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'landuse',
    filter: ['in', 'class', 'park', 'forest', 'wood', 'grass'],
    paint: { 'fill-color': colors.backgroundCard, 'fill-opacity': 0.6 },
  },
  {
    id: 'building',
    type: 'fill',
    source: 'openmaptiles',
    'source-layer': 'building',
    minzoom: 13,
    paint: {
      'fill-color': colors.backgroundCard,
      'fill-outline-color': colors.border,
      'fill-opacity': 0.8,
    },
  },
  {
    id: 'boundary',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'boundary',
    filter: ['<=', 'admin_level', 4],
    paint: {
      'line-color': colors.border,
      'line-width': 1,
      'line-dasharray': [2, 2],
    },
  },
  {
    id: 'road-minor',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'transportation',
    filter: ['in', 'class', 'minor', 'service', 'track'],
    paint: {
      'line-color': colors.borderLight,
      'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 18, 3],
    },
  },
  {
    id: 'road-major',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'transportation',
    filter: ['in', 'class', 'primary', 'secondary', 'tertiary', 'trunk'],
    paint: {
      'line-color': colors.border,
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 18, 6],
    },
  },
  {
    // AUTOPISTA
    id: 'road-motorway',
    type: 'line',
    source: 'openmaptiles',
    'source-layer': 'transportation',
    filter: ['==', 'class', 'motorway'],
    paint: {
      // COLOR
      'line-color': colors.border,
      // OPACIDAD
      'line-opacity': 0.5,
      // GROSOR
      'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1, 18, 8],
    },
  },
  {
    id: 'place-labels',
    type: 'symbol',
    source: 'openmaptiles',
    'source-layer': 'place',
    filter: ['in', 'class', 'city', 'town', 'village', 'suburb'],
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 6, 10, 14, 16],
    },
    paint: {
      'text-color': colors.textSecondary,
      'text-halo-color': MAP_TERRAIN_COLOR,
      'text-halo-width': 1.2,
    },
  },
  {
    id: 'road-labels',
    type: 'symbol',
    source: 'openmaptiles',
    'source-layer': 'transportation_name',
    minzoom: 14,
    layout: {
      'symbol-placement': 'line',
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 11,
    },
    paint: {
      'text-color': colors.textMuted,
      'text-halo-color': MAP_TERRAIN_COLOR,
      'text-halo-width': 1,
    },
  },
] as const;

/** MapLibre Style Spec completo, listo para pasar a `new maplibregl.Map({ style })`. */
export const mapStyle = {
  version: 8,
  name: 'Salimos Dark',
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources,
  layers,
} as const;
