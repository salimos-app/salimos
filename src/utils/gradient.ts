/** Utilidades para pintar una polilínea (ruta) con un degradado de varias paradas. */

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const value = parseInt(clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Interpola un color dentro de una lista de paradas de degradado, en t ∈ [0, 1]. */
export function colorAt(stops: readonly string[], t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  if (stops.length === 1) return stops[0];

  const scaled = clamped * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const localT = scaled - index;

  const [r1, g1, b1] = hexToRgb(stops[index]);
  const [r2, g2, b2] = hexToRgb(stops[index + 1]);

  return rgbToHex(r1 + (r2 - r1) * localT, g1 + (g2 - g1) * localT, b1 + (b2 - b1) * localT);
}

export interface GradientSegment {
  positions: [number, number][];
  color: string;
}

/**
 * Divide una polilínea en pequeños tramos de 2 puntos, cada uno coloreado
 * según su posición a lo largo de la ruta, para simular un trazo con
 * degradado (efecto usado en la línea de "cómo llegar" del mapa).
 */
export function buildGradientSegments(
  coordinates: readonly [number, number][],
  stops: readonly string[]
): GradientSegment[] {
  if (coordinates.length < 2) return [];

  const segments: GradientSegment[] = [];
  const last = coordinates.length - 2;

  for (let i = 0; i < coordinates.length - 1; i += 1) {
    const t = last === 0 ? 0 : i / last;
    segments.push({
      positions: [coordinates[i], coordinates[i + 1]],
      color: colorAt(stops, t),
    });
  }

  return segments;
}
