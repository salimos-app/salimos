import React, { useState, useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import Text from './src/components/Text';
import { colors } from './src/theme/colors';
import { CATEGORY_COLORS } from './src/theme/categoryColors';
import { FONTS_TO_LOAD } from './src/theme/typography';
import { Discoteca, DiscotecaSinColor } from './src/types/discoteca';
import { MapViewComponent, MarkerComponent, SimpleMapPoint } from './src/components/MapView';
import EventosScreen from './src/screens/EventosScreen';
import RoutePlannerScreen, { AutoPlan } from './src/screens/RoutePlannerScreen';
import PointCard from './src/components/PointCard';
import FiltrosBurbujas, { FiltroOpcion } from './src/components/FiltrosBurbujas';
import DiscotecasListView from './src/components/DiscotecasListView';
import DiscotecaCard from './src/components/DiscotecaCard';
import CategoriaCercaniaOverlay from './src/components/CategoriaCercaniaOverlay';
import PreguntaPlanModal from './src/components/PreguntaPlanModal';
import { useRoute } from './src/hooks/useRoute';
import { useAlertsForSlugs } from './src/hooks/useDiscotecaAlerts';
import {
  fetchDiscotecas,
  fetchNextEvento,
  fetchEventTicketTypes,
  fetchEventDetail,
  precioDesde,
  DiscotecaCoordinates,
} from './src/services/eventosApi';
import { fetchSitios, fetchParadasTaxi } from './src/services/lugaresApi';
import { Sitio, SitioCategoria } from './src/types/sitio';
import { ParadaTaxi } from './src/types/taxi';
import { Evento, EventoDetalle } from './src/types/evento';
import { SITIO_ESTILO } from './src/utils/sitioEstilo';
import { getCurrentLocation } from './src/services/location';
import { LatLng } from './src/services/directionsApi';
import { forEachLimit } from './src/utils/concurrency';
import { ordenarPorCercania } from './src/utils/geo';
import { initTelemetria, track } from './src/services/telemetria';

// Acento de color de discoteca: es un detalle puramente visual (no lo manda
// el backend) — un único color fijo por categoría, igual que taxis/bares/
// supermercados (ver CATEGORY_COLORS).
function conColor(discotecas: DiscotecaSinColor[]): Discoteca[] {
  return discotecas.map((discoteca) => ({
    ...discoteca,
    color: CATEGORY_COLORS.discoteca,
  }));
}

/** La discoteca con mejor valoración (sin rating, al final); `null` si no hay ninguna. */
function mejorDiscoteca(discotecas: Discoteca[]): Discoteca | null {
  if (discotecas.length === 0) return null;
  return [...discotecas].sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))[0];
}

type FiltroCategoria = 'discotecas' | 'bares' | 'supermercados' | 'taxis';

// Orden de abajo hacia arriba = orden de una salida (taxi → súper → bar →
// discoteca), que además va de los colores más cálidos/tarde a los más
// fríos/noche de la paleta (ver CLAUDE.md → Decisiones de diseño).
const FILTROS: FiltroOpcion[] = [
  { id: 'taxis', icon: '🚕', iconKind: 'taxi', label: 'taxis', color: CATEGORY_COLORS.taxi },
  { id: 'supermercados', icon: '🛒', iconKind: 'supermarket', label: 'supermercados', color: CATEGORY_COLORS.supermercado },
  { id: 'bares', icon: '🍺', iconKind: 'bar', label: 'bares', color: CATEGORY_COLORS.bar },
  { id: 'discotecas', icon: '🪩', iconKind: 'discoteca', label: 'discotecas', color: CATEGORY_COLORS.discoteca },
];

SplashScreen.preventAutoHideAsync();

function filtroDe(point: SimpleMapPoint): FiltroCategoria {
  if (point.kind === 'taxi') return 'taxis';
  if (point.kind === 'bar' || point.kind === 'pub') return 'bares';
  return 'supermercados';
}

function taxiPointsFrom(paradasTaxi: ParadaTaxi[], telefono?: string): SimpleMapPoint[] {
  return paradasTaxi.map((parada) => ({
    id: parada.id,
    latitude: parada.latitud,
    longitude: parada.longitud,
    label: parada.nombre,
    sublabel: 'Parada de taxi',
    icon: '🚕',
    kind: 'taxi',
    phone: telefono,
    color: CATEGORY_COLORS.taxi,
  }));
}

