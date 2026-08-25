import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme/colors';
import { Discoteca } from '../types/discoteca';
import { ParadaTaxi } from '../types/taxi';
import { Sitio, SitioCategoria } from '../types/sitio';
import { ParadaItinerario } from '../types/itinerario';
import { LatLng } from '../services/directionsApi';
import { getCurrentLocation } from '../services/location';
import { useItinerario } from '../hooks/useItinerario';
import { paradasTaxi } from '../data/taxis';
import { sitios } from '../data/sitios';
import { SITIO_ESTILO } from '../utils/sitioEstilo';
import { formatDistance, formatDuration } from '../utils/format';
import { distanceMeters, ordenarPorCercania, LatLngLike } from '../utils/geo';
import { MapViewComponent, SimpleMapPoint } from './../components/MapView';

interface Props {
  discoteca: Discoteca;
  discotecaCoords: LatLng;
  onBack: () => void;
}

type CategoriaParada = 'bar' | 'supermarket' | 'bazar';

const CATEGORIA_INFO: Record<
  CategoriaParada,
  { label: string; icon: string; color: string; categoriasSitio: SitioCategoria[] }
> = {
  bar: { label: 'Bar', icon: '🍺', color: colors.neonPurple, categoriasSitio: ['bar', 'pub'] },
  supermarket: { label: 'Súper', icon: '🛒', color: colors.neonGreen, categoriasSitio: ['supermarket'] },
  bazar: { label: 'Bazar', icon: '🏪', color: colors.neonGreen, categoriasSitio: ['convenience'] },
};

const CATEGORIAS: CategoriaParada[] = ['bar', 'supermarket', 'bazar'];

function taxiToParada(taxi: ParadaTaxi, label: string): ParadaItinerario {
  return {
    tipo: 'taxi',
    id: taxi.id,
    label,
    icon: '🚕',
    latitude: taxi.latitud,
    longitude: taxi.longitud,
  };
}

function sitioToParada(sitio: Sitio): ParadaItinerario {
  return {
    tipo: 'sitio',
    id: sitio.id,
    label: sitio.nombre,
    icon: SITIO_ESTILO[sitio.categoria].icon,
    latitude: sitio.latitud,
    longitude: sitio.longitud,
  };
}

/**
 * Fila de una opción de parada (taxi o sitio), en forma de lista y no de
 * chip: muestra su distancia al punto de referencia (tu ubicación o la
 * parada anterior) y destaca la más cercana como la opción óptima.
 */
