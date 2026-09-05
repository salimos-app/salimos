import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Text from './Text';
import { colors } from '../theme/colors';
import DiscotecasListView from './DiscotecasListView';
import { SimpleMapPoint } from './MapView';
import { LatLngLike } from '../utils/geo';

interface Props {
  titulo: string;
  points: SimpleMapPoint[];
  userLocation: LatLngLike | null;
  onClose: () => void;
  onSelectPoint: (point: SimpleMapPoint) => void;
}

/**
 * Listado por cercanía de una sola categoría (bares, súper o taxis), que se
 * abre al tocar su burbuja en el hub del mapa (ver FiltrosBurbujas). Reusa
 * `DiscotecasListView` sin discotecas (esa categoría se resuelve aparte,
 * directo a la mejor valorada — ver App.tsx `handleBubbleSelect`).
 */
export default function CategoriaCercaniaOverlay({ titulo, points, userLocation, onClose, onSelectPoint }: Props) {
  return (
    <View style={styles.overlay}>
      <View style={styles.header}>
        <Text variant="heading" style={styles.titulo}>{titulo}</Text>
        <TouchableOpacity onPress={onClose} style={styles.close}>
          <Text variant="label" style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
      <DiscotecasListView
        discotecas={[]}
        mostrarDiscotecas={false}
        coordsBySlug={{}}
        eventImageBySlug={{}}
        alertsBySlug={{}}
        points={points}
        userLocation={userLocation}
        onSelectDiscoteca={() => {}}
        onSelectPoint={onSelectPoint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 56,
    left: 12,
    right: 12,
    bottom: 120,
    backgroundColor: colors.background + 'F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  titulo: {
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  close: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundLight,
  },
  closeText: {
    color: colors.textSecondary,
  },
});
