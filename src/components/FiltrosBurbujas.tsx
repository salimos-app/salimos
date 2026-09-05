import React, { useEffect, useState } from 'react';
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Text from './Text';
import PinIcon from './PinIcon';
import { colors } from '../theme/colors';
import { PinIconKind } from '../theme/mapPinIcons';

export interface FiltroOpcion {
  id: string;
  icon: string;
  /** Ícono del botón — mismo set que los pines del mapa (`PinIcon`). */
  iconKind: PinIconKind;
  label: string;
  /** Color de acento del botón, a juego con los pines del mapa (`CATEGORY_COLORS`). */
  color: string;
}

interface Props {
  opciones: FiltroOpcion[];
  /** Se llama al tocar un botón (id de la categoría elegida). Cierra el desplegable. */
  onSelect: (id: string) => void;
  /** Se llama al tocar el hub mientras el desplegable ya está abierto (lo cierra). */
  onCollapse: () => void;
}

const LOGO = require('../../assets/isotipo.png');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Controles estéticos (todo lo tocable para ajustar look & feel vive acá) ───

// Fondo detrás del desplegable: oscurece + desenfoca el mapa al abrir, para
// dar contraste. La intensidad del blur queda fija (no animada): `expo-blur`
// solo re-computa su blur en cada render con el número que reciba, así que
// animarla junto al fade de apertura no da un resultado fiable multiplataforma.
const SCRIM_COLOR = colors.background;
const SCRIM_MAX_OPACITY = 0.6;
const SCRIM_BLUR_INTENSITY = 40;

// Hub (el pin central con el logo).
const HUB_SIZE = 96;
const HUB_BORDER_WIDTH = 3;
/** Opacidad del fondo del hub, sufijo hex de alpha. */
const HUB_BACKGROUND_ALPHA = 'F5';
const LOGO_SIZE = 62;

// DEBUG: botones del desplegable (taxi/súper/bar/discoteca) — todo este
// bloque sigue en iteración, ninguno de estos valores está cerrado todavía
// (ver CLAUDE.md → Decisiones de diseño → "Botones del hub").
const BUTTON_HEIGHT = 35;
/** Ancho del contenedor de cada botón (fija dónde se alinean a la izquierda) y tope de ancho del botón mismo. */
const BUTTON_MAX_WIDTH = 200;
const BUTTON_BORDER_RADIUS = 5;
const BUTTON_BORDER_WIDTH = 1.5;
const BUTTON_PADDING_HORIZONTAL = 10;
const BUTTON_ELEVATION = 4;
/** Tamaño del ícono dentro del botón, y separación entre ícono y label. */
const BUTTON_ICON_SIZE = 24;
const BUTTON_ICON_LABEL_GAP = 3;
/** Color del ícono (default de `PinIcon` es blanco; tocar acá para probar otro). */
const BUTTON_ICON_COLOR = '#ffffff';

// DEBUG: trazo del botón (borde + contorno extra). Blanco fijo por ahora;
// probamos antes una variante "mismo color del botón, más oscuro" vía
// `darkenHex(opcion.color, 0.35)` (helper en `theme/colors.ts`) — se puede
// retomar esa idea más adelante si hace falta.
const BUTTON_STROKE_COLOR = '#ffffff';

// DEBUG: sombra y contorno extra del botón, todavía comentados en
// `styles.boton` más abajo (sin efecto hasta descomentarlos ahí) — no
// confundir "comentado" con "DEBUG": la marca DEBUG es por estar en draft,
// no por estar activo o no.
/* eslint-disable @typescript-eslint/no-unused-vars */
const BUTTON_OUTLINE_WIDTH = 1;
const BUTTON_SHADOW_COLOR = colors.shadow;
const BUTTON_SHADOW_OFFSET = { width: 0, height: 3 };
const BUTTON_SHADOW_OPACITY = 0.35;
const BUTTON_SHADOW_RADIUS = 6;
/* eslint-enable @typescript-eslint/no-unused-vars */

/** Distancia del centro del hub al primer botón, y separación entre botones consecutivos. */
const BASE_OFFSET = 84;
const STEP = 50;

/**
 * El logo (un pin con forma de interrogación) hace de hub: al tocarlo la
 * primera vez despliega las categorías en una columna recta hacia arriba
 * (no en abanico). Tocar una categoría abre su listado/mejor opción
 * (gestionado por el padre vía `onSelect`) y cierra el desplegable. Tocar el
 * hub de nuevo mientras está abierto lo cierra y dispara `onCollapse`
 * (el padre usa esto para montar el plan de la noche).
 */
