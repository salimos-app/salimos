/**
 * Generador de paleta perceptualmente uniforme basado en los datos REALES
 * del colormap plasma (ver `plasmaData.ts`), recortado y recorrido en
 * sentido inverso para quedarse solo con la franja "sunset → dusk"
 * (amarillo/naranja → coral/magenta → violeta), cortada antes de entrar en
 * el azul-noche del extremo real de plasma — la misma franja de tonos que
 * el isotipo de la marca (assets/isotipo.png) recorre de forma natural,
 * porque plasma completo va de índigo oscuro a amarillo brillante pasando
 * exactamente por esos tonos.
 *
 * Solo para UI (botones, pines, badges...) — el estilo del mapa
 * (src/theme/mapStyle.ts) no usa esta paleta.
 *
 * La interpolación entre las muestras del LUT se hace en OKLab (vía
 * Culori), y la discretización es uniforme en distancia perceptual a lo
 * largo de la curva (arc-length reparametrization), no uniforme en el
 * índice crudo del LUT — así `createSunsetPalette(n)` reparte los `n`
 * colores a "igual salto visual" entre sí.
 */
import { converter, formatHex } from 'culori/require';
import { PLASMA_LUT } from './plasmaData';

const toOklab = converter('oklab');

/**
 * Recorte del LUT de plasma: `SUNSET_U` es el punto (cerca del extremo
 * amarillo) que se toma como "amanecer" — un poco antes del amarillo más
 * verdoso del extremo real (U=1) para quedarse en naranja/amarillo cálido.
 * `NIGHT_U_FULL` es el extremo más oscuro real de plasma (azul-índigo).
 *
 * La paleta pública NO llega hasta ese extremo azul: se corta en el punto
 * que antes ocupaba la 5ª de las 6 muestras arco-uniformes que cubrían toda
 * la curva (`NIGHT_CUTOFF_ARC_FRACTION` = 0.8 de esas 6, o sea el índice 4 de
 * 0..5), para quedarse en violeta/magenta y no entrar en el azul. `NIGHT_U`
 * es ese punto de corte, calculado más abajo a partir del extremo real.
 */
const SUNSET_U = 0.86;
const NIGHT_U_FULL = 0;
const NIGHT_CUTOFF_ARC_FRACTION = 0.8;

/** Interpolación lineal entre dos muestras adyacentes del LUT, en OKLab. */
function sampleLut(u: number): { l: number; a: number; b: number } {
  const clamped = Math.min(1, Math.max(0, u));
  const scaled = clamped * (PLASMA_LUT.length - 1);
  const i0 = Math.floor(scaled);
  const i1 = Math.min(PLASMA_LUT.length - 1, i0 + 1);
  const localT = scaled - i0;

  const c0 = toOklab(PLASMA_LUT[i0])!;
  const c1 = toOklab(PLASMA_LUT[i1])!;
  return {
    l: c0.l + (c1.l - c0.l) * localT,
    a: (c0.a ?? 0) + ((c1.a ?? 0) - (c0.a ?? 0)) * localT,
    b: (c0.b ?? 0) + ((c1.b ?? 0) - (c0.b ?? 0)) * localT,
  };
}

/** Punto "crudo" de la curva dado un extremo `nightU`, en `t` ∈ [0,1] (0 = sunset, 1 = ese extremo). */
function rawColorAtWithEnd(t: number, nightU: number): { l: number; a: number; b: number } {
  const u = SUNSET_U + (nightU - SUNSET_U) * Math.min(1, Math.max(0, t));
  return sampleLut(u);
}

/**
 * Construye la tabla de longitud de arco para un extremo `nightU` dado:
 * muestrea la curva densamente y acumula la distancia euclídea en OKLab
 * (proxy razonable de distancia perceptual) para poder reparametrizar
 * "t uniforme en distancia percibida" en vez de "t uniforme en el índice
 * crudo del LUT".
 */
