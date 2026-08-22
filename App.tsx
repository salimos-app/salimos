import React, { useState, useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from './src/theme/colors';
import { discotecas } from './src/data/discotecas';
import { Discoteca } from './src/types/discoteca';
import { MapViewComponent, MarkerComponent, SimpleMapPoint } from './src/components/MapView';
import DiscotecaMarker from './src/components/DiscotecaMarker';
import EventosScreen from './src/screens/EventosScreen';
import AlertsPanel from './src/components/AlertsPanel';
import RoutePanel from './src/components/RoutePanel';
import PointCard from './src/components/PointCard';
import FiltrosBar, { FiltroOpcion } from './src/components/FiltrosBar';
import { useRoute } from './src/hooks/useRoute';
import { useDiscotecaAlerts } from './src/hooks/useDiscotecaAlerts';
import { fetchDiscotecaCoordinates, fetchProximosEventos, DiscotecaCoordinates } from './src/services/eventosApi';
import { paradasTaxi, RADIO_TAXI_NOMBRE, RADIO_TAXI_TELEFONO } from './src/data/taxis';
import { sitios } from './src/data/sitios';
import { SitioCategoria } from './src/types/sitio';

const banana: Discoteca = discotecas.find((d) => d.slug === 'banana') ?? discotecas[0];
const guateque: Discoteca = discotecas.find((d) => d.slug === 'guateque') ?? discotecas[1];

type FiltroCategoria = 'discotecas' | 'bares' | 'supermercados' | 'taxis';

const FILTROS: FiltroOpcion[] = [
  { id: 'discotecas', icon: '🪩', label: 'Discotecas', color: colors.neonPink },
  { id: 'bares', icon: '🍺', label: 'Bares', color: colors.neonPurple },
  { id: 'supermercados', icon: '🛒', label: 'Supermercados', color: colors.neonGreen },
  { id: 'taxis', icon: '🚕', label: 'Taxis', color: colors.neonYellow },
];

function filtroDe(point: SimpleMapPoint): FiltroCategoria {
  if (point.kind === 'taxi') return 'taxis';
  if (point.kind === 'bar' || point.kind === 'pub') return 'bares';
  return 'supermercados';
}

const taxiPoints: SimpleMapPoint[] = paradasTaxi.map((parada) => ({
  id: parada.id,
  latitude: parada.latitud,
  longitude: parada.longitud,
  label: parada.nombre,
  sublabel: 'Parada de taxi',
  icon: '🚕',
  kind: 'taxi',
  phone: RADIO_TAXI_TELEFONO,
  color: colors.neonYellow,
}));

// Bares/pubs en un color, supermercados/tiendas de conveniencia en otro.
const SITIO_ESTILO: Record<SitioCategoria, { icon: string; color: string; etiqueta: string }> = {
  bar: { icon: '🍺', color: colors.neonPurple, etiqueta: 'Bar' },
  pub: { icon: '🍻', color: colors.neonPurple, etiqueta: 'Pub' },
  supermarket: { icon: '🛒', color: colors.neonGreen, etiqueta: 'Supermercado' },
  convenience: { icon: '🏪', color: colors.neonGreen, etiqueta: 'Tienda de conveniencia' },
};

const sitioPoints: SimpleMapPoint[] = sitios.map((sitio) => ({
  id: sitio.id,
  latitude: sitio.latitud,
  longitude: sitio.longitud,
  label: sitio.nombre,
  sublabel: sitio.direccion ?? SITIO_ESTILO[sitio.categoria].etiqueta,
  icon: SITIO_ESTILO[sitio.categoria].icon,
  color: SITIO_ESTILO[sitio.categoria].color,
  kind: sitio.categoria,
}));

const mapPoints: SimpleMapPoint[] = [...taxiPoints, ...sitioPoints];

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
  const [selectedPoint, setSelectedPoint] = useState<SimpleMapPoint | null>(null);
  const [filtros, setFiltros] = useState<Record<FiltroCategoria, boolean>>({
    discotecas: true,
    bares: true,
    supermercados: true,
    taxis: true,
  });
  // Inicializa con los datos locales para que la app se muestre al instante
  const [bananaCoords, setBananaCoords] = useState<DiscotecaCoordinates>(defaultBananaCoords);
  const [guatequeCoords, setGuatequeCoords] = useState<DiscotecaCoordinates>(defaultGuatequeCoords);
  const { route, loading: routeLoading, error: routeError, calculateRoute, clearRoute } = useRoute();

  // Alertas en vivo por discoteca (estilo Waze), para el badge en el pin del
  // mapa: se suscriben siempre mientras el mapa está en pantalla, no solo
  // cuando esa discoteca está seleccionada.
  const { alerts: bananaAlerts } = useDiscotecaAlerts(banana.slug);
  const { alerts: guatequeAlerts } = useDiscotecaAlerts(guateque.slug);

  // Foto del próximo evento de cada discoteca: es lo más importante
  // visualmente del pin (reemplaza la inicial) y también se usa en la
  // tarjeta del mapa en vez de la foto genérica del local. Se piden para
  // las dos discotecas siempre (no solo la seleccionada) para que los pines
  // en el mapa ya se vean con la foto del evento sin necesidad de tocarlos.
  const [bananaEventImage, setBananaEventImage] = useState<string | null>(null);
  const [guatequeEventImage, setGuatequeEventImage] = useState<string | null>(null);

  const selectedClub = selectedMarkerSlug
    ? discotecas.find((discoteca) => discoteca.slug === selectedMarkerSlug) ?? null
    : null;

  const currentEventImage =
    selectedClub?.slug === banana.slug
      ? bananaEventImage
      : selectedClub?.slug === guateque.slug
        ? guatequeEventImage
        : null;

  useEffect(() => {
    let mounted = true;

    // No todos los eventos tienen foto cargada en Fourvenues (algunas
    // discotecas solo le suben foto a algunos eventos): se toma la del
    // primer evento próximo que sí tenga, no necesariamente el más cercano.
    const primeraConFoto = (eventos: { image?: string }[]) =>
      eventos.find((evento) => evento.image)?.image ?? null;

    fetchProximosEventos(banana.slug)
      .then((eventos) => {
        if (mounted) setBananaEventImage(primeraConFoto(eventos));
      })
      .catch(() => {
        // Si falla, el pin y la tarjeta caen a la foto genérica del local.
      });

    fetchProximosEventos(guateque.slug)
      .then((eventos) => {
        if (mounted) setGuatequeEventImage(primeraConFoto(eventos));
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const visiblePoints = useMemo(
    () => mapPoints.filter((point) => filtros[filtroDe(point)]),
    [filtros]
  );

  useEffect(() => {
    let mounted = true;

    const loadCoordinates = async () => {
      try {
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
        // La vista usa las coordenadas locales mientras la API responde.
      }
    };

    loadCoordinates();

    return () => {
      mounted = false;
    };
  }, []);

  const handleBack = () => {
    setSelectedDiscoteca(null);
    setSelectedMarkerSlug(null);
  };

  const handleMarkerPress = (discoteca: Discoteca) => {
    setSelectedMarkerSlug(discoteca.slug);
    setSelectedDiscoteca(null);
    setSelectedPoint(null);
    clearRoute();
  };

  const handlePointPress = (point: SimpleMapPoint) => {
    setSelectedPoint(point);
    setSelectedMarkerSlug(null);
    setSelectedDiscoteca(null);
    clearRoute();
  };

  const handleMapPress = () => {
    setSelectedMarkerSlug(null);
    setSelectedDiscoteca(null);
    setSelectedPoint(null);
    clearRoute();
  };

  const toggleFiltro = (id: string) => {
    setFiltros((prev) => ({ ...prev, [id]: !prev[id as FiltroCategoria] }));
    setSelectedMarkerSlug(null);
    setSelectedPoint(null);
    clearRoute();
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
          routeCoordinates={route?.coordinates}
          points={visiblePoints}
          onPointPress={handlePointPress}
        >
          {filtros.discotecas && (
            <MarkerComponent
              coordinate={{
                latitude: bananaCoords.latitude,
                longitude: bananaCoords.longitude,
              }}
              discoteca={banana}
              title={banana.nombre}
              selected={selectedMarkerSlug === banana.slug}
              hasAlerts={bananaAlerts.length > 0}
              eventImage={bananaEventImage ?? undefined}
              onPress={() => handleMarkerPress(banana)}
            >
              <DiscotecaMarker nombre={banana.nombre} color={banana.color} selected={selectedMarkerSlug === banana.slug} />
            </MarkerComponent>
          )}

          {filtros.discotecas && guatequeCoords && (
            <MarkerComponent
              coordinate={{
                latitude: guatequeCoords.latitude,
                longitude: guatequeCoords.longitude,
              }}
              discoteca={guateque}
              title={guateque.nombre}
              selected={selectedMarkerSlug === guateque.slug}
              hasAlerts={guatequeAlerts.length > 0}
              eventImage={guatequeEventImage ?? undefined}
              onPress={() => handleMarkerPress(guateque)}
            >
              <DiscotecaMarker nombre={guateque.nombre} color={guateque.color} selected={selectedMarkerSlug === guateque.slug} />
            </MarkerComponent>
          )}
        </MapViewComponent>
      </View>

      <View style={styles.header}>
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBorder}
        >
          <View style={styles.headerPill}>
            <Text style={styles.headerTitle}>SALIMOS</Text>
            <Text style={styles.headerSubtitle}>El Puerto de Santa María</Text>
          </View>
        </LinearGradient>
      </View>

      <FiltrosBar opciones={FILTROS} activos={filtros} onToggle={toggleFiltro} />

      {selectedPoint && (
        <PointCard
          point={selectedPoint}
          route={route}
          routeLoading={routeLoading}
          routeError={routeError}
          onSelectProfile={(profile) =>
            calculateRoute(profile, { latitude: selectedPoint.latitude, longitude: selectedPoint.longitude })
          }
          onClearRoute={clearRoute}
          onClose={handleMapPress}
        />
      )}

      {selectedClub && (
        <View style={styles.card}>
          <View style={styles.imageWrap}>
            <Image source={{ uri: currentEventImage ?? selectedClub.imagen }} style={styles.image} />
            <LinearGradient
              colors={['transparent', colors.backgroundCard]}
              style={styles.imageFade}
              pointerEvents="none"
            />
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardNombre}>{selectedClub.nombre}</Text>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>⭐ {selectedClub.rating.toFixed(1)}</Text>
              </View>
            </View>

            <Text style={styles.direccion}>📍 {selectedClub.direccion}</Text>

            <View style={styles.tags}>
              <View style={[styles.tag, { backgroundColor: selectedClub.color + '22', borderColor: selectedClub.color + '55' }]}>
                <Text style={[styles.tagText, { color: selectedClub.color }]}>{selectedClub.genero}</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: colors.neonGreen + '1F', borderColor: colors.neonGreen + '55' }]}>
                <Text style={[styles.tagText, { color: colors.neonGreen }]}>💶 {selectedClub.precioEntrada}€</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagTextMuted}>🕐 {selectedClub.horario}</Text>
              </View>
            </View>

            <Text style={styles.descripcion} numberOfLines={2}>{selectedClub.descripcion}</Text>

            <View style={styles.divider} />

            <AlertsPanel slug={selectedClub.slug} />

            <RoutePanel
              route={route}
              loading={routeLoading}
              error={routeError}
              onSelectProfile={(profile) =>
                calculateRoute(profile, { latitude: selectedClub.latitud, longitude: selectedClub.longitud })
              }
              onClear={clearRoute}
            />

            <TouchableOpacity onPress={() => openEventos(selectedClub)} activeOpacity={0.85}>
              <LinearGradient
                colors={gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.eventosButton}
              >
                <Text style={styles.eventosButtonText}>📅 Ver próximos eventos</Text>
              </LinearGradient>
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
    top: 56,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  headerBorder: {
    borderRadius: 19,
    padding: 1.5,
    shadowColor: colors.brandPink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  headerPill: {
    backgroundColor: colors.background + 'F0',
    borderRadius: 17.5,
    paddingHorizontal: 22,
    paddingVertical: 9,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  card: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: colors.backgroundCard,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 16,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 130,
  },
  imageFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 36,
  },
  cardContent: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardNombre: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
    letterSpacing: 0.2,
  },
  ratingBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: colors.neonYellow + '1F',
    borderColor: colors.neonYellow + '55',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neonYellow,
  },
  direccion: {
    color: colors.textSecondary,
    fontSize: 13.5,
    marginBottom: 14,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tagTextMuted: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  descripcion: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginTop: 16,
  },
  eventosButton: {
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: colors.brandPink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  eventosButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});