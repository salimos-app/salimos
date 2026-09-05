/**
 * Tipografía de los pines del mapa (nombre sobre el pin, inicial, contador
 * de cluster). MapLibre GL pinta los pines como HTML/DOM plano fuera del
 * árbol de React Native (en web, directo en el `document`; en nativo,
 * dentro de un WebView con su propio runtime aislado) — no puede usar el
 * `Text`/`TEXT_VARIANTS` de la app. Cargamos Sora vía Google Fonts (URL
 * pública) en vez de las fuentes registradas por `expo-font`: es una
 * familia real con `font-weight` real por archivo, así que un solo
 * `font-family` alcanza para los dos pesos que usan los pines.
 */
export const MAP_FONT_STYLESHEET_URL =
  'https://fonts.googleapis.com/css2?family=Sora:wght@600;800&display=swap';
// Sin comillas alrededor de "Sora" a propósito: no hace falta (es una sola
// palabra) y este valor se interpola tal cual dentro de un string ya
// entrecomillado en más de un lugar (ver `MapView.tsx`) — comillas extra ahí
// romperían ese string.
export const MAP_FONT_FAMILY = 'Sora, -apple-system, system-ui, sans-serif';

/** Nombre del local sobre el pin — mismo peso que `label` en `typography.ts`. */
export const PIN_LABEL_FONT_WEIGHT = 600;
/** Inicial del pin y contador de cluster — mismo peso que `heading`/`display`. */
export const PIN_ACCENT_FONT_WEIGHT = 800;

/**
 * Relleno de los pines de categoría (taxi/bar/pub/súper/discoteca): un poco
 * de transparencia (~88%) en vez de color sólido, para que no tapen del
 * todo el mapa debajo. Sufijo de alpha en hex, se concatena al color de la
 * categoría (`CATEGORY_COLORS`).
 */
export const PIN_FILL_ALPHA = 'E0';

/**
 * Contraste del ícono contra el relleno translúcido de la categoría:
 * blanco (funciona sobre cualquier color de la paleta) + una sombra sutil a
 * modo de trazo, en vez de un color de ícono distinto por categoría.
 */
export const PIN_ICON_COLOR = '#ffffff';
export const PIN_ICON_DROP_SHADOW = 'drop-shadow(0 1px 2px rgba(0,0,0,.55))';
