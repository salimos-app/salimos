/**
 * Markup HTML de los pines del mapa. MapLibre pinta los pines como DOM plano
 * (en web, directo al documento; en nativo, dentro de un WebView aislado),
 * así que se construyen como strings. Única fuente para las dos
 * plataformas: `MapView.web.tsx` los usa tal cual y `MapView.tsx` los
 * calcula en el lado de React Native y se los pasa ya hechos al WebView.
 */
import { colors } from './colors';
import { CATEGORY_COLORS, CATEGORY_PIN_HIGHLIGHT } from './categoryColors';
import {
  MAP_FONT_FAMILY,
  PIN_ACCENT_FONT_WEIGHT,
  PIN_LABEL_FONT_WEIGHT,
} from './mapPins';
import { PIN_ICON_VIEWBOX, pinIconPath } from './mapPinIcons';

// ─── Controles estéticos ───

/**
 * Ancho del pin en punta (el alto sale de la proporción de la forma). Las
 * discotecas van un poco más grandes: son el destino principal de la app.
 */
export const POINT_PIN_WIDTH = 38;
export const DISCOTECA_PIN_WIDTH = 44;
/** Alto / ancho de la forma del pin (viewBox 40×52). */
const PIN_ASPECT = 52 / 40;
/** Tamaño del ícono relativo al ancho del pin. */
const PIN_ICON_SCALE = 0.52;
const PIN_ICON_COLOR = '#ffffff';
const PIN_ICON_SHADOW = 'drop-shadow(0 1px 1.5px rgba(0,0,0,.4))';

/**
 * Forma del pin (viewBox 0 0 40 52): cabeza redonda que cae en punta, la
 * misma silueta que el isotipo. El centro de la cabeza está en (20,20).
 */
const PIN_SHAPE_PATH =
  'M20 1.5C30.2 1.5 38.5 9.8 38.5 20c0 9.6-7.4 17.6-15.6 28.6a3.6 3.6 0 0 1-5.8 0C8.9 37.6 1.5 29.6 1.5 20 1.5 9.8 9.8 1.5 20 1.5Z';

/** Trazo blanco alrededor del pin: lo despega del mapa oscuro. */
const PIN_STROKE_OPACITY = 0.9;
const PIN_STROKE_WIDTH = 2;
const PIN_STROKE_WIDTH_SELECTED = 3;

/**
 * Halo de neón del color de la categoría (alpha en hex sobre el color) +
 * sombra de contacto oscura. El halo es lo que hace que el pin se lea
 * "vivo/flúor" sobre el mapa oscuro en vez de apagado.
 */
const PIN_GLOW_ALPHA = 'B3';
const PIN_GLOW_ALPHA_SELECTED = 'FF';
const PIN_CONTACT_SHADOW = 'drop-shadow(0 3px 4px rgba(0,0,0,.55))';

const PIN_SELECTED_SCALE = 1.12;
const EVENT_PIN_SELECTED_SCALE = 1.06;

/** Ancho del pin cuando muestra la foto del evento (grande, a su forma natural, sin redondear). */
const EVENT_PIN_IMAGE_WIDTH = 100;
const EVENT_PIN_POINTER_HEIGHT = 10;

// ─── Helpers ───

/**
 * Color "de arriba" del degradado del pin: el tono vecino más cálido de la
 * paleta (como el isotipo, que va de cálido arriba-derecha a frío
 * abajo-izquierda). Si el color no es de una categoría conocida, sin
 * degradado.
 */
function pinHighlight(color: string): string {
  const categoria = (
    Object.keys(CATEGORY_COLORS) as (keyof typeof CATEGORY_COLORS)[]
  ).find((key) => CATEGORY_COLORS[key].toLowerCase() === color.toLowerCase());
  return categoria ? CATEGORY_PIN_HIGHLIGHT[categoria] : color;
}

/** Badge de alerta activa (estilo Waze), pegado a la esquina superior-izquierda del pin. */
const ALERT_BADGE_HTML = `<div style="position:absolute;top:-2px;left:-4px;width:15px;height:15px;border-radius:50%;background:${colors.warning};border:2px solid ${colors.background};box-shadow:0 0 0 1px rgba(0,0,0,.35);"></div>`;

