import React from 'react';
import { View, StyleSheet } from 'react-native';
import * as maplibregl from 'maplibre-gl';
import type {
  Feature,
  FeatureCollection,
  Point as GeoJSONPoint,
} from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import { colors, BRAND_GRADIENT } from '../theme/colors';
import { MAP_FONT_STYLESHEET_URL } from '../theme/mapPins';
import { CATEGORY_COLORS } from '../theme/categoryColors';
import {
  clusterPinHtml,
  discotecaPinHtml,
  pointPinHtml,
} from '../theme/mapPinHtml';
import {
  MarkerProps,
  MapViewProps,
  SimpleMapPoint,
  mapStyle,
} from './MapView.types';

// MapLibre intenta detectar la URL de su propio <script> para relanzarse a sí
// mismo como worker; bajo Metro (el bundler de Expo web) todo el código de la
// app —MapLibre incluido— viaja concatenado en un único bundle enorme, así
// que esa autodetección acaba intentando ejecutar el bundle completo de la
// app dentro del worker (sin `document`/`window`), donde se cuelga en
// silencio sin llegar a levantar el mapa. El build "csp-worker" es un worker
// clásico autocontenido (sin imports externos) pensado justo para bundlers
// como este — pero un worker clásico no puede cargarse cross-origin (el
// navegador lo bloquea con SecurityError pase lo que pase con CORS), así que
// se sirve una copia estática desde el propio origen
// (`public/maplibre-gl-csp-worker.js`) — hay que mantenerla sincronizada si
// se actualiza la versión de `maplibre-gl`.
maplibregl.setWorkerUrl('/maplibre-gl-csp-worker.js');

// Los pines son DOM plano fuera del árbol de React Native (MapLibre los
// posiciona a mano), así que no heredan las fuentes que registra
// `expo-font` para el resto de la app: se cargan una única vez, aparte.
if (typeof document !== 'undefined' && !document.getElementById('salimos-map-font')) {
  const link = document.createElement('link');
  link.id = 'salimos-map-font';
  link.rel = 'stylesheet';
  link.href = MAP_FONT_STYLESHEET_URL;
  document.head.appendChild(link);
}

const POINTS_SOURCE_ID = 'salimos-points';
const POINTS_CLUSTER_LAYER_ID = 'salimos-points-clusters';

