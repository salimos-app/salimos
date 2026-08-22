import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvent,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Discoteca } from '../types/discoteca';
import { colors } from '../theme/colors';
import {
  MarkerProps,
  MapViewProps,
  TILE_URL,
  TILE_ATTRIBUTION,
} from './MapView.types';

const DEFAULT_DISCOTECA_IMAGE =
  'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400';

// CartoDB Dark Matter (variante "nolabels"): tiles oscuros gratis y sin API
// key, a juego con el tema neón de la app. La variante "nolabels" quita los
// iconos de POI (iglesias, monumentos...) y nombres de lugares del propio
// mapa base, para que lo único que se vea sean nuestros marcadores.

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

function discotecaIcon(discoteca: Discoteca, selected: boolean) {
  return L.divIcon({
    className: 'club-pin',
    html: `
      <div style="
        position: relative;
        width: 88px;
        min-height: 50px;
        border-radius: 16px;
        background: rgba(12, 10, 22, 0.94);
        border: 2px solid ${selected ? '#ffffff' : '#1a1a1a'};
        box-shadow: 0 12px 24px rgba(0,0,0,.45);
        overflow: hidden;
        transform: translateY(-4px);
        display: flex;
        flex-direction: column;
        align-items: stretch;
      ">
        <div style="
          width: 100%;
          height: 30px;
          background-image: url('${discoteca.imagen}');
          background-size: cover;
          background-position: center;
          border-bottom: 1px solid rgba(255,255,255,0.18);
        "></div>
        <div style="
          padding: 4px 8px 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: linear-gradient(180deg, ${discoteca.color} 0%, rgba(0,0,0,0.1) 100%);
        ">
          <span style="
            color: #ffffff;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            line-height: 1.1;
            white-space: nowrap;
          ">${discoteca.nombre}</span>
        </div>
      </div>
    `,
    iconSize: [88, 62],
    iconAnchor: [44, 62],
    popupAnchor: [0, -52],
  });
}

function simplePointIcon(icon: string, color?: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: ${color ?? 'rgba(12, 10, 22, 0.94)'};
      border: 2px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      box-shadow: 0 4px 10px rgba(0,0,0,.4);
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

export function MapViewComponent({
  style,
  initialRegion,
  region,
  onPress,
  routeCoordinates,
  routeColor = '#00E5FF',
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
              )}
              eventHandlers={{ click: onMarkerPress ?? (() => undefined) }}
            >
              <Popup>{nombre}</Popup>
            </Marker>
          );
        })}

        {points.map((point) => (
          <Marker
            key={point.id}
            position={[point.latitude, point.longitude]}
            icon={simplePointIcon(point.icon ?? '📍', point.color)}
            eventHandlers={{ click: () => onPointPress?.(point) }}
          />
        ))}

        {routeCoordinates && routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{ color: routeColor, weight: 4 }}
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
