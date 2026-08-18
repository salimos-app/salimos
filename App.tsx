import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { colors } from './src/theme/colors';
import { discotecas } from './src/data/discotecas';
import { Discoteca } from './src/types/discoteca';
import { MapViewComponent, MarkerComponent } from './src/components/MapView';
import DiscotecaMarker from './src/components/DiscotecaMarker';
import EventosScreen from './src/screens/EventosScreen';
import { fetchDiscotecaCoordinates, DiscotecaCoordinates } from './src/services/eventosApi';

const banana: Discoteca = discotecas.find((d) => d.slug === 'banana') ?? discotecas[0];
const guateque: Discoteca = discotecas.find((d) => d.slug === 'guateque') ?? discotecas[1];

// Coordenadas locales por defecto (fallback inmediato si la API no responde)
const defaultBananaCoords: DiscotecaCoordinates = {
  latitude: banana.latitud,
  longitude: banana.longitud,
  nombre: banana.nombre,
  direccion: banana.direccion,
};
const defaultGuatequeCoords: DiscotecaCoordinates = {
  latitude: guateque.latitud,
  longitude: guateque.longitud,
  nombre: guateque.nombre,
  direccion: guateque.direccion,
};

export default function App() {
  const [selectedMarkerSlug, setSelectedMarkerSlug] = useState<string | null>(null);
  const [selectedDiscoteca, setSelectedDiscoteca] = useState<Discoteca | null>(null);
  // Inicializa con los datos locales para que la app se muestre al instante
  const [bananaCoords, setBananaCoords] = useState<DiscotecaCoordinates>(defaultBananaCoords);
  const [guatequeCoords, setGuatequeCoords] = useState<DiscotecaCoordinates>(defaultGuatequeCoords);
  const [loading, setLoading] = useState(false);

  const selectedClub = selectedMarkerSlug
    ? discotecas.find((discoteca) => discoteca.slug === selectedMarkerSlug) ?? null
    : null;

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const loadCoordinates = async () => {
      try {
        // Timeout de 5 segundos máximo para no bloquear la pantalla
        timeoutId = setTimeout(() => {
          if (mounted) setLoading(false);
        }, 5000);

        const [bananaData, guatequeData] = await Promise.all([
          fetchDiscotecaCoordinates('banana'),
          fetchDiscotecaCoordinates('guateque'),
        ]);
        if (mounted) {
          setBananaCoords(bananaData);
          setGuatequeCoords(guatequeData);
        }
      } catch (error) {
        console.warn('Error cargando coordenadas (usando datos locales):', error);
        // Ya están los datos locales por defecto
      } finally {
        if (mounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    loadCoordinates();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const handleBack = () => {
    setSelectedDiscoteca(null);
    setSelectedMarkerSlug(null);
  };

  const handleMarkerPress = (discoteca: Discoteca) => {
    setSelectedMarkerSlug(discoteca.slug);
    setSelectedDiscoteca(null);
  };

  const handleMapPress = () => {
    setSelectedMarkerSlug(null);
    setSelectedDiscoteca(null);
  };

  const openEventos = (discoteca: Discoteca) => {
    setSelectedDiscoteca(discoteca);
  };

  if (selectedDiscoteca) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <EventosScreen discoteca={selectedDiscoteca} onBack={handleBack} />
      </View>
    );
  }

  if (loading || !bananaCoords) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.neonPink} />
        <Text style={styles.loadingText}>Cargando discotecas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.mapContainer}>
        <MapViewComponent
          style={styles.map}
          initialRegion={{
            latitude: bananaCoords.latitude,
            longitude: bananaCoords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          region={{
            latitude: bananaCoords.latitude,
            longitude: bananaCoords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPress={handleMapPress}
        >
          <MarkerComponent
            coordinate={{
              latitude: bananaCoords.latitude,
              longitude: bananaCoords.longitude,
            }}
            discoteca={banana}
            title={banana.nombre}
            tracksViewChanges={false}
            selected={selectedMarkerSlug === banana.slug}
            onPress={() => handleMarkerPress(banana)}
          >
            <DiscotecaMarker nombre={banana.nombre} color={banana.color} selected={selectedMarkerSlug === banana.slug} />
          </MarkerComponent>

          {guatequeCoords && (
            <MarkerComponent
              coordinate={{
                latitude: guatequeCoords.latitude,
                longitude: guatequeCoords.longitude,
              }}
              discoteca={guateque}
              title={guateque.nombre}
              tracksViewChanges={false}
              selected={selectedMarkerSlug === guateque.slug}
              onPress={() => handleMarkerPress(guateque)}
            >
              <DiscotecaMarker nombre={guateque.nombre} color={guateque.color} selected={selectedMarkerSlug === guateque.slug} />
            </MarkerComponent>
          )}
        </MapViewComponent>
      </View>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>NIGHTSPOT</Text>
        <Text style={styles.headerSubtitle}>El Puerto de Santa María</Text>
      </View>

      {selectedClub && (
        <View style={styles.card}>
          <Image source={{ uri: selectedClub.imagen }} style={styles.image} />
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardNombre}>{selectedClub.nombre}</Text>
              <View style={[styles.ratingBadge, { backgroundColor: colors.neonYellow + '22' }]}>
                <Text style={[styles.ratingText, { color: colors.neonYellow }]}>⭐ {selectedClub.rating.toFixed(1)}</Text>
              </View>
            </View>

            <Text style={styles.direccion}>{selectedClub.direccion}</Text>

            <View style={styles.tags}>
              <View style={[styles.tag, { backgroundColor: selectedClub.color + '22' }]}>
                <Text style={[styles.tagText, { color: selectedClub.color }]}>{selectedClub.genero}</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: colors.neonGreen + '22' }]}>
                <Text style={[styles.tagText, { color: colors.neonGreen }]}>💶 {selectedClub.precioEntrada}€</Text>
              </View>
            </View>

            <Text style={styles.horario}>🕐 {selectedClub.horario}</Text>
            <Text style={styles.descripcion} numberOfLines={2}>{selectedClub.descripcion}</Text>

            <TouchableOpacity style={styles.eventosButton} onPress={() => openEventos(selectedClub)}>
              <Text style={styles.eventosButtonText}>📅 Ver próximos eventos</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 16,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: colors.shadow,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
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
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardNombre: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
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
    marginBottom: 12,
  },
  eventosButton: {
    backgroundColor: colors.neonPink,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  eventosButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: 'bold',
  },
});