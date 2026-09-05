import { Text as RNText, TextProps } from 'react-native';
import { TEXT_VARIANTS, TextVariant } from '../theme/typography';

interface Props extends TextProps {
  /** Estilo semántico de la escala tipográfica (ver `TEXT_VARIANTS`). Default: `body`. */
  variant?: TextVariant;
}

/**
 * Reemplazo drop-in del `Text` de RN: en vez de que cada callsite declare su
 * propio `fontSize`/`fontWeight`, elige uno de los estilos con nombre de la
 * escala (`variant`). El `style` que pasa el caller es para color, spacing y
 * alineación — nunca debería traer `fontSize`/`fontWeight`/`fontFamily`
 * (si hace falta, gana igual por ir después en el array, pero es la
 * excepción, no la norma: úsalo solo para glifos/iconos como emojis o el
 * avatar de una letra, nunca para texto de lectura).
 */
export default function Text({ variant = 'body', style, ...props }: Props) {
  const { fontFamily, fontSize, lineHeight, maxFontSizeMultiplier } = TEXT_VARIANTS[variant];

  return (
    <RNText
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...props}
      style={[{ fontFamily, fontSize, lineHeight }, style]}
    />
  );
}