const ARC_SAMPLES = 512;
function buildArcLengthTable(nightU: number): { arcLengthTable: number[]; sampleParams: number[] } {
  const arcLengthTable: number[] = [0];
  const sampleParams: number[] = [0];
  let prev = rawColorAtWithEnd(0, nightU);
  for (let i = 1; i <= ARC_SAMPLES; i++) {
    const t = i / ARC_SAMPLES;
    const point = rawColorAtWithEnd(t, nightU);
    const dl = point.l - prev.l;
    const da = point.a - prev.a;
    const db = point.b - prev.b;
    arcLengthTable.push(
      arcLengthTable[i - 1] + Math.sqrt(dl * dl + da * da + db * db),
    );
    sampleParams.push(t);
    prev = point;
  }
  return { arcLengthTable, sampleParams };
}

/** Dado `s` ∈ [0,1] (fracción de longitud de arco) y una tabla, devuelve el `t` real de la curva. */
function tForArcLengthIn(
  s: number,
  arcLengthTable: number[],
  sampleParams: number[],
): number {
  const totalArcLength = arcLengthTable[arcLengthTable.length - 1];
  const target = Math.min(1, Math.max(0, s)) * totalArcLength;

  let lo = 0;
  let hi = arcLengthTable.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arcLengthTable[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  if (lo === 0) return sampleParams[0];

  const before = arcLengthTable[lo - 1];
  const after = arcLengthTable[lo];
  const span = after - before;
  const localT = span === 0 ? 0 : (target - before) / span;
  return sampleParams[lo - 1] + localT * (sampleParams[lo] - sampleParams[lo - 1]);
}

// Tabla sobre la curva completa (hasta el azul real), usada solo para hallar
// el punto de corte antes del azul.
const fullRangeTables = buildArcLengthTable(NIGHT_U_FULL);
const cutoffT = tForArcLengthIn(
  NIGHT_CUTOFF_ARC_FRACTION,
  fullRangeTables.arcLengthTable,
  fullRangeTables.sampleParams,
);
/** Extremo real usado por la paleta pública: se detiene antes del azul. */
const NIGHT_U = SUNSET_U + (NIGHT_U_FULL - SUNSET_U) * cutoffT;

// Tabla definitiva, recortada a [SUNSET_U, NIGHT_U] — la que usan
// `rawColorAt` / `getSunsetColor`.
const { arcLengthTable, sampleParams } = buildArcLengthTable(NIGHT_U);

/** Punto "crudo" de la curva en `t` ∈ [0,1] (0 = sunset, 1 = corte previo al azul), sin reparametrizar. */
function rawColorAt(t: number): { l: number; a: number; b: number } {
  return rawColorAtWithEnd(t, NIGHT_U);
}

/** Dado `s` ∈ [0,1] (fracción de longitud de arco), devuelve el `t` real de la curva. */
function tForArcLength(s: number): number {
  return tForArcLengthIn(s, arcLengthTable, sampleParams);
}

/**
 * Color continuo de la paleta en `t` ∈ [0,1] (0 = amanecer/amarillo,
 * 1 = violeta/magenta oscuro, justo antes de entrar en el azul), muestreado
 * a distancia perceptual uniforme sobre los datos reales de plasma. Devuelve
 * un HEX.
 */
export function getSunsetColor(t: number): string {
  const { l, a, b } = rawColorAt(tForArcLength(t));
  // Los valores del LUT ya son sRGB válido; formatHex solo convierte el
  // resultado de la interpolación en OKLab de vuelta a HEX.
  return formatHex({ mode: 'oklab', l, a, b });
}

/**
 * Genera `n` colores HEX repartidos a distancia perceptual uniforme a lo
 * largo de la curva sunset → dusk (extremos incluidos), sin llegar al azul.
 */
export function createSunsetPalette(n: number = 6): string[] {
  if (n <= 0) return [];
  if (n === 1) return [getSunsetColor(0.5)];

  return Array.from({ length: n }, (_, i) => getSunsetColor(i / (n - 1)));
}

// ---------------------------------------------------------------------------
// Ejemplos de uso
// ---------------------------------------------------------------------------

/** `createSunsetPalette()` sin argumentos → 6 colores por defecto. */
export const exampleSunsetPalette6 = createSunsetPalette();

/** Cualquier número de colores, ej. 12 para un degradado más fino. */
export const exampleSunsetPalette12 = createSunsetPalette(12);
