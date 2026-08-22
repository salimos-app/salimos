import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
  useMapEvent,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Discoteca } from '../types/discoteca';
import { colors, BRAND_GRADIENT } from '../theme/colors';
import { buildGradientSegments } from '../utils/gradient';
import {
  MarkerProps,
  MapViewProps,
  SimpleMapPoint,
  TILE_URL,
  TILE_ATTRIBUTION,
} from './MapView.types';

const DEFAULT_DISCOTECA_IMAGE =
  'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400';

/** Ancho del pin cuando muestra la foto del evento (grande, a su forma natural, sin redondear). */
const EVENT_PIN_IMAGE_SIZE = 100;
const EVENT_PIN_POINTER_HEIGHT = 10;

let themeInjected = false;
function injectLeafletTheme() {
  if (themeInjected || typeof document === 'undefined') return;
  themeInjected = true;
  const style = document.createElement('style');
  style.id = 'leaflet-salimos-theme';
  style.textContent = `
    .leaflet-control-zoom a {
      background-color: ${colors.backgroundLight} !important;
      color: ${colors.textPrimary} !important;
      border-color: ${colors.border} !important;
    }
    .leaflet-control-zoom a:hover {
      background-color: ${colors.backgroundCard} !important;
    }
    .leaflet-control-attribution {
      background: ${colors.background}CC !important;
      color: ${colors.textSecondary} !important;
    }
    .leaflet-control-attribution a {
      color: ${colors.neonPink} !important;
    }
    .leaflet-popup-content-wrapper {
      background: ${colors.backgroundCard} !important;
      color: ${colors.textPrimary} !important;
      border-radius: 12px !important;
    }
    .leaflet-popup-tip {
      background: ${colors.backgroundCard} !important;
    }
  `;
  document.head.appendChild(style);
}

/** Badge de alerta activa (estilo Waze), pegado a la esquina superior-izquierda del pin. */
const ALERT_BADGE_HTML = `
  <div style="
    position: absolute;
    top: -2px;
    left: -4px;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: ${colors.warning};
    border: 2px solid ${colors.background};
    box-shadow: 0 0 0 1px rgba(0,0,0,.35);
  "></div>
`;

/** Etiqueta con el nombre, común a los dos diseños de pin. */
function pinNameLabel(discoteca: Discoteca, selected: boolean) {
  return `
    <div style="
      max-width: 132px;
      background: ${colors.backgroundCard}F5;
      border: 1px solid ${selected ? discoteca.color : colors.borderLight};
      border-radius: 8px;
      padding: 3px 8px;
      margin-bottom: 3px;
      box-shadow: 0 4px 10px rgba(0,0,0,.4)${selected ? `, 0 0 0 3px ${discoteca.color}40` : ''};
    ">
      <span style="
        display: block;
        color: #ffffff;
        font-size: 10.5px;
        font-weight: 800;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: -apple-system, system-ui, sans-serif;
      ">${discoteca.nombre}</span>
    </div>
  `;
}

/**
 * Pin de discoteca: si hay foto del evento del día, esa foto ES el pin (a su
 * forma natural, sin recortar ni redondear); si no, cae al diseño anterior
 * (inicial sobre el color de marca).
 */
