import React, { useState, useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from './src/theme/colors';
import { discotecas as discotecasSemilla } from './src/data/discotecas';
import { Discoteca, DiscotecaSinColor } from './src/types/discoteca';
import { MapViewComponent, MarkerComponent, SimpleMapPoint } from './src/components/MapView';
import DiscotecaMarker from './src/components/DiscotecaMarker';
import EventosScreen from './src/screens/EventosScreen';
import RoutePlannerScreen from './src/screens/RoutePlannerScreen';
import AlertsPanel from './src/components/AlertsPanel';
import RoutePanel from './src/components/RoutePanel';
import PointCard from './src/components/PointCard';
import FiltrosBurbujas, { FiltroOpcion } from './src/components/FiltrosBurbujas';
import DiscotecasListView from './src/components/DiscotecasListView';
import { useRoute } from './src/hooks/useRoute';
import { useAlertsForSlugs } from './src/hooks/useDiscotecaAlerts';
import {
  fetchDiscotecas,
  fetchEventImage,
  DiscotecaCoordinates,
} from './src/services/eventosApi';
import { paradasTaxi, RADIO_TAXI_NOMBRE, RADIO_TAXI_TELEFONO } from './src/data/taxis';
import { sitios } from './src/data/sitios';
import { SITIO_ESTILO } from './src/utils/sitioEstilo';
import { getCurrentLocation } from './src/services/location';
import { LatLng } from './src/services/directionsApi';
import { forEachLimit } from './src/utils/concurrency';

// Acento de color por discoteca: es un detalle puramente visual (no lo
// manda el backend), se asigna por índice ciclando esta paleta.
const DISCOTECA_COLOR_PALETTE = [colors.neonPink, colors.neonYellow, colors.neonPurple, colors.neonBlue, colors.neonGreen];

function conColor(discotecas: DiscotecaSinColor[]): Discoteca[] {
  return discotecas.map((discoteca, index) => ({
    ...discoteca,
    color: DISCOTECA_COLOR_PALETTE[index % DISCOTECA_COLOR_PALETTE.length],
  }));
}

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

/** Mapa slug -> coordenadas a partir del listado de discotecas (las trae ya el backend en `/api/discotecas`). */
function coordsLocalesPorSlug(discotecas: Discoteca[]): Record<string, DiscotecaCoordinates> {
  return Object.fromEntries(
    discotecas.map((d) => [
      d.slug,
      { latitude: d.latitud, longitude: d.longitud, nombre: d.nombre, direccion: d.direccion },
    ])
  );
}

const discotecasSemillaConColor = conColor(discotecasSemilla);

export default function App() {
  // Arranca con la semilla local para que la app se muestre al instante; en
  // cuanto responde el backend, `discotecas` pasa a ser el listado real de
  // /api/discotecas (mismo shape, así que todo lo demás no se entera).
  const [discotecas, setDiscotecas] = useState<Discoteca[]>(discotecasSemillaConColor);

  useEffect(() => {
    let mounted = true;

    fetchDiscotecas()
      .then((data) => {
        if (mounted) setDiscotecas(conColor(data));
      })
      .catch((error) => {
        console.warn('Error cargando discotecas del backend (usando semilla local):', error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const [selectedMarkerSlug, setSelectedMarkerSlug] = useState<string | null>(null);
  const [selectedDiscoteca, setSelectedDiscoteca] = useState<Discoteca | null>(null);
  const [plannerDiscoteca, setPlannerDiscoteca] = useState<Discoteca | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<SimpleMapPoint | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [filtros, setFiltros] = useState<Record<FiltroCategoria, boolean>>({
    discotecas: true,
    bares: true,
    supermercados: true,
    taxis: true,
  });
  // Las coordenadas ya vienen en el listado del backend (`/api/discotecas`),
  // así que se derivan de ahí en vez de pedirlas una a una a Fourvenues.
  // Mientras responde el backend se usan las de la semilla local.
  const coordsBySlug = useMemo<Record<string, DiscotecaCoordinates>>(
    () => coordsLocalesPorSlug(discotecas),
    [discotecas]
  );
  const { route, loading: routeLoading, error: routeError, calculateRoute, clearRoute } = useRoute();

  const discotecaSlugs = useMemo(() => discotecas.map((d) => d.slug), [discotecas]);

  // Alertas en vivo por discoteca (estilo Waze), para el badge en el pin del
  // mapa: se suscriben siempre mientras el mapa está en pantalla, no solo
  // cuando esa discoteca está seleccionada. Las que no tienen backend propio
  // simplemente nunca reciben alertas (badge nunca se enciende).
  const alertsBySlug = useAlertsForSlugs(discotecaSlugs);

  // Foto del próximo evento de cada discoteca: es lo más importante
  // visualmente del pin (reemplaza la inicial) y también se usa en la
  // tarjeta del mapa en vez de la foto genérica del local. El mapa se pinta
  // ya con la imagen genérica (modo "thumbnail") y estas fotos van entrando
  // poco a poco en segundo plano (ver más abajo). Las discotecas sin ficha
  // en Fourvenues simplemente no consiguen foto y se quedan con la genérica.
  const [eventImageBySlug, setEventImageBySlug] = useState<Record<string, string | null>>({});

  const selectedClub = selectedMarkerSlug
    ? discotecas.find((discoteca) => discoteca.slug === selectedMarkerSlug) ?? null
    : null;

  const currentEventImage = selectedClub ? eventImageBySlug[selectedClub.slug] ?? null : null;

  useEffect(() => {
    let mounted = true;

    // Se piden "poco a poco" (máx. 3 a la vez) en vez de una petición por
    // discoteca de golpe: así el arranque no revienta el rate-limiter del
    // backend y el mapa ya se ve mientras las fotos van cargando.
    forEachLimit(discotecas, 3, async (discoteca) => {
      const imagen = await fetchEventImage(discoteca.slug);
      if (mounted) {
        setEventImageBySlug((prev) => ({ ...prev, [discoteca.slug]: imagen }));
      }
    });

    return () => {
      mounted = false;
    };
  }, [discotecas]);

  const visiblePoints = useMemo(
    () => mapPoints.filter((point) => filtros[filtroDe(point)]),
    [filtros]
  );

  // El modo lista ordena por cercanía, así que en cuanto se entra ahí se
  // pide la ubicación una vez (en el momento, como el resto de la app); si
  // no hay permiso, la lista simplemente cae a orden alfabético.
  useEffect(() => {
    if (viewMode !== 'list' || userLocation) return;
    let mounted = true;

    getCurrentLocation()
      .then((location) => {
        if (mounted) setUserLocation(location);
      })
      .catch(() => {
        // Sin permiso: la lista se queda en orden alfabético.
      });

    return () => {
      mounted = false;
    };
  }, [viewMode, userLocation]);

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

  const openPlanificador = (discoteca: Discoteca) => {
    setPlannerDiscoteca(discoteca);
  };

  if (selectedDiscoteca) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <EventosScreen discoteca={selectedDiscoteca} onBack={handleBack} />
      </View>
    );
  }

  if (plannerDiscoteca) {
    const coords = coordsBySlug[plannerDiscoteca.slug] ?? {
      latitude: plannerDiscoteca.latitud,
      longitude: plannerDiscoteca.longitud,
    };
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <RoutePlannerScreen
          discoteca={plannerDiscoteca}
          discotecaCoords={coords}
          onBack={() => setPlannerDiscoteca(null)}
        />
      </View>
    );
  }

  const primera = discotecas[0];
  const centroMapa = (primera && coordsBySlug[primera.slug]) ?? {
    latitude: primera?.latitud ?? 36.5982,
    longitude: primera?.longitud ?? -6.2242,
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.mapContainer}>
        {viewMode === 'map' ? (
          <MapViewComponent
            style={styles.map}
            initialRegion={{
              latitude: centroMapa.latitude,
              longitude: centroMapa.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            region={{
              latitude: centroMapa.latitude,
              longitude: centroMapa.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            onPress={handleMapPress}
            routeCoordinates={route?.coordinates}
            points={visiblePoints}
            onPointPress={handlePointPress}
          >
            {filtros.discotecas &&
              discotecas.map((discoteca) => {
                const coords = coordsBySlug[discoteca.slug] ?? {
                  latitude: discoteca.latitud,
                  longitude: discoteca.longitud,
                };
                const selected = selectedMarkerSlug === discoteca.slug;
                return (
                  <MarkerComponent
                    key={discoteca.slug}
                    coordinate={{ latitude: coords.latitude, longitude: coords.longitude }}
                    discoteca={discoteca}
                    title={discoteca.nombre}
                    selected={selected}
                    hasAlerts={(alertsBySlug[discoteca.slug]?.length ?? 0) > 0}
                    eventImage={eventImageBySlug[discoteca.slug] ?? undefined}
                    onPress={() => handleMarkerPress(discoteca)}
                  >
                    <DiscotecaMarker nombre={discoteca.nombre} color={discoteca.color} selected={selected} />
                  </MarkerComponent>
                );
              })}
          </MapViewComponent>
        ) : (
          <DiscotecasListView
            discotecas={discotecas}
            mostrarDiscotecas={filtros.discotecas}
            coordsBySlug={coordsBySlug}
            eventImageBySlug={eventImageBySlug}
            alertsBySlug={alertsBySlug}
            points={visiblePoints}
            userLocation={userLocation}
            onSelectDiscoteca={handleMarkerPress}
            onSelectPoint={handlePointPress}
          />
        )}
      </View>

      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.viewToggleBtn, viewMode === 'map' && styles.viewToggleBtnActivo]}
          onPress={() => setViewMode('map')}
          activeOpacity={0.85}
        >
          <Text style={styles.viewToggleIcon}>🗺️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActivo]}
          onPress={() => setViewMode('list')}
          activeOpacity={0.85}
        >
          <Text style={styles.viewToggleIcon}>📋</Text>
        </TouchableOpacity>
      </View>

      <FiltrosBurbujas opciones={FILTROS} activos={filtros} onToggle={toggleFiltro} />

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
              {selectedClub.rating != null && (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {selectedClub.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>

            <Text style={styles.direccion}>📍 {selectedClub.direccion}</Text>

            <View style={styles.tags}>
              <View style={[styles.tag, { backgroundColor: selectedClub.color + '22', borderColor: selectedClub.color + '55' }]}>
                <Text style={[styles.tagText, { color: selectedClub.color }]}>{selectedClub.genero}</Text>
              </View>
              {selectedClub.precioEntrada != null && (
                <View style={[styles.tag, { backgroundColor: colors.neonGreen + '1F', borderColor: colors.neonGreen + '55' }]}>
                  <Text style={[styles.tagText, { color: colors.neonGreen }]}>💶 {selectedClub.precioEntrada}€</Text>
                </View>
              )}
              {selectedClub.horario && (
                <View style={styles.tag}>
                  <Text style={styles.tagTextMuted}>🕐 {selectedClub.horario}</Text>
                </View>
              )}
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

            <TouchableOpacity onPress={() => openPlanificador(selectedClub)} activeOpacity={0.85} style={styles.rutaButton}>
              <Text style={styles.rutaButtonText}>🗺️ Planificar ruta (ida y vuelta)</Text>
            </TouchableOpacity>

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
  viewToggle: {
    position: 'absolute',
    top: 56,
    right: 16,
    flexDirection: 'row',
    gap: 6,
  },
  viewToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background + 'F0',
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  viewToggleBtnActivo: {
    backgroundColor: colors.neonPink + '26',
    borderColor: colors.neonPink,
  },
  viewToggleIcon: {
    fontSize: 16,
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
  rutaButton: {
    borderRadius: 15,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: colors.neonBlue,
    backgroundColor: colors.neonBlue + '18',
  },
  rutaButtonText: {
    color: colors.neonBlue,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  eventosButton: {
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
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
