import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  nombre: string;
  color: string;
  selected?: boolean;
}

export default function DiscotecaMarker({ nombre, color, selected = false }: Props) {
  const firstLetter = nombre ? nombre[0].toUpperCase() : '?';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.pin,
          { backgroundColor: color, borderColor: selected ? colors.textPrimary : color },
          selected && styles.pinSelected,
        ]}
      >
        <View style={styles.pinInner}>
          <Text style={styles.markerIcon}>{firstLetter}</Text>
        </View>
        <View
          style={[
            styles.pinTail,
            { backgroundColor: color, borderColor: selected ? colors.textPrimary : color },
          ]}
        />
      </View>
      {selected && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText} numberOfLines={1}>
            {nombre}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 6,
  },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'visible',
  },
  pinSelected: {
    transform: [{ scale: 1.18 }],
    borderWidth: 3,
  },
  pinInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerIcon: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  pinTail: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderWidth: 2,
    borderRadius: 3,
    bottom: -7,
    left: 9,
    transform: [{ rotate: '45deg' }],
  },
  tooltip: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 150,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  tooltipText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
});