function discotecaIcon(
  discoteca: Discoteca,
  selected: boolean,
  hasAlerts?: boolean,
  eventImage?: string,
) {
  if (eventImage) {
    const width = EVENT_PIN_IMAGE_SIZE;
    const pointer = EVENT_PIN_POINTER_HEIGHT;
    // Alto asumido para posicionar el pin (la imagen real puede diferir
    // levemente según su proporción; no se recorta como hace `object-fit`).
    const assumedHeight = width + pointer;
    return L.divIcon({
      className: 'club-pin',
      html: `
        <div style="width:140px; display:flex; flex-direction:column; align-items:center; transform: scale(${selected ? 1.06 : 1}); transform-origin: 50% 100%; transition: transform .15s ease;">
          ${pinNameLabel(discoteca, selected)}
          <div style="position: relative; width: ${width}px; filter: drop-shadow(0 6px 10px rgba(0,0,0,.5));">
            <img src="${eventImage}" style="
              display: block;
              width: ${width}px;
              height: auto;
              border: 3px solid ${selected ? '#ffffff' : discoteca.color};
              box-sizing: border-box;
            " />
            <div style="
              width: 0;
              height: 0;
              margin: 0 auto;
              border-left: 8px solid transparent;
              border-right: 8px solid transparent;
              border-top: ${pointer}px solid ${discoteca.color};
            "></div>
            ${hasAlerts ? ALERT_BADGE_HTML : ''}
          </div>
        </div>
      `,
      iconSize: [140, 26 + assumedHeight],
      iconAnchor: [70, 24 + assumedHeight],
      popupAnchor: [0, -(24 + assumedHeight)],
    });
  }

  const initial = (discoteca.nombre || '?').charAt(0).toUpperCase();
  return L.divIcon({
    className: 'club-pin',
    html: `
      <div style="width:140px; display:flex; flex-direction:column; align-items:center; transform: scale(${selected ? 1.1 : 1}); transform-origin: 50% 100%; transition: transform .15s ease;">
        ${pinNameLabel(discoteca, selected)}
        <div style="position: relative; width: 36px; height: 42px; filter: drop-shadow(0 6px 8px rgba(0,0,0,.45));">
          <svg width="36" height="42" viewBox="0 0 36 42">
            <path d="M18,2 C25.7,2 32,8.3 32,16 C32,22.4 27,28.4 18,40 C9,28.4 4,22.4 4,16 C4,8.3 10.3,2 18,2 Z"
              fill="${discoteca.color}" stroke="${selected ? '#ffffff' : '#0A0A10'}" stroke-width="${selected ? 2.5 : 1.5}"/>
          </svg>
          <div style="position:absolute; top:8px; left:0; right:0; text-align:center; color:#ffffff; font-weight:800; font-size:14px; font-family:-apple-system, system-ui, sans-serif; text-shadow:0 1px 3px rgba(0,0,0,.45);">${initial}</div>
          ${hasAlerts ? ALERT_BADGE_HTML : ''}
        </div>
      </div>
    `,
    iconSize: [140, 68],
    iconAnchor: [70, 66],
    popupAnchor: [0, -66],
  });
}

