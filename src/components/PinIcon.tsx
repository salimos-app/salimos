import Svg, { Path } from 'react-native-svg';
import { PIN_ICON_VIEWBOX, PinIconKind, pinIconPath } from '../theme/mapPinIcons';

interface Props {
  kind: PinIconKind;
  size?: number;
  color?: string;
}

/**
 * Mismo set de íconos que los pines del mapa (`theme/mapPinIcons.ts`), pero
 * como componente de React Native real — para UI que sí vive en el árbol de
 * RN (a diferencia de los pines, que MapLibre pinta como HTML/DOM plano).
 */
export default function PinIcon({ kind, size = 20, color = '#ffffff' }: Props) {
  const d = pinIconPath(kind);
  if (!d) return null;

  return (
    <Svg width={size} height={size} viewBox={PIN_ICON_VIEWBOX}>
      <Path d={d} fill={color} />
    </Svg>
  );
}
