import React, { useEffect, useState } from 'react';
import { Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

export interface FiltroOpcion {
  id: string;
  icon: string;
  label: string;
  /** Color de acento cuando el filtro está activo (a juego con los pines del mapa). */
  color: string;
}

interface Props {
  opciones: FiltroOpcion[];
  activos: Record<string, boolean>;
  onToggle: (id: string) => void;
}

const LOGO = require('../../assets/isotipo.png');

const HUB_SIZE = 96;
const LOGO_SIZE = 62;
const BUBBLE_SIZE = 52;
const RADIO = 108;

/**
 * Sustituye a la vieja barra de filtros + cabecera "SALIMOS": ahora sólo hay
 * el logo dentro de un círculo gris, centrado arriba. Al tocarlo se despliega
 * y los filtros salen como pompas en abanico hacia abajo; cada pompa
 * muestra/oculta su categoría de marcadores en el mapa.
 */
export default function FiltrosBurbujas({ opciones, activos, onToggle }: Props) {
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

  // Cada pompa sale en abanico hacia arriba (0 = recto hacia arriba), repartidas
  // simétricamente según cuántos filtros haya (el hub va pegado abajo en medio).
  const n = opciones.length;
  const posiciones = opciones.map((_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const angulo = (-55 + 110 * t) * (Math.PI / 180);
    return { dx: Math.sin(angulo) * RADIO, dy: -Math.cos(angulo) * RADIO };
  });

  return (
    <View style={styles.capa} pointerEvents="box-none">
      {abierto && <Pressable style={StyleSheet.absoluteFill} onPress={() => setAbierto(false)} />}

      <View style={styles.ancla} pointerEvents="box-none">
        <View style={styles.hubWrap} pointerEvents="box-none">
          {opciones.map((opcion, i) => {
            const activo = activos[opcion.id] ?? true;
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
                  onPress={() => onToggle(opcion.id)}
                  style={[
                    styles.bubble,
                    activo
                      ? { backgroundColor: opcion.color + '26', borderColor: opcion.color }
                      : styles.bubbleInactiva,
                  ]}
                >
                  <Text style={styles.bubbleIcon}>{opcion.icon}</Text>
                </Pressable>
                <Text
                  style={[styles.bubbleLabel, { color: activo ? opcion.color : colors.textMuted }]}
                  numberOfLines={1}
                >
                  {opcion.label}
                </Text>
              </Animated.View>
            );
          })}

          <Pressable
            onPress={() => setAbierto((v) => !v)}
            style={styles.hub}
            accessibilityRole="button"
            accessibilityLabel="Filtros del mapa"
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
  bubbleInactiva: {
    backgroundColor: colors.backgroundCard + 'F0',
    borderColor: colors.border,
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