/** Registra (o repone) la fuente GeoJSON + capa de clusters nativos de MapLibre para `points`. */
function usePointsClusterLayer(
  map: maplibregl.Map | null,
  points: SimpleMapPoint[],
  onPointPress?: (point: SimpleMapPoint) => void,
) {
  const markersRef = React.useRef<Map<string, maplibregl.Marker>>(new Map());
  const onPointPressRef = React.useRef(onPointPress);
  onPointPressRef.current = onPointPress;

  React.useEffect(() => {
    if (!map) return;
    const m = map;

    const geojson: FeatureCollection<GeoJSONPoint> = {
      type: 'FeatureCollection',
      features: points.map((point): Feature<GeoJSONPoint> => ({
        type: 'Feature',
        properties: { id: point.id },
        geometry: {
          type: 'Point',
          coordinates: [point.longitude, point.latitude],
        },
      })),
    };

    const pointsById = new Map(points.map((point) => [point.id, point]));

    function clearIndividualMarkers() {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
    }

    // Diferencial (igual que los clusters): solo se crean los pines que
    // aparecen y se quitan los que dejan de estar. Recrearlos todos aquí
    // hacía que arrastrar el mapa destruyera y reconstruyera el DOM de cada
    // pin en cada frame del gesto, y se veía a tirones.
    function renderIndividualMarkers() {
      if (!m.getSource(POINTS_SOURCE_ID)) return;
      const features = m.querySourceFeatures(POINTS_SOURCE_ID, {
        filter: ['!', ['has', 'point_count']],
      });
      const seen = new Set<string>();
      features.forEach((feature: maplibregl.MapGeoJSONFeature) => {
        const id = feature.properties?.id as string | undefined;
        if (!id || seen.has(id)) return;
        seen.add(id);
        if (markersRef.current.has(id)) return;
        const point = pointsById.get(id);
        if (!point) return;
        const el = document.createElement('div');
        el.innerHTML = pointPinHtml(point.kind, point.icon, point.color);
        const marker = new maplibregl.Marker({
          element: el.firstElementChild as HTMLElement,
          anchor: 'bottom',
        })
          .setLngLat([point.longitude, point.latitude])
          .addTo(m);
        el.firstElementChild?.addEventListener('click', (event) => {
          event.stopPropagation();
          onPointPressRef.current?.(point);
        });
        markersRef.current.set(id, marker);
      });
      markersRef.current.forEach((marker, id) => {
        if (!seen.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      });
    }

    function setup() {
      if (m.getLayer(POINTS_CLUSTER_LAYER_ID))
        m.removeLayer(POINTS_CLUSTER_LAYER_ID);
      if (m.getSource(POINTS_SOURCE_ID)) m.removeSource(POINTS_SOURCE_ID);

      m.addSource(POINTS_SOURCE_ID, {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 16,
        clusterRadius: 56,
      });

      m.addLayer({
        id: POINTS_CLUSTER_LAYER_ID,
        type: 'symbol',
        source: POINTS_SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: { 'icon-allow-overlap': true },
      });

      // Los clusters se dibujan como HTML markers (mismo estilo que antes con leaflet.markercluster).
      const clusterMarkers = new Map<number, maplibregl.Marker>();
      function renderClusters() {
        if (!m.getSource(POINTS_SOURCE_ID)) return;
        const features = m.querySourceFeatures(POINTS_SOURCE_ID, {
          filter: ['has', 'point_count'],
        });
        const seenIds = new Set<number>();
        features.forEach((feature: maplibregl.MapGeoJSONFeature) => {
          const clusterId = feature.properties?.cluster_id as number;
          const count = feature.properties?.point_count as number;
          if (clusterId == null || seenIds.has(clusterId)) return;
          seenIds.add(clusterId);
          const coords = (feature.geometry as GeoJSONPoint).coordinates as [
            number,
            number,
          ];
          let marker = clusterMarkers.get(clusterId);
          if (!marker) {
            const el = document.createElement('div');
            el.innerHTML = clusterPinHtml(count);
            marker = new maplibregl.Marker({
              element: el.firstElementChild as HTMLElement,
            });
            el.firstElementChild?.addEventListener('click', () => {
              const source = m.getSource(
                POINTS_SOURCE_ID,
              ) as maplibregl.GeoJSONSource;
              source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
                m.easeTo({ center: coords, zoom });
              });
            });
            clusterMarkers.set(clusterId, marker);
          }
          marker.setLngLat(coords).addTo(m);
        });
        clusterMarkers.forEach((marker, id) => {
          if (!seenIds.has(id)) {
            marker.remove();
            clusterMarkers.delete(id);
          }
        });
      }

      function renderAll() {
        renderClusters();
        renderIndividualMarkers();
      }

      m.on('data', renderAll);
      m.on('move', renderAll);
      renderAll();

      return () => {
        m.off('data', renderAll);
        m.off('move', renderAll);
        clusterMarkers.forEach((marker) => marker.remove());
        clearIndividualMarkers();
        if (m.getLayer(POINTS_CLUSTER_LAYER_ID))
          m.removeLayer(POINTS_CLUSTER_LAYER_ID);
        if (m.getSource(POINTS_SOURCE_ID)) m.removeSource(POINTS_SOURCE_ID);
      };
    }

    if (m.isStyleLoaded()) return setup();
    let cleanup: (() => void) | undefined;
    const onLoad = () => {
      cleanup = setup();
    };
    m.once('load', onLoad);
    return () => {
      m.off('load', onLoad);
      cleanup?.();
    };
  }, [map, points]);
}

const ROUTE_SOURCE_ID = 'salimos-route';
const ROUTE_GLOW_LAYER_ID = 'salimos-route-glow';
const ROUTE_LINE_LAYER_ID = 'salimos-route-line';

