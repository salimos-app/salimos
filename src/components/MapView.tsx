import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../theme/colors';
import {
  MarkerProps,
  MapViewProps,
  TILE_URL,
  TILE_ATTRIBUTION,
} from './MapView.types';

const DEFAULT_DISCOTECA_IMAGE =
  'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400';

function toJsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function buildMapHtml({
  center,
  markers,
  route,
  points,
  routeColor,
}: {
  center: { latitude: number; longitude: number };
  markers: {
    index: number;
    latitude: number;
    longitude: number;
    title: string;
    color: string;
    image: string;
  }[];
  route: [number, number][];
  points: MapViewProps['points'];
  routeColor: string;
}): string {
  return `<!doctype html>
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
const markers=${toJsonForScript(markers)};
const route=${toJsonForScript(route)};
const points=${toJsonForScript(points ?? [])};
const map=L.map('map',{zoomControl:true}).setView([${center.latitude},${center.longitude}],13);
L.tileLayer('${TILE_URL}',{attribution:${JSON.stringify(TILE_ATTRIBUTION)}}).addTo(map);
markers.forEach(item=>{const icon=L.divIcon({className:'',html:'<div class="club" style="border-color:'+item.color+';--club-color:'+item.color+'"><div class="club-image" style="background-image:url(&quot;'+item.image+'&quot;)" ></div><div class="club-name">'+item.title+'</div></div>',iconAnchor:[0,20]});L.marker([item.latitude,item.longitude],{icon}).addTo(map).on('click',()=>window.ReactNativeWebView.postMessage(JSON.stringify({type:'marker',index:item.index})));});
points.forEach(p=>{const icon=L.divIcon({className:'',html:'<div class="simple-point" style="background:'+(p.color||'rgba(12,10,22,.94)')+'">'+(p.icon||'📍')+'</div>',iconSize:[30,30],iconAnchor:[15,15],popupAnchor:[0,-15]});L.marker([p.latitude,p.longitude],{icon}).addTo(map).on('click',()=>window.ReactNativeWebView.postMessage(JSON.stringify({type:'point',id:p.id})));});
if(route.length>1){const line=L.polyline(route,{color:'${routeColor}',weight:4}).addTo(map);map.fitBounds(line.getBounds(),{padding:[40,40]});}
map.on('click',()=>window.ReactNativeWebView.postMessage(JSON.stringify({type:'map'})));
</script></body></html>`;
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
  const markers = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<MarkerProps> =>
      React.isValidElement(child) &&
      Boolean((child as React.ReactElement<MarkerProps>).props.coordinate),
  );
  const center = region || initialRegion;
  const markerData = markers.map((marker, index) => ({
    index,
    latitude: marker.props.coordinate.latitude,
    longitude: marker.props.coordinate.longitude,
    title: marker.props.title ?? 'Discoteca',
    color: marker.props.discoteca?.color ?? '#ff4d4d',
    image: marker.props.discoteca?.imagen ?? DEFAULT_DISCOTECA_IMAGE,
  }));

  const mapHtml = buildMapHtml({
    center: {
      latitude: center?.latitude ?? 36.5982,
      longitude: center?.longitude ?? -6.2242,
    },
    markers: markerData,
    route: routeCoordinates ?? [],
    points,
    routeColor,
  });

  return (
    <View style={[styles.container, style]}>
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        source={{ html: mapHtml }}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (
              message.type === 'marker' &&
              markers[message.index]?.props.onPress
            ) {
              markers[message.index].props.onPress?.();
            } else if (message.type === 'point') {
              const point = points?.find((p) => p.id === message.id);
              if (point) onPointPress?.(point);
            } else if (message.type === 'map') {
              onPress?.();
            }
          } catch {
            // Ignora mensajes inválidos del mapa.
          }
        }}
      />
    </View>
  );
}

export function MarkerComponent(_props: MarkerProps) {
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export type { SimpleMapPoint } from './MapView.types';