interface CategoryPinOptions {
  color: string;
  /** Categoría para elegir ícono (`mapPinIcons.ts`); si no hay uno, se usa `fallbackEmoji`. */
  kind?: string;
  fallbackEmoji?: string;
  width: number;
  selected?: boolean;
  hasAlerts?: boolean;
  /** Halo de neón del color de la categoría (solo discotecas; el resto va sin halo). */
  glow?: boolean;
}

/**
 * Pin en punta de una categoría: relleno opaco con degradado de la paleta,
 * trazo blanco, halo de neón del color e ícono blanco en la cabeza.
 */
function categoryPinBodyHtml({
  color,
  kind,
  fallbackEmoji = '📍',
  width,
  selected = false,
  hasAlerts = false,
  glow: withGlow = false,
}: CategoryPinOptions): string {
  const height = Math.round(width * PIN_ASPECT);
  const iconSize = Math.round(width * PIN_ICON_SCALE);
  // Un id por color: pines del mismo color comparten definición, así que
  // que el id se repita en el documento no cambia lo que se pinta.
  const gradientId = `salimos-pin-${color.replace('#', '')}`;
  const glow = withGlow
    ? `drop-shadow(0 0 ${Math.round(width / 6)}px ${color}${selected ? PIN_GLOW_ALPHA_SELECTED : PIN_GLOW_ALPHA}) `
    : '';
  const path = pinIconPath(kind);
  const icon = path
    ? `<svg width="${iconSize}" height="${iconSize}" viewBox="${PIN_ICON_VIEWBOX}" style="display:block;filter:${PIN_ICON_SHADOW}"><path fill="${PIN_ICON_COLOR}" d="${path}"/></svg>`
    : `<span style="font-size:${Math.round(iconSize * 0.8)}px;line-height:1">${fallbackEmoji}</span>`;

  return (
    `<div style="position:relative;width:${width}px;height:${height}px;filter:${glow}${PIN_CONTACT_SHADOW};">` +
    `<svg width="${width}" height="${height}" viewBox="0 0 40 52" style="display:block;overflow:visible">` +
    `<defs><linearGradient id="${gradientId}" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pinHighlight(color)}"/><stop offset=".6" stop-color="${color}"/></linearGradient></defs>` +
    `<path d="${PIN_SHAPE_PATH}" fill="url(#${gradientId})" stroke="#ffffff" stroke-opacity="${selected ? 1 : PIN_STROKE_OPACITY}" stroke-width="${selected ? PIN_STROKE_WIDTH_SELECTED : PIN_STROKE_WIDTH}"/>` +
    `</svg>` +
    `<div style="position:absolute;left:0;right:0;top:${Math.round(width / 2 - iconSize / 2)}px;height:${iconSize}px;display:flex;align-items:center;justify-content:center;">${icon}</div>` +
    (hasAlerts ? ALERT_BADGE_HTML : '') +
    `</div>`
  );
}

// ─── Pines ───

/** Pin de punto genérico (taxi, bar, súper...). Se ancla por abajo (la punta). */
export function pointPinHtml(
  kind: string | undefined,
  fallbackEmoji: string | undefined,
  color: string | undefined,
): string {
  return `<div style="cursor:pointer;">${categoryPinBodyHtml({
    color: color ?? colors.backgroundCard,
    kind,
    fallbackEmoji,
    width: POINT_PIN_WIDTH,
  })}</div>`;
}

/** Etiqueta con el nombre, común a los dos diseños de pin de discoteca. */
function pinNameLabelHtml(
  nombre: string,
  color: string,
  selected: boolean,
): string {
  return (
    `<div style="max-width:132px;background:${colors.backgroundCard}F5;border:1px solid ${selected ? color : colors.borderLight};border-radius:8px;padding:1px 6px;margin-bottom:3px;box-shadow:0 4px 10px rgba(0,0,0,.4)${selected ? `, 0 0 0 3px ${color}40` : ''};">` +
    `<span style="display:block;color:#ffffff;font-size:10.5px;font-weight:${PIN_LABEL_FONT_WEIGHT};letter-spacing:.4px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:${MAP_FONT_FAMILY};">${nombre}</span>` +
    `</div>`
  );
}