function OpcionRow({
  icon,
  nombre,
  sublabel,
  activo,
  distancia,
  esOptima,
  onPress,
}: {
  icon: string;
  nombre: string;
  sublabel?: string;
  activo: boolean;
  distancia?: number;
  esOptima?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.listaRow, activo && styles.listaRowActiva, !activo && esOptima && styles.listaRowOptima]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.listaRowIcon, activo && styles.listaRowIconActivo]}>
        <Text style={styles.listaRowIconText}>{icon}</Text>
      </View>
      <View style={styles.listaRowInfo}>
        <Text style={styles.listaRowNombre} numberOfLines={1}>
          {nombre}
        </Text>
        {sublabel ? (
          <Text style={styles.listaRowSub} numberOfLines={1}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      {distancia != null && (
        <View style={[styles.distBadge, esOptima && styles.distBadgeOptima]}>
          <Text style={[styles.distBadgeText, esOptima && styles.distBadgeTextOptima]} numberOfLines={1}>
            {esOptima ? '⭐ ' : ''}
            {formatDistance(distancia)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

/**
 * Lista de paradas de taxi (o "sin taxi") ordenada por cercanía a
 * `referencia` — la primera es la más óptima. Se reutiliza para la ida
 * (referencia = tu ubicación) y la vuelta (referencia = la discoteca).
 */
function TaxiLista({
  selected,
  onSelect,
  referencia,
}: {
  selected: ParadaTaxi | null;
  onSelect: (parada: ParadaTaxi | null) => void;
  referencia: LatLngLike | null;
}) {
  const ordenadas = useMemo(
    () => ordenarPorCercania(paradasTaxi, referencia, (t) => ({ latitude: t.latitud, longitude: t.longitud })),
    [referencia],
  );

  return (
    <View style={styles.lista}>
      <OpcionRow icon="🚫" nombre="Sin taxi" activo={!selected} onPress={() => onSelect(null)} />
      {ordenadas.map((parada, index) => (
        <OpcionRow
          key={parada.id}
          icon="🚕"
          nombre={parada.nombre}
          activo={selected?.id === parada.id}
          distancia={referencia ? distanceMeters(referencia, { latitude: parada.latitud, longitude: parada.longitud }) : undefined}
          esOptima={index === 0 && !!referencia}
          onPress={() => onSelect(parada)}
        />
      ))}
    </View>
  );
}

/**
 * Planificador de itinerario completo: ubicación actual → taxi (opcional) →
 * bar/supermercado/bazar (opcional) → discoteca → taxi de vuelta (opcional)
 * → casa. Cada tramo se calcula encadenando `fetchRoute` (a pie o en coche
 * según si sale de una parada de taxi).
 */
export default function RoutePlannerScreen({ discoteca, discotecaCoords, onBack }: Props) {
  const [taxiIda, setTaxiIda] = useState<ParadaTaxi | null>(null);
  const [categoriaParada, setCategoriaParada] = useState<CategoriaParada | null>(null);
  const [paradaIntermedia, setParadaIntermedia] = useState<Sitio | null>(null);
  const [taxiVuelta, setTaxiVuelta] = useState<ParadaTaxi | null>(null);
  const [casa, setCasa] = useState<LatLng | null>(null);
  const [pickingHome, setPickingHome] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { tramos, loading, error, calcular, clear } = useItinerario();

  // Ubicación del usuario, pedida en cuanto se abre el planificador (no se
  // espera al botón "Calcular") para poder ordenar de inmediato las
  // paradas de taxi por cercanía. Si el permiso falla, simplemente no se
  // ordena (no se muestra error: ya se pedirá de nuevo, con su propio
  // mensaje, al pulsar "Calcular ruta completa").
  const [origen, setOrigen] = useState<LatLng | null>(null);

  useEffect(() => {
    let mounted = true;
    getCurrentLocation()
      .then((ubicacion) => {
        if (mounted) setOrigen(ubicacion);
      })
      .catch(() => {
        // Sin permiso todavía: las listas caen a su orden por defecto.
      });
    return () => {
      mounted = false;
    };
  }, []);

  // La parada intermedia se ordena por cercanía al punto donde el usuario
  // "está" en ese momento del itinerario: la parada de taxi de ida si
  // eligió una, o su ubicación actual si no.
  const referenciaParada: LatLngLike | null = taxiIda
    ? { latitude: taxiIda.latitud, longitude: taxiIda.longitud }
    : origen;

  const sitiosDeCategoria = useMemo(() => {
    if (!categoriaParada) return [];
    const categorias = CATEGORIA_INFO[categoriaParada].categoriasSitio;
    const filtrados = sitios.filter((sitio) => categorias.includes(sitio.categoria));
    return ordenarPorCercania(filtrados, referenciaParada, (s) => ({ latitude: s.latitud, longitude: s.longitud }));
  }, [categoriaParada, referenciaParada]);

  const seleccionarCategoria = (categoria: CategoriaParada | null) => {
    setCategoriaParada(categoria);
    setParadaIntermedia(null);
  };

  const handleCalcular = async () => {
    setLocationError(null);
    setLocating(true);
    try {
      const ubicacion = await getCurrentLocation();
      const paradas: ParadaItinerario[] = [
        { tipo: 'ubicacion', id: 'origen', label: 'Tu ubicación', icon: '📍', ...ubicacion },
      ];

      if (taxiIda) paradas.push(taxiToParada(taxiIda, taxiIda.nombre));
      if (paradaIntermedia) paradas.push(sitioToParada(paradaIntermedia));
      paradas.push({
        tipo: 'discoteca',
        id: discoteca.id,
        label: discoteca.nombre,
        icon: '🪩',
        ...discotecaCoords,
      });
      if (taxiVuelta) paradas.push(taxiToParada(taxiVuelta, taxiVuelta.nombre));

      const casaCoord = casa ?? ubicacion;
      paradas.push({
        tipo: 'casa',
        id: 'casa',
        label: casa ? 'Casa' : 'Casa (tu ubicación de salida)',
        icon: '🏠',
        ...casaCoord,
      });

      await calcular(paradas);
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'No se pudo obtener tu ubicación.');
    } finally {
      setLocating(false);
    }
  };

  const handleReiniciar = () => {
    setTaxiIda(null);
    setCategoriaParada(null);
    setParadaIntermedia(null);
    setTaxiVuelta(null);
    setCasa(null);
    setPickingHome(false);
    setLocationError(null);
    clear();
  };

  const puntosMapa = useMemo<SimpleMapPoint[]>(() => {
    const puntos: SimpleMapPoint[] = [];
    if (taxiIda) {
      puntos.push({
        id: `ida-${taxiIda.id}`,
        latitude: taxiIda.latitud,
        longitude: taxiIda.longitud,
        label: taxiIda.nombre,
        sublabel: 'Taxi de ida',
        icon: '🚕',
        color: colors.neonYellow,
        kind: 'taxi',
      });
    }
    if (paradaIntermedia) {
      const estilo = SITIO_ESTILO[paradaIntermedia.categoria];
      puntos.push({
        id: `parada-${paradaIntermedia.id}`,
        latitude: paradaIntermedia.latitud,
        longitude: paradaIntermedia.longitud,
        label: paradaIntermedia.nombre,
        sublabel: estilo.etiqueta,
        icon: estilo.icon,
        color: estilo.color,
        kind: paradaIntermedia.categoria,
      });
    }
    puntos.push({
      id: `disco-${discoteca.slug}`,
      latitude: discotecaCoords.latitude,
      longitude: discotecaCoords.longitude,
      label: discoteca.nombre,
      sublabel: 'Discoteca',
      icon: '🪩',
      color: discoteca.color,
      kind: 'discoteca',
    });
    if (taxiVuelta) {
      puntos.push({
        id: `vuelta-${taxiVuelta.id}`,
        latitude: taxiVuelta.latitud,
        longitude: taxiVuelta.longitud,
        label: taxiVuelta.nombre,
        sublabel: 'Taxi de vuelta',
        icon: '🚕',
        color: colors.neonYellow,
        kind: 'taxi',
      });
    }
    if (casa) {
      puntos.push({
        id: 'casa',
        latitude: casa.latitude,
        longitude: casa.longitude,
        label: 'Casa',
        sublabel: 'Tu casa',
        icon: '🏠',
        color: colors.neonBlue,
        kind: 'casa',
      });
    }
    return puntos;
  }, [taxiIda, paradaIntermedia, taxiVuelta, casa, discoteca, discotecaCoords]);

  const rutaCoordenadas = useMemo(
    () => (tramos.length > 0 ? tramos.flatMap((tramo) => tramo.coordinates) : undefined),
    [tramos],
  );

  const totalDistancia = tramos.reduce((sum, tramo) => sum + tramo.distanceMeters, 0);
  const totalDuracion = tramos.reduce((sum, tramo) => sum + tramo.durationSeconds, 0);
  const calculando = locating || loading;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Planificar ruta</Text>
          <Text style={styles.headerSubtitle}>{discoteca.nombre}</Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapViewComponent
          style={styles.map}
          initialRegion={{
            latitude: discotecaCoords.latitude,
            longitude: discotecaCoords.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
          region={{
            latitude: discotecaCoords.latitude,
            longitude: discotecaCoords.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
          onPress={(coordinate) => {
            if (pickingHome && coordinate) {
              setCasa(coordinate);
              setPickingHome(false);
            }
          }}
          routeCoordinates={rutaCoordenadas}
          points={puntosMapa}
        />
        {pickingHome && (
          <View style={styles.pickingBanner}>
            <Text style={styles.pickingBannerText}>👆 Toca el mapa para marcar tu casa</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepLabel}>1. Taxi de ida (opcional)</Text>
        <TaxiLista selected={taxiIda} onSelect={setTaxiIda} referencia={origen} />

        <Text style={styles.stepLabel}>2. Bar, súper o bazar (opcional)</Text>
        <View style={styles.chipsWrap}>
          <TouchableOpacity
            style={[styles.chip, !categoriaParada && styles.chipActivo]}
            onPress={() => seleccionarCategoria(null)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, !categoriaParada && styles.chipTextActivo]}>🚫 Sin parada</Text>
          </TouchableOpacity>
          {CATEGORIAS.map((categoria) => {
            const info = CATEGORIA_INFO[categoria];
            const activo = categoriaParada === categoria;
            return (
              <TouchableOpacity
                key={categoria}
                style={[styles.chip, activo && { backgroundColor: info.color + '2A', borderColor: info.color }]}
                onPress={() => seleccionarCategoria(categoria)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, activo && { color: info.color }]}>
                  {info.icon} {info.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {categoriaParada && (
          <View style={styles.lista}>
            <OpcionRow icon="🚫" nombre="Sin parada" activo={!paradaIntermedia} onPress={() => setParadaIntermedia(null)} />
            {sitiosDeCategoria.map((sitio, index) => (
              <OpcionRow
                key={sitio.id}
                icon={SITIO_ESTILO[sitio.categoria].icon}
                nombre={sitio.nombre}
                sublabel={sitio.direccion}
                activo={paradaIntermedia?.id === sitio.id}
                distancia={
                  referenciaParada
                    ? distanceMeters(referenciaParada, { latitude: sitio.latitud, longitude: sitio.longitud })
                    : undefined
                }
                esOptima={index === 0 && !!referenciaParada}
                onPress={() => setParadaIntermedia(sitio)}
              />
            ))}
          </View>
        )}

        <Text style={styles.stepLabel}>3. Discoteca</Text>
        <View style={[styles.fixedCard, { borderLeftColor: discoteca.color }]}>
          <Text style={styles.fixedCardText}>🪩 {discoteca.nombre}</Text>
        </View>

        <Text style={styles.stepLabel}>4. Taxi de vuelta (opcional)</Text>
        <TaxiLista selected={taxiVuelta} onSelect={setTaxiVuelta} referencia={discotecaCoords} />

        <Text style={styles.stepLabel}>5. Casa</Text>
        <View style={styles.fixedCard}>
          <Text style={styles.fixedCardText}>
            {casa ? '🏠 Ubicación elegida en el mapa' : '🏠 Tu ubicación de salida (por defecto)'}
          </Text>
        </View>
        <View style={styles.chipsWrap}>
          <TouchableOpacity
            style={[styles.chip, pickingHome && styles.chipActivo]}
            onPress={() => setPickingHome((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, pickingHome && styles.chipTextActivo]}>
              {pickingHome ? '✕ Cancelar selección' : '📍 Elegir en el mapa'}
            </Text>
          </TouchableOpacity>
          {casa && (
            <TouchableOpacity
              style={styles.chip}
              onPress={() => {
                setCasa(null);
                setPickingHome(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.chipText}>↺ Usar ubicación de salida</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={handleCalcular} activeOpacity={0.85} disabled={calculando} style={styles.calcularWrap}>
          <LinearGradient
            colors={gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.calcularButton}
          >
            {calculando ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.calcularButtonText}>🧭 Calcular ruta completa</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {(locationError || error) && <Text style={styles.errorText}>{locationError ?? error}</Text>}

        {tramos.length > 0 && !calculando && (
          <View style={styles.resultados}>
            <View style={styles.resultadosHeader}>
              <Text style={styles.resultadosTotal}>
                🧭 {formatDistance(totalDistancia)} · {formatDuration(totalDuracion)} en total
              </Text>
              <TouchableOpacity onPress={handleReiniciar}>
                <Text style={styles.reiniciarText}>Reiniciar</Text>
              </TouchableOpacity>
            </View>

            {tramos.map((tramo, index) => (
              <View key={index} style={styles.tramoRow}>
                <Text style={styles.tramoLabel} numberOfLines={1}>
                  {tramo.desde.icon} {tramo.desde.label} → {tramo.hasta.icon} {tramo.hasta.label}
                </Text>
                <Text style={styles.tramoDetalle}>
                  {tramo.profile === 'driving-car' ? '🚗' : '🚶'} {formatDistance(tramo.distanceMeters)} ·{' '}
                  {formatDuration(tramo.durationSeconds)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 18,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12,
  },
  backText: {
    color: colors.textPrimary,
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  mapContainer: {
    height: 220,
  },
  map: {
    flex: 1,
  },
  pickingBanner: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    backgroundColor: colors.backgroundCard + 'F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neonBlue,
    paddingVertical: 8,
    alignItems: 'center',
  },
  pickingBannerText: {
    color: colors.neonBlue,
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  stepLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lista: {
    gap: 8,
  },
  listaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  listaRowActiva: {
    backgroundColor: colors.neonBlue + '1A',
    borderColor: colors.neonBlue,
  },
  listaRowOptima: {
    borderColor: colors.neonYellow + '99',
  },
  listaRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundCard,
    marginRight: 10,
  },
  listaRowIconActivo: {
    backgroundColor: colors.neonBlue + '2A',
  },
  listaRowIconText: {
    fontSize: 16,
  },
  listaRowInfo: {
    flex: 1,
    marginRight: 8,
  },
  listaRowNombre: {
    color: colors.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  listaRowSub: {
    color: colors.textMuted,
    fontSize: 11.5,
    marginTop: 1,
  },
  distBadge: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  distBadgeOptima: {
    backgroundColor: colors.neonYellow + '22',
    borderColor: colors.neonYellow,
  },
  distBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  distBadgeTextOptima: {
    color: colors.neonYellow,
  },
  chip: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: colors.border,
    maxWidth: 220,
  },
  chipActivo: {
    backgroundColor: colors.neonBlue + '22',
    borderColor: colors.neonBlue,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  chipTextActivo: {
    color: colors.neonBlue,
  },
  fixedCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  fixedCardText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  calcularWrap: {
    marginTop: 22,
  },
  calcularButton: {
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: colors.brandPink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  calcularButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  resultados: {
    marginTop: 20,
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 14,
  },
  resultadosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultadosTotal: {
    color: colors.neonBlue,
    fontSize: 14,
    fontWeight: '800',
  },
  reiniciarText: {
    color: colors.textMuted,
    fontSize: 12.5,
    fontWeight: '700',
  },
  tramoRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  tramoLabel: {
    color: colors.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  tramoDetalle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
});