export default function FiltrosBurbujas({ opciones, onSelect, onCollapse }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [progreso] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const anim = Animated.timing(progreso, {
      toValue: abierto ? 1 : 0,
      duration: abierto ? 320 : 200,
      easing: abierto ? Easing.out(Easing.back(1.6)) : Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    anim.start();
    return () => anim.stop();
  }, [abierto, progreso]);

  // Columna recta hacia arriba: cada botón se apila directamente encima del
  // anterior (sin desplazamiento horizontal), el más cercano al hub primero
  // — el orden de `opciones` es el orden de una salida (taxi → súper → bar →
  // discoteca, ver App.tsx `FILTROS`).
  const posiciones = opciones.map((_, i) => ({ dx: 0, dy: -(BASE_OFFSET + i * STEP) }));

  const handleHubPress = () => {
    setAbierto((previo) => {
      const siguiente = !previo;
      if (previo && !siguiente) onCollapse();
      return siguiente;
    });
  };

  const handleBubblePress = (id: string) => {
    setAbierto(false);
    onSelect(id);
  };

  return (
    <View style={styles.capa} pointerEvents="box-none">
      <AnimatedPressable
        style={[
          styles.scrim,
          { opacity: progreso.interpolate({ inputRange: [0, 1], outputRange: [0, SCRIM_MAX_OPACITY] }) },
        ]}
        pointerEvents={abierto ? 'auto' : 'none'}
        onPress={() => setAbierto(false)}
      >
        <BlurView intensity={SCRIM_BLUR_INTENSITY} tint="dark" style={styles.scrimBlur} />
      </AnimatedPressable>

      <View style={styles.ancla} pointerEvents="box-none">
        <View style={styles.hubWrap} pointerEvents="box-none">
          {opciones.map((opcion, i) => {
            const { dx, dy } = posiciones[i];
            const translateX = progreso.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
            const translateY = progreso.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
            return (
              <Animated.View
                key={opcion.id}
                style={[
                  styles.botonWrap,
                  { opacity: progreso, transform: [{ translateX }, { translateY }, { scale: progreso }] },
                ]}
                pointerEvents={abierto ? 'auto' : 'none'}
              >
                <Pressable
                  onPress={() => handleBubblePress(opcion.id)}
                  style={[styles.boton, { backgroundColor: opcion.color }]}
                >
                  <PinIcon kind={opcion.iconKind} size={BUTTON_ICON_SIZE} color={BUTTON_ICON_COLOR} />
                  <Text variant="subheading" style={styles.botonLabel} numberOfLines={1}>
                    {opcion.label}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}

          <Pressable
            onPress={handleHubPress}
            style={styles.hub}
            accessibilityRole="button"
            accessibilityLabel="Menú de categorías"
          >
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  capa: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: SCRIM_COLOR,
  },
  scrimBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ancla: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hubWrap: {
    width: HUB_SIZE,
    height: HUB_SIZE,
  },
  hub: {
    width: HUB_SIZE,
    height: HUB_SIZE,
    borderRadius: HUB_SIZE / 2,
    borderWidth: HUB_BORDER_WIDTH,
    borderColor: colors.border,
    backgroundColor: colors.background + HUB_BACKGROUND_ALPHA,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  botonWrap: {
    position: 'absolute',
    left: HUB_SIZE / 2 - BUTTON_MAX_WIDTH / 2,
    top: HUB_SIZE / 2 - BUTTON_HEIGHT / 2,
    width: BUTTON_MAX_WIDTH,
    alignItems: 'center',
  },
  boton: {
    height: BUTTON_HEIGHT,
    maxWidth: BUTTON_MAX_WIDTH,
    paddingHorizontal: BUTTON_PADDING_HORIZONTAL,
    borderRadius: BUTTON_BORDER_RADIUS,
    borderWidth: BUTTON_BORDER_WIDTH,
    borderColor: BUTTON_STROKE_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    gap: BUTTON_ICON_LABEL_GAP,
    elevation: BUTTON_ELEVATION,
    // DEBUG: sombra propia del botón — comentada por ahora, descomentar para probarla.
    // shadowColor: BUTTON_SHADOW_COLOR,
    // shadowOffset: BUTTON_SHADOW_OFFSET,
    // shadowOpacity: BUTTON_SHADOW_OPACITY,
    // shadowRadius: BUTTON_SHADOW_RADIUS,
    // DEBUG: contorno extra, aparte del borderWidth ya activo — comentado por ahora, descomentar para probarlo.
    // outlineWidth: BUTTON_OUTLINE_WIDTH,
    // outlineColor: BUTTON_STROKE_COLOR,
    // outlineStyle: 'solid',
  },
  botonLabel: {
    color: '#ffffff',
  },
});