export interface DiscotecaPinData {
  nombre: string;
  color: string;
  selected: boolean;
  hasAlerts: boolean;
  eventImage?: string | null;
}

/**
 * Pin de discoteca: si hay foto del evento del día, esa foto ES el pin (a su
 * forma natural, sin recortar ni redondear); si no, pin en punta con el
 * ícono de discoteca. Se ancla por abajo.
 *
 * El nodo raíz es el que se le pasa a `maplibregl.Marker({element})`, y
 * MapLibre reescribe su `transform` en cada frame para seguir el mapa — si
 * ese mismo nodo tuviera además una `transition: transform` propia (para el
 * efecto de "seleccionado"), el navegador animaría también esos cambios de
 * posición y el pin se quedaría a medio camino del mapa mientras arrastras.
 * Por eso el escalado va en un `<div>` interior aparte.
 */
export function discotecaPinHtml({
  nombre,
  color,
  selected,
  hasAlerts,
  eventImage,
}: DiscotecaPinData): string {
  const scale = selected
    ? eventImage
      ? EVENT_PIN_SELECTED_SCALE
      : PIN_SELECTED_SCALE
    : 1;
  const body = eventImage
    ? `<div style="position:relative;width:${EVENT_PIN_IMAGE_WIDTH}px;filter:drop-shadow(0 0 8px ${color}${PIN_GLOW_ALPHA}) ${PIN_CONTACT_SHADOW};">` +
      `<img src="${eventImage}" style="display:block;width:${EVENT_PIN_IMAGE_WIDTH}px;height:auto;border:3px solid ${selected ? '#ffffff' : color};box-sizing:border-box;" />` +
      `<div style="width:0;height:0;margin:0 auto;border-left:8px solid transparent;border-right:8px solid transparent;border-top:${EVENT_PIN_POINTER_HEIGHT}px solid ${selected ? '#ffffff' : color};"></div>` +
      (hasAlerts ? ALERT_BADGE_HTML : '') +
      `</div>`
    : categoryPinBodyHtml({
        color,
        kind: 'discoteca',
        width: DISCOTECA_PIN_WIDTH,
        glow: true,
        selected,
        hasAlerts,
      });

  return (
    `<div style="width:140px;cursor:pointer;">` +
    `<div style="display:flex;flex-direction:column;align-items:center;transform:scale(${scale});transform-origin:50% 100%;transition:transform .15s ease;">` +
    pinNameLabelHtml(nombre, color, selected) +
    body +
    `</div></div>`
  );
}

/** A partir de cuántos puntos el cluster pasa a tamaño mediano / grande. */
export const CLUSTER_SIZE_THRESHOLDS = [10, 25] as const;

/**
 * Cluster (grupo de puntos comprimidos al alejar el mapa): círculo oscuro
 * con anillo del degradado de marca (mismo recorrido que el isotipo) y halo.
 */
export function clusterPinHtml(
  count: number,
  label: string = String(count),
): string {
  const [medium, large] = CLUSTER_SIZE_THRESHOLDS;
  const size = count < medium ? 38 : count < large ? 46 : 54;
  const fontSize = count < medium ? 13 : count < large ? 14.5 : 16;
  return (
    `<div style="width:${size}px;height:${size}px;border-radius:50%;padding:3px;box-sizing:border-box;cursor:pointer;` +
    `background:linear-gradient(45deg, ${CATEGORY_COLORS.discoteca}, ${CATEGORY_COLORS.bar}, ${CATEGORY_COLORS.supermercado}, ${CATEGORY_COLORS.taxi});` +
    `box-shadow:0 0 12px ${CATEGORY_COLORS.bar}99, 0 6px 14px rgba(0,0,0,.5);">` +
    `<div style="width:100%;height:100%;border-radius:50%;background:${colors.backgroundCard};display:flex;align-items:center;justify-content:center;color:#ffffff;font-weight:${PIN_ACCENT_FONT_WEIGHT};font-size:${fontSize}px;font-family:${MAP_FONT_FAMILY};">${label}</div>` +
    `</div>`
  );
}
