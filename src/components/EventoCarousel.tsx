import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  ViewToken,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Text from './Text';
import { colors } from '../theme/colors';
import { Evento, EventoDetalle } from '../types/evento';
import {
  fetchProximosEventos,
  fetchEventTicketTypes,
  fetchEventDetail,
  precioDesde,
} from '../services/eventosApi';
import { formatFechaLarga } from '../utils/format';

/**
 * Carrusel de los próximos eventos de una discoteca, con el cartel como
 * protagonista (completo, sin recortar) sobre un panel oscuro con la fecha,
 * el nombre y una fila de datos (edad, código de vestimenta, precio y acceso
 * a entradas). Se desliza en horizontal, una página por evento.
 *
 * Trae el listado completo por su cuenta (`fetchProximosEventos`), pero
 * arranca sembrado con el `seedEvento` que la tarjeta ya tenía cargado para
 * el pin — así la primera página se ve al instante y el resto entra detrás.
 * El precio y el código de vestimenta se piden por evento y solo para la
 * página visible (y la siguiente), no para todo el listado de golpe.
 */

interface Props {
  slug: string;
  /** Evento ya conocido por la tarjeta (para pintar la primera página sin esperar). */
  seedEvento?: Evento | null;
  /** Alto del cartel; el `contain` deja el flyer entero dentro de esta caja. */
  posterHeight?: number;
}

interface EventoExtra {
  precio: number | null;
  dressCode?: string;
}

// Material Symbols (outlined), mismo viewBox que los íconos de pin.
const ICON_VIEWBOX = '0 -960 960 960';
const ICON_PATHS = {
  // checkroom — código de vestimenta
  dressCode:
    'M110-160q-13 0-21.5-8.5T80-190q0-7 3-13t9-11l358-281v-55q0-12 8.5-21t20.5-9q34 0 57.5-23.5T560-661q0-33-23.5-56T480-740q-33 0-56.5 23.5T400-660h-60q0-58 41-99t99-41q58 0 99 40.5t41 98.5q0 49-31 86.5T510-523v28l358 281q6 5 9 11t3 13q0 13-8.5 21.5T850-160H110Zm90-60h560L480-443 200-220Z',
  // confirmation_number — entradas
  ticket:
    'M480-283q12 0 21-9t9-21q0-12-9-21t-21-9q-12 0-21 9t-9 21q0 12 9 21t21 9Zm0-167q12 0 21-9t9-21q0-12-9-21t-21-9q-12 0-21 9t-9 21q0 12 9 21t21 9Zm0-167q12 0 21-9t9-21q0-12-9-21t-21-9q-12 0-21 9t-9 21q0 12 9 21t21 9Zm340 457H140q-24.75 0-42.37-17.63Q80-195.25 80-220v-153q37-8 61.5-37.5T166-480q0-40-24.5-70T80-587v-153q0-24.75 17.63-42.38Q115.25-800 140-800h680q24.75 0 42.38 17.62Q880-764.75 880-740v153q-37 7-61.5 37T794-480q0 40 24.5 69.5T880-373v153q0 24.75-17.62 42.37Q844.75-160 820-160Zm0-60v-109q-38-26-62-65t-24-86q0-47 24-86t62-65v-109H140v109q39 26 62.5 65t23.5 86q0 47-23.5 86T140-329v109h680ZM480-480Z',
};

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 60 };

/** Alto del panel de datos bajo el cartel (fecha + nombre de 2 líneas + fila de datos). */
const PANEL_HEIGHT = 132;

function LineIcon({
  d,
  size = 22,
  color = colors.textPrimary,
}: {
  d: string;
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox={ICON_VIEWBOX}>
      <Path d={d} fill={color} />
    </Svg>
  );
}

