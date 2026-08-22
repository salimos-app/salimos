import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Region, Discoteca } from '../types/discoteca';
import DiscotecaMarker from './DiscotecaMarker';
import { colors } from '../theme/colors';

// CartoDB Dark Matter (variante "nolabels"): tiles oscuros gratis y sin API
// key, a juego con el tema neón de la app. La variante "nolabels" quita los
// iconos de POI (iglesias, monumentos...) y nombres de lugares del propio
// mapa base, para que lo único que se vea sean nuestros marcadores.
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

interface MarkerProps {
  coordinate: { latitude: number; longitude: number };
  title?: string;
  pinColor?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  tracksViewChanges?: boolean;
  discoteca?: Discoteca;
  selected?: boolean;
}

/** Punto genérico en el mapa (paradas de taxi, bares, supermercados...). */
export interface SimpleMapPoint {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
  sublabel?: string;
  icon?: string;
  /** Color de fondo del pin, para agrupar visualmente por categoría. */
  color?: string;
  /** Categoría (taxi, bar, pub, supermarket, convenience...) para lógica específica en la UI. */
  kind?: string;
  /** Teléfono de contacto, si lo tiene (p.ej. paradas de taxi → botón de llamar). */
  phone?: string;
}

interface MapViewProps {
  children?: React.ReactNode;
  style?: any;
  initialRegion?: Region;
  region?: Region;
  onRegionChangeComplete?: (region: Region) => void;
  onPress?: () => void;
  customMapStyle?: any[];
  /** Puntos [latitud, longitud] de una ruta a dibujar sobre el mapa. */
  routeCoordinates?: [number, number][];
  routeColor?: string;
  /** Puntos genéricos (no discotecas) a marcar en el mapa. */
  points?: SimpleMapPoint[];
  /** Se llama al tocar uno de `points` (abre la tarjeta correspondiente en la app). */
  onPointPress?: (point: SimpleMapPoint) => void;
  ref?: any;
}