/** Dibuja la ruta como una única línea con degradado nativo de MapLibre (`line-gradient`). */
function useRouteLayer(
  map: maplibregl.Map | null,
  routeCoordinates?: [number, number][],
) {
  const startMarkerRef = React.useRef<maplibregl.Marker | null>(null);

  React.useEffect(() => {
    if (!map) return;
    const m = map;

    function clear() {
      if (m.getLayer(ROUTE_GLOW_LAYER_ID)) m.removeLayer(ROUTE_GLOW_LAYER_ID);
      if (m.getLayer(ROUTE_LINE_LAYER_ID)) m.removeLayer(ROUTE_LINE_LAYER_ID);
      if (m.getSource(ROUTE_SOURCE_ID)) m.removeSource(ROUTE_SOURCE_ID);
      startMarkerRef.current?.remove();
      startMarkerRef.current = null;
    }

    function setup() {
      clear();
      if (!routeCoordinates || routeCoordinates.length < 2) return;

      const coordinates = routeCoordinates.map(([lat, lng]) => [lng, lat]);
      m.addSource(ROUTE_SOURCE_ID, {
        type: 'geojson',
        lineMetrics: true,
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates },
        },
      });

      const gradient: unknown[] = [
        'interpolate',
        ['linear'],
        ['line-progress'],
      ];
      BRAND_GRADIENT.forEach((color, index) => {
        gradient.push(index / (BRAND_GRADIENT.length - 1), color);
      });

      m.addLayer({
        id: ROUTE_GLOW_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-gradient': gradient as never,
          'line-width': 12,
          'line-opacity': 0.18,
        },
      });
      m.addLayer({
        id: ROUTE_LINE_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-gradient': gradient as never,
          'line-width': 5,
          'line-opacity': 0.95,
        },
      });

      const start = document.createElement('div');
      start.style.cssText = `
        width: 14px; height: 14px; border-radius: 50%;
        background: ${colors.brandPink}; border: 3px solid #ffffff;
      `;
      startMarkerRef.current = new maplibregl.Marker({ element: start })
        .setLngLat(coordinates[0] as [number, number])
        .addTo(m);

      const bounds = coordinates.reduce(
        (b, c) => b.extend(c as [number, number]),
        new maplibregl.LngLatBounds(
          coordinates[0] as [number, number],
          coordinates[0] as [number, number],
        ),
      );
      m.fitBounds(bounds, { padding: 40 });
    }

    if (m.isStyleLoaded()) setup();
    else m.once('load', setup);

    return clear;
  }, [map, routeCoordinates]);
}

/** Blur del mapa mientras el hub está abierto (ver `MapViewProps.blurred`). */
const MAP_BLUR_PX = 6;
const MAP_BLUR_TRANSITION_MS = 300;

