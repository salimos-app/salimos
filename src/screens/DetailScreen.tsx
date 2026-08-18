import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Discoteca } from '../types/discoteca';
import { colors } from '../theme/colors';

interface Props {
  discoteca: Discoteca;
  onBack: () => void;
}

export default function DetailScreen({ discoteca, onBack }: Props) {
  const openMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${discoteca.latitud},${discoteca.longitud}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: discoteca.imagen }} style={styles.image} />
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.nombre}>{discoteca.nombre}</Text>
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

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Información</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🕐 Horario</Text>
              <Text style={styles.infoValue}>{discoteca.horario}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🎵 Género</Text>
              <Text style={styles.infoValue}>{discoteca.genero}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>💶 Entrada</Text>
              <Text style={styles.infoValue}>{discoteca.precioEntrada}€</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>⭐ Rating</Text>
              <Text style={styles.infoValue}>{discoteca.rating.toFixed(1)} / 5.0</Text>
            </View>
          </View>

          <View style={styles.descriptionCard}>
            <Text style={styles.infoTitle}>Descripción</Text>
            <Text style={styles.description}>{discoteca.descripcion}</Text>
          </View>

          <TouchableOpacity style={styles.mapsButton} onPress={openMaps}>
            <Text style={styles.mapsButtonText}>🗺️ Ver en Google Maps</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 250,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backText: {
    color: colors.textPrimary,
    fontSize: 20,
  },
  content: {
    padding: 20,
  },
  nombre: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  direccion: {
    color: colors.textSecondary,
    fontSize: 15,
    marginBottom: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  mapsButton: {
    backgroundColor: colors.neonPink,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  mapsButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});