/** Clave estable de un evento para cachear su precio/detalle. */
function eventoKey(evento: Evento): string {
  return evento.id ?? evento.code ?? `${evento.name}-${evento.startDate}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function EventoCarousel({
  slug,
  seedEvento,
  posterHeight = 360,
}: Props) {
  const [eventos, setEventos] = useState<Evento[]>(
    seedEvento ? [seedEvento] : [],
  );
  const [cargando, setCargando] = useState(!seedEvento);
  const [indexActivo, setIndexActivo] = useState(0);
  const [extras, setExtras] = useState<Record<string, EventoExtra>>({});
  const solicitados = useRef<Set<string>>(new Set());
  const [anchoPagina, setAnchoPagina] = useState(0);

  // Listado completo: reemplaza la semilla en cuanto responde el backend.
  useEffect(() => {
    let vivo = true;
    fetchProximosEventos(slug)
      .then((data) => {
        if (vivo && data.length > 0) setEventos(data);
      })
      .catch(() => {
        // Nos quedamos con la semilla (si la había).
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [slug]);

  // Precio + código de vestimenta de la página visible y la siguiente.
  useEffect(() => {
    [indexActivo, indexActivo + 1].forEach((i) => {
      const evento = eventos[i];
      if (!evento) return;
      const key = eventoKey(evento);
      if (solicitados.current.has(key)) return;
      solicitados.current.add(key);

      Promise.allSettled([
        evento.id
          ? fetchEventTicketTypes(slug, evento.id)
          : Promise.resolve([]),
        evento.code
          ? fetchEventDetail(slug, evento.code)
          : Promise.resolve<EventoDetalle>({}),
      ]).then(([precios, detalle]) => {
        setExtras((prev) => ({
          ...prev,
          [key]: {
            precio:
              precios.status === 'fulfilled'
                ? precioDesde(precios.value)
                : null,
            dressCode:
              detalle.status === 'fulfilled'
                ? detalle.value.dressCode
                : undefined,
          },
        }));
      });
    });
  }, [indexActivo, eventos, slug]);

  // Prefetch mientras se desliza (dispara antes de que la página cuaje).
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const primero = viewableItems[0]?.index;
      if (typeof primero === 'number') setIndexActivo(primero);
    },
    [],
  );

  // Índice definitivo al terminar el gesto de paginación: más fiable que la
  // visibilidad para `pagingEnabled` (y funciona igual en web).
  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const ancho = e.nativeEvent.layoutMeasurement.width;
      if (ancho > 0) {
        setIndexActivo(Math.round(e.nativeEvent.contentOffset.x / ancho));
      }
    },
    [],
  );

  const abrirEntradas = useCallback((url: string) => {
    if (url) Linking.openURL(url).catch(() => undefined);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Evento }) => {
      const extra = extras[eventoKey(item)];
      return (
        <View
          style={[
            styles.pagina,
            { height: posterHeight + PANEL_HEIGHT },
            anchoPagina > 0 && { width: anchoPagina },
          ]}
        >
          <View style={[styles.posterWrap, { height: posterHeight }]}>
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={styles.poster}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.posterPlaceholder}>
                <Text variant="heading" style={styles.posterInicial}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.panel}>
            {item.startDate ? (
              <Text variant="label" style={styles.fecha}>
                {formatFechaLarga(item.startDate)}
              </Text>
            ) : null}
            <Text variant="heading" style={styles.nombre} numberOfLines={2}>
              {item.name.toUpperCase()}
            </Text>

            <View style={styles.datos}>
              {item.age != null && (
                <Text variant="label" style={styles.dato}>
                  +{item.age}
                </Text>
              )}
              {extra?.dressCode ? (
                <View style={styles.datoIcono}>
                  <LineIcon d={ICON_PATHS.dressCode} />
                  <Text variant="label" style={styles.dato}>
                    {capitalize(extra.dressCode)}
                  </Text>
                </View>
              ) : null}
              {extra?.precio != null && (
                <Text variant="label" style={styles.dato}>
                  {extra.precio}€
                </Text>
              )}
              {item.url ? (
                <TouchableOpacity
                  onPress={() => abrirEntradas(item.url)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.entradasBtn}
                  activeOpacity={0.7}
                >
                  <LineIcon d={ICON_PATHS.ticket} color={colors.neonPink} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      );
    },
    [extras, anchoPagina, posterHeight, abrirEntradas],
  );

  const puntos = useMemo(() => eventos.map((_, i) => i), [eventos]);

  if (cargando && eventos.length === 0) {
    return (
      <View style={[styles.cargando, { height: posterHeight }]}>
        <ActivityIndicator color={colors.neonPink} />
      </View>
    );
  }

  if (eventos.length === 0) return null;

  return (
    <View onLayout={(e) => setAnchoPagina(e.nativeEvent.layout.width)}>
      <FlatList
        data={eventos}
        keyExtractor={(item, index) =>
          item.id ?? item.code ?? `${item.name}-${index}`
        }
        renderItem={renderItem}
        horizontal
        pagingEnabled
        style={{ height: posterHeight + PANEL_HEIGHT }}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        onMomentumScrollEnd={onMomentumScrollEnd}
        // Sin `width` de página aún (primer render): que no snapee raro.
        scrollEnabled={anchoPagina > 0 && eventos.length > 1}
      />

      {eventos.length > 1 && (
        <View style={styles.puntos}>
          {puntos.map((i) => (
            <View
              key={i}
              style={[styles.punto, i === indexActivo && styles.puntoActivo]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pagina: {
    // `width` se fija en runtime con el ancho real de la tarjeta.
  },
  posterWrap: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  poster: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
  },
  posterInicial: {
    color: colors.textMuted,
    fontSize: 56,
  },
  panel: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 4,
  },
  fecha: {
    color: colors.textMuted,
  },
  nombre: {
    color: colors.textPrimary,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  datos: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 12,
  },
  dato: {
    color: colors.textSecondary,
  },
  datoIcono: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entradasBtn: {
    padding: 2,
  },
  puntos: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
  },
  punto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  puntoActivo: {
    width: 18,
    backgroundColor: colors.neonPink,
  },
  cargando: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
