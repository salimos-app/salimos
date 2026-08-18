import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Discoteca } from '../types/discoteca';
import { colors } from '../theme/colors';

interface Props {
  discoteca: Discoteca;
  onClose: () => void;
}

export default function DiscotecaCard({ discoteca, onClose }: Props) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: discoteca.imagen }} style={styles.image} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.nombre}>{discoteca.nombre}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.direccion}>{discoteca.direccion}</Text>

        <View style={styles.tags}>
          <View style={[styles.tag, { backgroundColor: discoteca.color + '22' }]}>
            <Text style={[styles.tagText, { color: discoteca.color }]}>{discoteca.genero}</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: colors.neonYellow + '22' }]}>
            <Text style={[styles.tagText, { color: colors.neonYellow }]}>
              ⭐ {discoteca.rating.toFixed(1)}
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: colors.neonGreen + '22' }]}>
            <Text style={[styles.tagText, { color: colors.neonGreen }]}>
              💶 {discoteca.precioEntrada}€
            </Text>
          </View>
        </View>

        <Text style={styles.horario}>🕐 {discoteca.horario}</Text>
        <Text style={styles.descripcion} numberOfLines={2}>
          {discoteca.descripcion}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  image: {
    width: '100%',
    height: 120,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nombre: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  direccion: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  horario: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  descripcion: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});