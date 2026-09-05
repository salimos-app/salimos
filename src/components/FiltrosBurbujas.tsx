import React, { useEffect, useState } from 'react';
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export interface FiltroOpcion {
  id: string;
  icon: string;
  label: string;
  /** Color de acento de la burbuja, a juego con los pines del mapa. */
  color: string;
}

interface Props {
  opciones: FiltroOpcion[];
  /** Se llama al tocar una burbuja (id de la categoría elegida). Cierra el abanico. */
  onSelect: (id: string) => void;
  /** Se llama al tocar el hub mientras el abanico ya está abierto (lo cierra). */
  onCollapse: () => void;
}

const LOGO = require('../../assets/isotipo.png');

const HUB_SIZE = 96;
const LOGO_SIZE = 62;
const BUBBLE_SIZE = 52;
/** Distancia del centro del hub a la primera burbuja, y separación entre burbujas consecutivas. */
const BASE_OFFSET = 78;
const STEP = 66;

/**
 * El logo (un pin con forma de interrogación) hace de hub: al tocarlo la
 * primera vez despliega las categorías en una columna recta hacia arriba
 * (no en abanico). Tocar una categoría abre su listado/mejor opción
 * (gestionado por el padre vía `onSelect`) y cierra el abanico. Tocar el
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

  // Columna recta hacia arriba: cada burbuja se apila directamente encima
  // de la anterior (sin desplazamiento horizontal), la más cercana al hub
  // primero.
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
      {abierto && <Pressable style={StyleSheet.absoluteFill} onPress={() => setAbierto(false)} />}

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
                  styles.bubbleWrap,
                  { opacity: progreso, transform: [{ translateX }, { translateY }, { scale: progreso }] },
                ]}
                pointerEvents={abierto ? 'auto' : 'none'}
              >
                <Pressable
                  onPress={() => handleBubblePress(opcion.id)}
                  style={[styles.bubble, { backgroundColor: opcion.color + '26', borderColor: opcion.color }]}
                >
                  <Text style={styles.bubbleIcon}>{opcion.icon}</Text>
                </Pressable>
                <Text style={[styles.bubbleLabel, { color: opcion.color }]} numberOfLines={1}>
                  {opcion.label}
                </Text>
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
    borderWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.background + 'F5',
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
  bubbleWrap: {
    position: 'absolute',
    left: HUB_SIZE / 2 - BUBBLE_SIZE / 2,
    top: HUB_SIZE / 2 - BUBBLE_SIZE / 2,
    width: BUBBLE_SIZE,
    alignItems: 'center',
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  bubbleIcon: {
    fontSize: 20,
  },
  bubbleLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
