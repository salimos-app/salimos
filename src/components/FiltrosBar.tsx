import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
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

/** Barra de chips para mostrar/ocultar categorías de marcadores en el mapa. */
export default function FiltrosBar({ opciones, activos, onToggle }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {opciones.map((opcion) => {
        const activo = activos[opcion.id] ?? true;
        return (
          <TouchableOpacity
            key={opcion.id}
            style={[
              styles.chip,
              activo
                ? { backgroundColor: opcion.color + '26', borderColor: opcion.color }
                : styles.chipInactivo,
            ]}
            onPress={() => onToggle(opcion.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, { color: activo ? opcion.color : colors.textMuted }]}>
              {opcion.icon} {opcion.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 114,
    left: 0,
    right: 0,
  },
  content: {
    paddingHorizontal: 16,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    marginRight: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  chipInactivo: {
    backgroundColor: colors.backgroundCard + 'CC',
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