export function MapViewComponent({
  style,
  initialRegion,
  region,
  onPress,
  routeCoordinates,
  points = [],
  onPointPress,
  blurred,
  children,
}: MapViewProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [map, setMap] = React.useState<maplibregl.Map | null>(null);
  const center = region || initialRegion;
  const onPressRef = React.useRef(onPress);
  onPressRef.current = onPress;
  const discotecaMarkersRef = React.useRef<
    Map<string, { marker: maplibregl.Marker; firma: string }>
  >(new Map());

  const markers = React.Children.toArray(children).filter((child) => {
    if (!React.isValidElement(child)) return false;
    const props = child.props as Partial<MarkerProps>;
    return (
      !!props.coordinate &&
      (!!props.discoteca || !!props.title || !!props.children)
    );
  }) as React.ReactElement<MarkerProps>[];

  /** Id estable de un marcador, para poder actualizarlos uno a uno. */
  function markerId(marker: React.ReactElement<MarkerProps>, index: number) {
    return marker.props.discoteca?.slug ?? marker.props.title ?? String(index);
  }

  // Firma serializable de lo que se ve de cada marcador (sin `children`/`onPress`,
  // que no son serializables y con `children` en concreto rompían el
  // `JSON.stringify` al incluir un elemento React con referencias circulares).
  // Se compara por marcador: si un pin no cambia, no se toca su DOM.
  const markerSignatures = new Map(
    markers.map((marker, index) => {
      const { coordinate, discoteca, title, selected, hasAlerts, eventImage } =
        marker.props;
      return [
        markerId(marker, index),
        JSON.stringify({
          lat: coordinate.latitude,
          lng: coordinate.longitude,
          slug: discoteca?.slug,
          title,
          color: discoteca?.color,
          selected,
          hasAlerts,
          eventImage,
        }),
      ] as const;
    }),
  );
  const markersKey = [...markerSignatures.values()].join('|');

  // El handler de cada pin se lee siempre por referencia: así un marcador que
  // no ha cambiado visualmente puede seguir vivo sin quedarse con un closure
  // viejo.
  const markerPressRef = React.useRef<Map<string, () => void>>(new Map());
  markerPressRef.current = new Map(
    markers.map((marker, index) => [
      markerId(marker, index),
      () => marker.props.onPress?.(),
    ]),
  );

  React.useEffect(() => {
    if (!containerRef.current) return;
    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle as unknown as maplibregl.StyleSpecification,
      center: [center?.longitude ?? -6.2242, center?.latitude ?? 36.5982],
      zoom: 13,
    });
    instance.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'top-right',
    );
    instance.on('click', (event: maplibregl.MapMouseEvent) => {
      // Ignora los clicks que ya gestionó un marcador HTML (paran la propagación).
      onPressRef.current?.({
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      });
    });
    setMap(instance);
    return () => instance.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  usePointsClusterLayer(map, points, onPointPress);
  useRouteLayer(map, routeCoordinates);

  // Marcadores de discotecas: se actualizan uno a uno. Solo se recrea el DOM
  // del pin cuya firma cambió (p.ej. le llegó la foto del evento o se
  // seleccionó); el resto se queda tal cual. Recrearlos todos hacía que el
  // mapa parpadeara cada vez que entraba una foto, que llegan de una en una.
  React.useEffect(() => {
    if (!map) return;
    const m = map;
    const vivos = discotecaMarkersRef.current;

    markers.forEach((marker, index) => {
      const id = markerId(marker, index);
      const firma = markerSignatures.get(id) ?? '';
      const existente = vivos.get(id);
      if (existente?.firma === firma) return;
      existente?.marker.remove();

      const { coordinate, discoteca, title, selected, hasAlerts, eventImage } =
        marker.props;
      const nombre = discoteca?.nombre ?? title ?? 'Discoteca';
      const color = discoteca?.color ?? CATEGORY_COLORS.discoteca;

      const el = document.createElement('div');
      el.innerHTML = discotecaPinHtml({
        nombre,
        color,
        selected: Boolean(selected),
        hasAlerts: Boolean(hasAlerts),
        eventImage,
      });
      const markerEl = el.firstElementChild as HTMLElement;
      markerEl.addEventListener('click', (event) => {
        event.stopPropagation();
        markerPressRef.current.get(id)?.();
      });

      vivos.set(id, {
        firma,
        marker: new maplibregl.Marker({ element: markerEl, anchor: 'bottom' })
          .setLngLat([coordinate.longitude, coordinate.latitude])
          .addTo(m),
      });
    });

    vivos.forEach((entrada, id) => {
      if (!markerSignatures.has(id)) {
        entrada.marker.remove();
        vivos.delete(id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, markersKey]);

  // Al desmontar (o cambiar de mapa) se limpian todos de una vez.
  React.useEffect(() => {
    const vivos = discotecaMarkersRef.current;
    return () => {
      vivos.forEach((entrada) => entrada.marker.remove());
      vivos.clear();
    };
  }, [map]);

  return (
    <View style={[styles.webMap, style]}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          // `backdrop-filter` desde una capa encima no desenfoca el canvas
          // WebGL de MapLibre (limitación del navegador) — hay que aplicar
          // el blur directo acá, sobre el propio mapa.
          filter: blurred ? `blur(${MAP_BLUR_PX}px)` : 'none',
          transition: `filter ${MAP_BLUR_TRANSITION_MS}ms ease`,
        }}
      />
    </View>
  );
}

export function MarkerComponent({ children }: MarkerProps) {
  return <>{children}</>;
}

const styles = StyleSheet.create({
  webMap: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
});

export type { SimpleMapPoint } from './MapView.types';
