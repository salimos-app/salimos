import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Region, Discoteca } from '../types/discoteca';
import DiscotecaMarker from './DiscotecaMarker';

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

interface MapViewProps {
  children?: React.ReactNode;
  style?: any;
  initialRegion?: Region;
  region?: Region;
  onRegionChangeComplete?: (region: Region) => void;
  onPress?: () => void;
  customMapStyle?: any[];
  ref?: any;
}

export function MapViewComponent({ children, style, initialRegion, region, onRegionChangeComplete, onPress, customMapStyle }: MapViewProps) {
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
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

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
    selected: Boolean(marker.props.selected),
  }));
  const mapHtml = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;margin:0;background:#dfe8f6} .club{border:2px solid #fff;border-radius:14px;padding:7px 9px;background:rgba(12,10,22,.94);color:#fff;font:bold 11px sans-serif;white-space:nowrap;box-shadow:0 4px 12px #0008;text-align:center}</style></head>
<body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
const markers=${JSON.stringify(markerData).replace(/</g, '\\u003c')};
const map=L.map('map',{zoomControl:true}).setView([${center?.latitude ?? 36.5982},${center?.longitude ?? -6.2242}],13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
markers.forEach(item=>{const icon=L.divIcon({className:'',html:'<div class="club" style="border-color:'+item.color+'">'+item.title+'</div>',iconAnchor:[0,20]});L.marker([item.latitude,item.longitude],{icon}).addTo(map).on('click',()=>window.ReactNativeWebView.postMessage(JSON.stringify({type:'marker',index:item.index})));});
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
    backgroundColor: '#dfe8f6',
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