import { Sora_400Regular, Sora_600SemiBold, Sora_800ExtraBold } from '@expo-google-fonts/sora';

/**
 * Toda la app usa una única tipografía (Sora) con solo 3 weights: el resto
 * de la jerarquía (tamaño, line-height) vive en `TEXT_VARIANTS` de abajo.
 * Restringir los weights a 3 evita que cada componente reinvente su propio
 * peso "a ojo" — ExtraBold queda reservado para lo que de verdad debe
 * destacar (headings, CTAs, el número grande), no para cualquier texto que
 * quiera un poco más de énfasis.
 */
export const FONT = {
  regular: 'Sora_400Regular',
  semiBold: 'Sora_600SemiBold',
  extraBold: 'Sora_800ExtraBold',
} as const;

export const FONTS_TO_LOAD = {
  Sora_400Regular,
  Sora_600SemiBold,
  Sora_800ExtraBold,
};

export interface TextVariantStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  /**
   * Tope de autoescalado por accesibilidad (Configuración > Accesibilidad >
   * Tamaño de texto). Sin tope, un texto de 11px dentro de un badge de
   * 24px de alto puede desbordar su contenedor cuando el usuario pide letra
   * grande; los tamaños de cuerpo/lectura sí tienen margen para crecer más
   * libremente. Nunca deshabilitamos el autoescalado (`allowFontScaling`
   * sigue en su default `true`), solo lo acotamos donde el layout es rígido.
   */
  maxFontSizeMultiplier: number;
}

/**
 * Escala tipográfica de la app: un set reducido de estilos con nombre
 * (industria: display/heading/body/caption/button...) en vez de que cada
 * componente declare su propio `fontSize`+`fontWeight` sueltos. Cualquier
 * texto nuevo debería encajar en una de estas categorías; si de verdad hace
 * falta una nueva, se agrega acá, nunca como estilo suelto en el componente.
 */
export const TEXT_VARIANTS = {
  /** Números grandes destacados (ej. el día del mes en una fecha). */
  display: { fontFamily: FONT.extraBold, fontSize: 24, lineHeight: 29, maxFontSizeMultiplier: 1.6 },
  /** Título único por pantalla, modal o tarjeta (aparece una vez, no en listas repetidas). */
  heading: { fontFamily: FONT.extraBold, fontSize: 20, lineHeight: 25, maxFontSizeMultiplier: 1.6 },
  /** Énfasis secundario a tamaño de cuerpo (ej. una acción de "cancelar"). */
  subheading: { fontFamily: FONT.semiBold, fontSize: 16, lineHeight: 21, maxFontSizeMultiplier: 1.8 },
  /** Contenido principal: opciones, mensajes de estado (vacío/error) que son el foco de la pantalla. */
  body: { fontFamily: FONT.regular, fontSize: 16, lineHeight: 22, maxFontSizeMultiplier: 2 },
  /** Texto secundario inline: direcciones, subtítulos, descripciones cortas. */
  bodySmall: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 18, maxFontSizeMultiplier: 2 },
  /** Nombres en filas de lista, tags, distancias: texto compacto con algo de énfasis. */
  label: { fontFamily: FONT.semiBold, fontSize: 12, lineHeight: 17, maxFontSizeMultiplier: 1.6 },
  /** Badges, chips y pills diminutos. */
  caption: { fontFamily: FONT.semiBold, fontSize: 12, lineHeight: 14, maxFontSizeMultiplier: 1.4 },
  /** Texto de CTAs (botones rellenos/gradiente). */
  button: { fontFamily: FONT.semiBold, fontSize: 12, lineHeight: 19, maxFontSizeMultiplier: 1.5 },
} as const satisfies Record<string, TextVariantStyle>;

export type TextVariant = keyof typeof TEXT_VARIANTS;