function sitioPointsFrom(sitios: Sitio[]): SimpleMapPoint[] {
  return sitios.map((sitio) => ({
    id: sitio.id,
    latitude: sitio.latitud,
    longitude: sitio.longitud,
    label: sitio.nombre,
    sublabel: sitio.direccion ?? SITIO_ESTILO[sitio.categoria].etiqueta,
    icon: SITIO_ESTILO[sitio.categoria].icon,
    color: SITIO_ESTILO[sitio.categoria].color,
    kind: sitio.categoria,
  }));
}

/** Mapa slug -> coordenadas a partir del listado de discotecas (las trae ya el backend en `/api/discotecas`). */
function coordsLocalesPorSlug(discotecas: Discoteca[]): Record<string, DiscotecaCoordinates> {
  return Object.fromEntries(
    discotecas.map((d) => [
      d.slug,
      { latitude: d.latitud, longitude: d.longitud, nombre: d.nombre, direccion: d.direccion },
    ])
  );
}

export default function App() {
  const [fontsLoaded] = useFonts(FONTS_TO_LOAD);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Todo (discotecas, sitios, paradas de taxi) llega del backend: no hay
  // ningún dato de negocio hardcodeado en el bundle, así que se arranca
  // vacío y se muestra un loader hasta que responde la primera carga.
  const [discotecas, setDiscotecas] = useState<Discoteca[]>([]);
  const [sitios, setSitios] = useState<Sitio[]>([]);
  const [paradasTaxi, setParadasTaxi] = useState<ParadaTaxi[]>([]);
  const [telefonoRadioTaxi, setTelefonoRadioTaxi] = useState<string | undefined>(undefined);
  const [cargandoInicial, setCargandoInicial] = useState(true);

  // Registro anónimo de la instalación (UUID + metadatos de la descarga) y
  // arranque de la telemetría de uso. Ver src/services/telemetria.ts.
  useEffect(() => {
    initTelemetria();
  }, []);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      fetchDiscotecas().then((data) => {
        if (mounted) setDiscotecas(conColor(data));
      }),
      fetchSitios().then((data) => {
        if (mounted) setSitios(data);
      }),
      fetchParadasTaxi().then(({ paradas, radioTaxi }) => {
        if (mounted) {
          setParadasTaxi(paradas);
          setTelefonoRadioTaxi(radioTaxi.telefono);
        }
      }),
    ])
      .then((resultados) => {
        for (const resultado of resultados) {
          if (resultado.status === 'rejected') {
            console.warn('Error cargando datos iniciales del backend:', resultado.reason);
          }
        }
      })
      .finally(() => {
        if (mounted) setCargandoInicial(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const taxiPoints = useMemo(
    () => taxiPointsFrom(paradasTaxi, telefonoRadioTaxi),
    [paradasTaxi, telefonoRadioTaxi]
  );
  const sitioPoints = useMemo(() => sitioPointsFrom(sitios), [sitios]);
  const mapPoints = useMemo<SimpleMapPoint[]>(
    () => [...taxiPoints, ...sitioPoints],
    [taxiPoints, sitioPoints]
  );

  const [selectedMarkerSlug, setSelectedMarkerSlug] = useState<string | null>(null);
  const [selectedDiscoteca, setSelectedDiscoteca] = useState<Discoteca | null>(null);
  const [plannerDiscoteca, setPlannerDiscoteca] = useState<Discoteca | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<SimpleMapPoint | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  // Categoría cuyo listado por cercanía está abierto (al tocar una burbuja
  // que no sea "discotecas": esa se resuelve directo a la mejor valorada,
  // ver `handleBubbleSelect`).
  const [categoriaOverlay, setCategoriaOverlay] = useState<FiltroCategoria | null>(null);
  // Pregunta "¿botellona en casa o algo fuera?" que dispara el segundo
  // toque en el hub del mapa (ver FiltrosBurbujas.onCollapse).
  const [preguntaPlan, setPreguntaPlan] = useState(false);
  const [autoPlan, setAutoPlan] = useState<AutoPlan | null>(null);
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

  // Próximo evento (con foto) de cada discoteca: la foto es lo más
  // importante visualmente del pin (reemplaza la inicial) y también se usa
  // en la tarjeta del mapa en vez de la foto genérica del local; el resto
  // del evento (nombre, fecha, edad) alimenta la tarjeta de discoteca (ver
  // más abajo). El mapa se pinta ya con la imagen genérica (modo
  // "thumbnail") y estos datos van entrando poco a poco en segundo plano.
  // Las discotecas sin ficha en Fourvenues simplemente no consiguen evento
  // y se quedan con la genérica.
  const [nextEventoBySlug, setNextEventoBySlug] = useState<Record<string, Evento | null>>({});

  const eventImageBySlug = useMemo<Record<string, string | null>>(() => {
    const mapa: Record<string, string | null> = {};
    for (const [slug, evento] of Object.entries(nextEventoBySlug)) {
      mapa[slug] = evento?.image ?? null;
    }
    return mapa;
  }, [nextEventoBySlug]);

  const selectedClub = selectedMarkerSlug
    ? discotecas.find((discoteca) => discoteca.slug === selectedMarkerSlug) ?? null
    : null;

  const nextEvento = selectedClub ? nextEventoBySlug[selectedClub.slug] : null;

  useEffect(() => {
    let mounted = true;

    // Se piden "poco a poco" (máx. 3 a la vez) en vez de una petición por
    // discoteca de golpe: así el arranque no revienta el rate-limiter del
    // backend y el mapa ya se ve mientras van cargando.
    forEachLimit(discotecas, 3, async (discoteca) => {
      const evento = await fetchNextEvento(discoteca.slug);
      if (mounted) {
        setNextEventoBySlug((prev) => ({ ...prev, [discoteca.slug]: evento }));
      }
    });

    return () => {
      mounted = false;
    };
  }, [discotecas]);

  // Precio y detalle (código de vestimenta, qué ofrece) del evento de la
  // discoteca seleccionada: a diferencia de la foto, esto solo interesa
  // para la que está abierta en este momento, así que se pide aparte (no
  // para las demás discotecas del mapa).
  const [eventoExtra, setEventoExtra] = useState<{ precio: number | null; detalle: EventoDetalle } | null>(null);

  useEffect(() => {
    setEventoExtra(null);
    if (!selectedClub || !nextEvento) return;
    let mounted = true;

    Promise.allSettled([
      nextEvento.id ? fetchEventTicketTypes(selectedClub.slug, nextEvento.id) : Promise.resolve([]),
      nextEvento.code ? fetchEventDetail(selectedClub.slug, nextEvento.code) : Promise.resolve({}),
    ]).then(([precios, detalle]) => {
      if (!mounted) return;
      setEventoExtra({
        precio: precios.status === 'fulfilled' ? precioDesde(precios.value) : null,
        detalle: detalle.status === 'fulfilled' ? detalle.value : {},
      });
    });

    return () => {
      mounted = false;
    };
  }, [selectedClub, nextEvento]);

  // Ya no hay filtro on/off: las burbujas del hub abren un listado o
  // seleccionan la mejor discoteca (ver handleBubbleSelect), así que todas
  // las categorías se muestran siempre en el mapa.
  const visiblePoints = mapPoints;

  // El modo lista y los listados por cercanía del hub ordenan por cercanía,
  // así que en cuanto se entra a cualquiera de los dos se pide la ubicación
  // una vez (en el momento, como el resto de la app); si no hay permiso, las
  // listas simplemente caen a orden alfabético.
  useEffect(() => {
    if ((viewMode !== 'list' && !categoriaOverlay) || userLocation) return;
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
  }, [viewMode, categoriaOverlay, userLocation]);

  const handleBack = () => {
    setSelectedDiscoteca(null);
    setSelectedMarkerSlug(null);
  };

  const handleMarkerPress = (discoteca: Discoteca) => {
    track('discoteca_seleccionada', { slug: discoteca.slug });
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

  // Al tocar una burbuja del hub: "discotecas" va directa a la mejor
  // valorada (mismo flujo que tocar su pin); el resto abre el listado por
  // cercanía de esa categoría (ver el overlay más abajo).
  const handleBubbleSelect = (id: string) => {
    track('filtro_seleccionado', { id });
    if (id === 'discotecas') {
      const mejor = mejorDiscoteca(discotecas);
      if (mejor) handleMarkerPress(mejor);
      return;
    }
    setSelectedMarkerSlug(null);
    setSelectedDiscoteca(null);
    setSelectedPoint(null);
    clearRoute();
    setCategoriaOverlay(id as FiltroCategoria);
  };

  const handleHubCollapse = () => {
    setPreguntaPlan(true);
  };

  // Segundo toque en el hub, tras elegir cómo empieza la noche: monta el
  // plan completo (taxi de ida más cercano, parada intermedia según la
  // respuesta, mejor discoteca, taxi de vuelta) y lo calcula automáticamente
  // en el planificador (ver RoutePlannerScreen.autoPlan).
  const construirPlanOptimo = async (modo: 'casa' | 'bar') => {
    track('plan_optimo', { modo });
    setPreguntaPlan(false);
    const mejor = mejorDiscoteca(discotecas);
    if (!mejor) return;

    let ubicacion = userLocation;
    if (!ubicacion) {
      try {
        ubicacion = await getCurrentLocation();
        setUserLocation(ubicacion);
      } catch {
        // Sin permiso: el planificador la volverá a pedir al calcular.
      }
    }

    const discotecaCoords = coordsBySlug[mejor.slug] ?? { latitude: mejor.latitud, longitude: mejor.longitud };
    const categoriasSitio: SitioCategoria[] = modo === 'casa' ? ['supermarket', 'convenience'] : ['bar', 'pub'];
    const candidatos = sitios.filter((sitio) => categoriasSitio.includes(sitio.categoria));
    const paradaIntermedia = ordenarPorCercania(candidatos, ubicacion, (sitio) => ({
      latitude: sitio.latitud,
      longitude: sitio.longitud,
    }))[0];
    const taxiIda = ordenarPorCercania(paradasTaxi, ubicacion, (parada) => ({
      latitude: parada.latitud,
      longitude: parada.longitud,
    }))[0];
    const taxiVuelta = ordenarPorCercania(paradasTaxi, discotecaCoords, (parada) => ({
      latitude: parada.latitud,
      longitude: parada.longitud,
    }))[0];

    setAutoPlan({
      taxiIdaId: taxiIda?.id ?? null,
      paradaIntermediaId: paradaIntermedia?.id ?? null,
      taxiVueltaId: taxiVuelta?.id ?? null,
    });
    setPlannerDiscoteca(mejor);
  };

  const openEventos = (discoteca: Discoteca) => {
    track('ver_eventos', { slug: discoteca.slug });
    setSelectedDiscoteca(discoteca);
  };

  const openPlanificador = (discoteca: Discoteca) => {
    track('planificar_ruta', { slug: discoteca.slug });
    setPlannerDiscoteca(discoteca);
  };

  if (!fontsLoaded) {
    return null;
  }

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
          sitios={sitios}
          paradasTaxi={paradasTaxi}
          onBack={() => {
            setPlannerDiscoteca(null);
            setAutoPlan(null);
          }}
          autoPlan={autoPlan}
        />
      </View>
    );
  }

  if (cargandoInicial) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.neonPink} />
        <Text variant="bodySmall" style={styles.loadingText}>Cargando discotecas, bares y taxis...</Text>
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
            {discotecas.map((discoteca) => {
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
                  />
                );
              })}
          </MapViewComponent>
        ) : (
          <DiscotecasListView
            discotecas={discotecas}
            mostrarDiscotecas
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
          onPress={() => {
            track('cambio_vista', { modo: 'map' });
            setViewMode('map');
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.viewToggleIcon}>🗺️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActivo]}
          onPress={() => {
            track('cambio_vista', { modo: 'list' });
            setViewMode('list');
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.viewToggleIcon}>📋</Text>
        </TouchableOpacity>
      </View>

      <FiltrosBurbujas opciones={FILTROS} onSelect={handleBubbleSelect} onCollapse={handleHubCollapse} />

      {categoriaOverlay && (
        <CategoriaCercaniaOverlay
          titulo={`${FILTROS.find((f) => f.id === categoriaOverlay)?.icon ?? ''} ${FILTROS.find((f) => f.id === categoriaOverlay)?.label ?? ''} cerca de ti`}
          points={mapPoints.filter((point) => filtroDe(point) === categoriaOverlay)}
          userLocation={userLocation}
          onClose={() => setCategoriaOverlay(null)}
          onSelectPoint={(point) => {
            setCategoriaOverlay(null);
            handlePointPress(point);
          }}
        />
      )}

      {preguntaPlan && <PreguntaPlanModal onElegir={construirPlanOptimo} onCancelar={() => setPreguntaPlan(false)} />}

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
        <DiscotecaCard
          discoteca={selectedClub}
          nextEvento={nextEvento}
          eventoExtra={eventoExtra}
          route={route}
          routeLoading={routeLoading}
          routeError={routeError}
          onSelectRouteProfile={(profile) =>
            calculateRoute(profile, { latitude: selectedClub.latitud, longitude: selectedClub.longitud })
          }
          onClearRoute={clearRoute}
          onPlanificarRuta={() => openPlanificador(selectedClub)}
          onVerEventos={() => openEventos(selectedClub)}
        />
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
});