export function MapViewComponent({
  children,
  style,
  initialRegion,
  region,
  onRegionChangeComplete,
  onPress,
  customMapStyle,
  routeCoordinates,
  routeColor = '#00E5FF',
  points = [],
  onPointPress,
}: MapViewProps) {
  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const id = 'leaflet-salimos-theme';
    if (document.getElementById(id)) return;

    const style = document.createElement('style');
    style.id = id;
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
  }, []);

  if (Platform.OS === 'web') {
    const center = region || initialRegion;
    const markers = React.Children.toArray(children).filter((child: any) => {
      if (!React.isValidElement(child)) return false;
      const props = child.props as Partial<MarkerProps>;
      return !!props.coordinate && (!!props.discoteca || !!props.title || !!props.children);
    });

    const MapContainer = require('react-leaflet').MapContainer;
    const TileLayer = require('react-leaflet').TileLayer;
    const Marker = require('react-leaflet').Marker;
    const Popup = require('react-leaflet').Popup;
    const Polyline = require('react-leaflet').Polyline;
    const L = require('leaflet');
    require('leaflet/dist/leaflet.css');

    const defaultIcon = (discoteca: Discoteca, selected: boolean) =>
      L.divIcon({
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

    const simplePointIcon = (icon: string, color?: string) =>
      L.divIcon({
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

    return (
      <View style={[styles.webMap, style]}>
        <MapContainer
          center={[center?.latitude ?? 36.5982, center?.longitude ?? -6.2242]}
          zoom={13}
          scrollWheelZoom
          style={{ width: '100%', height: '100%' }}
          eventHandlers={{
            click: () => onPress?.(),
          }}
        >
          <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />

          {markers.map((marker: any, index: number) => {
            const { coordinate, onPress, discoteca, title, selected } = marker.props;
            const nombre = discoteca?.nombre ?? title ?? 'Discoteca';
            const color = discoteca?.color ?? '#ff4d4d';
            const discotecaFallback = {
              ...discoteca,
              nombre,
              color,
              imagen: discoteca?.imagen ?? 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400',
            } as Discoteca;
            const position: [number, number] = [coordinate.latitude, coordinate.longitude];

            return (
              <Marker
                key={`${discoteca?.id ?? title ?? 'marker'}-${index}`}
                position={position}
                icon={defaultIcon(discoteca ?? discotecaFallback, Boolean(selected))}
                eventHandlers={{ click: onPress ?? (() => undefined) }}
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
            <Polyline positions={routeCoordinates} pathOptions={{ color: routeColor, weight: 4 }} />
          )}
        </MapContainer>
      </View>
    );
  }

  const markers = React.Children.toArray(children).filter((child: any) => {
    return React.isValidElement(child) && Boolean((child as React.ReactElement<MarkerProps>).props.coordinate);
  }) as React.ReactElement<MarkerProps>[];
  const center = region || initialRegion;
  const markerData = markers.map((marker, index) => ({
    index,
    latitude: marker.props.coordinate.latitude,
    longitude: marker.props.coordinate.longitude,
    title: marker.props.title ?? 'Discoteca',
    color: marker.props.discoteca?.color ?? '#ff4d4d',
    image: marker.props.discoteca?.imagen ?? 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400',
    selected: Boolean(marker.props.selected),
  }));
  const mapHtml = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>
html,body,#map{height:100%;margin:0;background:${colors.background}}
.club{display:inline-flex;flex-direction:column;align-items:stretch;width:92px;transform:translateX(-50%);overflow:hidden;border:2px solid #fff;border-radius:14px;background:rgba(12,10,22,.96);color:#fff;font:bold 11px sans-serif;white-space:nowrap;box-shadow:0 4px 12px #0008;text-align:center}
.club-image{width:100%;height:32px;background-position:center;background-size:cover}
.club-name{padding:5px 6px;overflow:hidden;text-overflow:ellipsis;background:linear-gradient(180deg,var(--club-color),rgba(12,10,22,.96));}
.simple-point{width:30px;height:30px;border-radius:50%;background:rgba(12,10,22,.94);border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 4px 10px #0006}
.leaflet-control-zoom a{background-color:${colors.backgroundLight} !important;color:${colors.textPrimary} !important;border-color:${colors.border} !important}
.leaflet-control-attribution{background:${colors.background}CC !important;color:${colors.textSecondary} !important}
.leaflet-control-attribution a{color:${colors.neonPink} !important}
</style></head>
<body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
const markers=${JSON.stringify(markerData).replace(/</g, '\\u003c')};
const route=${JSON.stringify(routeCoordinates ?? []).replace(/</g, '\\u003c')};
const points=${JSON.stringify(points).replace(/</g, '\\u003c')};
const map=L.map('map',{zoomControl:true}).setView([${center?.latitude ?? 36.5982},${center?.longitude ?? -6.2242}],13);
L.tileLayer('${TILE_URL}',{attribution:${JSON.stringify(TILE_ATTRIBUTION)}}).addTo(map);
markers.forEach(item=>{const icon=L.divIcon({className:'',html:'<div class="club" style="border-color:'+item.color+';--club-color:'+item.color+'"><div class="club-image" style="background-image:url(&quot;'+item.image+'&quot;)" ></div><div class="club-name">'+item.title+'</div></div>',iconAnchor:[0,20]});L.marker([item.latitude,item.longitude],{icon}).addTo(map).on('click',()=>window.ReactNativeWebView.postMessage(JSON.stringify({type:'marker',index:item.index})));});
points.forEach(p=>{const icon=L.divIcon({className:'',html:'<div class="simple-point" style="background:'+(p.color||'rgba(12,10,22,.94)')+'">'+(p.icon||'📍')+'</div>',iconSize:[30,30],iconAnchor:[15,15],popupAnchor:[0,-15]});L.marker([p.latitude,p.longitude],{icon}).addTo(map).on('click',()=>window.ReactNativeWebView.postMessage(JSON.stringify({type:'point',id:p.id})));});
if(route.length>1){const line=L.polyline(route,{color:'${routeColor}',weight:4}).addTo(map);map.fitBounds(line.getBounds(),{padding:[40,40]});}
map.on('click',()=>window.ReactNativeWebView.postMessage(JSON.stringify({type:'map'})));
</script></body></html>`;

  return (
    <WebView
      style={style}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      source={{ html: mapHtml }}
      onMessage={(event) => {
        try {
          const message = JSON.parse(event.nativeEvent.data);
          if (message.type === 'marker' && markers[message.index]?.props.onPress) {
            markers[message.index].props.onPress?.();
          } else if (message.type === 'point') {
            const point = points.find((p) => p.id === message.id);
            if (point) onPointPress?.(point);
          } else if (message.type === 'map') {
            onPress?.();
          }
        } catch {
          // Ignora mensajes inválidos del mapa.
        }
      }}
    />
  );
}

export function MarkerComponent({ coordinate, title, pinColor, onPress, children, tracksViewChanges, discoteca, selected }: MarkerProps) {
  if (Platform.OS === 'web') {
    return <>{children}</>;
  }

  return null;
}

const styles = StyleSheet.create({
  webMap: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  webMarkerLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
    pointerEvents: 'none',
  },
  webMarkerContainer: {
    position: 'absolute',
    width: 0,
    height: 0,
    zIndex: 2,
    pointerEvents: 'auto',
    transform: [{ translateX: -18 }, { translateY: -40 }],
  },
});