/** Icono de cluster (grupo de puntos comprimidos al alejar el mapa), con el acento de marca. */
function clusterIconOptions(count: number) {
  const size = count < 10 ? 36 : count < 25 ? 44 : 52;
  const fontSize = count < 10 ? 12 : count < 25 ? 13.5 : 15;
  return {
    className: '',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${colors.backgroundCard}F2;
      border: 2.5px solid ${colors.brandPink};
      box-shadow: 0 0 0 4px ${colors.brandPink}26, 0 8px 18px rgba(0,0,0,.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 800;
      font-size: ${fontSize}px;
      font-family: -apple-system, system-ui, sans-serif;
    ">${count}</div>`,
    iconSize: [size, size] as [number, number],
    iconAnchor: [size / 2, size / 2] as [number, number],
  };
}

function simplePointIcon(icon: string, color?: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: ${color ?? colors.backgroundCard};
      border: 2.5px solid ${colors.background};
      box-shadow: 0 0 0 1.5px rgba(255,255,255,0.55), 0 6px 14px rgba(0,0,0,.45);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    ">${icon}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

function MapClickHandler({ onPress }: { onPress?: () => void }) {
  useMapEvent('click', () => onPress?.());
  return null;
}

/**
 * Agrupa los puntos genéricos (taxis, bares, supermercados...) en clusters
 * cuando el mapa está alejado, para que no se amontonen. Se maneja de forma
 * imperativa (fuera de los componentes declarativos de react-leaflet) porque
 * leaflet.markercluster no tiene binding oficial para react-leaflet v5.
 */
function PointsClusterLayer({
  points,
  onPointPress,
}: {
  points: SimpleMapPoint[];
  onPointPress?: (point: SimpleMapPoint) => void;
}) {
  const map = useMap();
  const onPointPressRef = React.useRef(onPointPress);
  onPointPressRef.current = onPointPress;

  React.useEffect(() => {
    const group = (
      L as unknown as {
        markerClusterGroup: (options: Record<string, unknown>) => L.LayerGroup;
      }
    ).markerClusterGroup({
      maxClusterRadius: 56,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster: { getChildCount: () => number }) =>
        L.divIcon(clusterIconOptions(cluster.getChildCount())),
    });

    points.forEach((point) => {
      const marker = L.marker([point.latitude, point.longitude], {
        icon: simplePointIcon(point.icon ?? '📍', point.color),
      });
      marker.on('click', () => onPointPressRef.current?.(point));
      group.addLayer(marker);
    });

    map.addLayer(group);
    return () => {
      map.removeLayer(group);
    };
  }, [map, points]);

  return null;
}

export function MapViewComponent({
  style,
  initialRegion,
  region,
  onPress,
  routeCoordinates,
  points = [],
  onPointPress,
  children,
}: MapViewProps) {
  React.useEffect(injectLeafletTheme, []);

  const center = region || initialRegion;
  const markers = React.Children.toArray(children).filter((child) => {
    if (!React.isValidElement(child)) return false;
    const props = child.props as Partial<MarkerProps>;
    return (
      !!props.coordinate &&
      (!!props.discoteca || !!props.title || !!props.children)
    );
  }) as React.ReactElement<MarkerProps>[];

  const routeSegments = routeCoordinates
    ? buildGradientSegments(routeCoordinates, BRAND_GRADIENT)
    : [];

  return (
    <View style={[styles.webMap, style]}>
      <MapContainer
        center={[center?.latitude ?? 36.5982, center?.longitude ?? -6.2242]}
        zoom={13}
        scrollWheelZoom
        style={{ width: '100%', height: '100%' }}
      >
        <MapClickHandler onPress={onPress} />
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />

        {markers.map((marker, index) => {
          const {
            coordinate,
            onPress: onMarkerPress,
            discoteca,
            title,
            selected,
            hasAlerts,
            eventImage,
          } = marker.props;
          const nombre = discoteca?.nombre ?? title ?? 'Discoteca';
          const color = discoteca?.color ?? '#ff4d4d';
          const discotecaFallback: Discoteca = {
            ...discoteca,
            nombre,
            color,
            imagen: discoteca?.imagen ?? DEFAULT_DISCOTECA_IMAGE,
          } as Discoteca;
          const position: [number, number] = [
            coordinate.latitude,
            coordinate.longitude,
          ];

          return (
            <Marker
              key={`${discoteca?.id ?? title ?? 'marker'}-${index}`}
              position={position}
              icon={discotecaIcon(
                discoteca ?? discotecaFallback,
                Boolean(selected),
                Boolean(hasAlerts),
                eventImage,
              )}
              eventHandlers={{ click: onMarkerPress ?? (() => undefined) }}
            >
              <Popup>{nombre}</Popup>
            </Marker>
          );
        })}

        <PointsClusterLayer points={points} onPointPress={onPointPress} />

        {routeSegments.map((segment, index) => (
          <Polyline
            key={`route-glow-${index}`}
            positions={segment.positions}
            pathOptions={{
              color: segment.color,
              weight: 12,
              opacity: 0.18,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        ))}
        {routeSegments.map((segment, index) => (
          <Polyline
            key={`route-line-${index}`}
            positions={segment.positions}
            pathOptions={{
              color: segment.color,
              weight: 5,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        ))}
        {routeCoordinates && routeCoordinates.length > 1 && (
          <CircleMarker
            center={routeCoordinates[0]}
            radius={7}
            pathOptions={{
              color: '#ffffff',
              weight: 3,
              fillColor: colors.brandPink,
              fillOpacity: 1,
            }}
          />
        )}
      </MapContainer>
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
