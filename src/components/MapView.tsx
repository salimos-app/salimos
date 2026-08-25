import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, BRAND_GRADIENT } from '../theme/colors';
import {
  MarkerProps,
  MapViewProps,
  TILE_URL,
  TILE_ATTRIBUTION,
} from './MapView.types';

function toJsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function buildMapHtml({
  center,
  markers,
  route,
  points,
  gradientStops,
}: {
  center: { latitude: number; longitude: number };
  markers: {
    index: number;
    latitude: number;
    longitude: number;
    title: string;
    color: string;
    selected: boolean;
    hasAlerts: boolean;
    eventImage: string | null;
  }[];
  route: [number, number][];
  points: MapViewProps['points'];
  gradientStops: readonly string[];
}): string {
  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css">
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css">
<style>
html,body,#map{height:100%;margin:0;background:${colors.background}}
.simple-point{width:30px;height:30px;border-radius:50%;border:2.5px solid ${colors.background};box-shadow:0 0 0 1.5px rgba(255,255,255,.55),0 6px 14px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font-size:14px}
.leaflet-control-zoom a{background-color:${colors.backgroundLight} !important;color:${colors.textPrimary} !important;border-color:${colors.border} !important}
.leaflet-control-attribution{background:${colors.background}CC !important;color:${colors.textSecondary} !important}
.leaflet-control-attribution a{color:${colors.neonPink} !important}
</style></head>
<body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script><script>
const markers=${toJsonForScript(markers)};
const route=${toJsonForScript(route)};
const points=${toJsonForScript(points ?? [])};
const gradientStops=${toJsonForScript(gradientStops)};
const EVENT_PIN_WIDTH=100;
const EVENT_PIN_POINTER_HEIGHT=10;
function hexToRgb(hex){const v=parseInt(hex.replace('#',''),16);return [(v>>16)&255,(v>>8)&255,v&255];}
function toHex(n){return Math.round(Math.min(255,Math.max(0,n))).toString(16).padStart(2,'0');}
function colorAt(stops,t){t=Math.min(1,Math.max(0,t));const scaled=t*(stops.length-1);const i=Math.min(stops.length-2,Math.floor(scaled));const lt=scaled-i;const [r1,g1,b1]=hexToRgb(stops[i]);const [r2,g2,b2]=hexToRgb(stops[i+1]);return '#'+toHex(r1+(r2-r1)*lt)+toHex(g1+(g2-g1)*lt)+toHex(b1+(b2-b1)*lt);}
function pinNameLabelHtml(item){
  const sel=!!item.selected;
  return '<div style="max-width:132px;background:${colors.backgroundCard}F5;border:1px solid '+(sel?item.color:'${colors.borderLight}')+';border-radius:8px;padding:3px 8px;margin-bottom:3px;box-shadow:0 4px 10px rgba(0,0,0,.4)'+(sel?', 0 0 0 3px '+item.color+'40':'')+';">'
    +'<span style="display:block;color:#fff;font-size:10.5px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:-apple-system,system-ui,sans-serif;">'+item.title+'</span></div>';
}
function discotecaPinHtml(item){
  const initial=(item.title||'?').charAt(0).toUpperCase();
  const sel=!!item.selected;
  const alertBadge=item.hasAlerts?'<div style="position:absolute;top:-2px;left:-4px;width:15px;height:15px;border-radius:50%;background:${colors.warning};border:2px solid ${colors.background};box-shadow:0 0 0 1px rgba(0,0,0,.35);"></div>':'';
  if(item.eventImage){
    const assumedHeight=EVENT_PIN_WIDTH+EVENT_PIN_POINTER_HEIGHT;
    const html='<div style="width:140px;display:flex;flex-direction:column;align-items:center;transform:scale('+(sel?1.06:1)+');transform-origin:50% 100%;transition:transform .15s ease;">'
      +pinNameLabelHtml(item)
      +'<div style="position:relative;width:'+EVENT_PIN_WIDTH+'px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.5));">'
      +'<img src="'+item.eventImage+'" style="display:block;width:'+EVENT_PIN_WIDTH+'px;height:auto;border:3px solid '+(sel?'#ffffff':item.color)+';box-sizing:border-box;" />'
      +'<div style="width:0;height:0;margin:0 auto;border-left:8px solid transparent;border-right:8px solid transparent;border-top:'+EVENT_PIN_POINTER_HEIGHT+'px solid '+item.color+';"></div>'
      +alertBadge+'</div></div>';
    return { html, iconSize:[140,26+assumedHeight], iconAnchor:[70,24+assumedHeight] };
  }
  const html='<div style="width:140px;display:flex;flex-direction:column;align-items:center;transform:scale('+(sel?1.1:1)+');transform-origin:50% 100%;transition:transform .15s ease;">'
    +pinNameLabelHtml(item)
    +'<div style="position:relative;width:36px;height:42px;filter:drop-shadow(0 6px 8px rgba(0,0,0,.45));">'
    +'<svg width="36" height="42" viewBox="0 0 36 42"><path d="M18,2 C25.7,2 32,8.3 32,16 C32,22.4 27,28.4 18,40 C9,28.4 4,22.4 4,16 C4,8.3 10.3,2 18,2 Z" fill="'+item.color+'" stroke="'+(sel?'#ffffff':'${colors.background}')+'" stroke-width="'+(sel?2.5:1.5)+'"/></svg>'
    +'<div style="position:absolute;top:8px;left:0;right:0;text-align:center;color:#fff;font-weight:800;font-size:14px;font-family:-apple-system,system-ui,sans-serif;text-shadow:0 1px 3px rgba(0,0,0,.45);">'+initial+'</div>'
    +alertBadge+'</div></div>';
  return { html, iconSize:[140,68], iconAnchor:[70,66] };
}
function clusterIconOptions(count){
  const size=count<10?36:count<25?44:52;
  const fontSize=count<10?12:count<25?13.5:15;
  const html='<div style="width:'+size+'px;height:'+size+'px;border-radius:50%;background:${colors.backgroundCard}F2;border:2.5px solid ${colors.brandPink};box-shadow:0 0 0 4px ${colors.brandPink}26,0 8px 18px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:'+fontSize+'px;font-family:-apple-system,system-ui,sans-serif;">'+count+'</div>';
  return {html,size};
}
const map=L.map('map',{zoomControl:true}).setView([${center.latitude},${center.longitude}],13);
L.tileLayer('${TILE_URL}',{attribution:${JSON.stringify(TILE_ATTRIBUTION)}}).addTo(map);
markers.forEach(item=>{const pin=discotecaPinHtml(item);const icon=L.divIcon({className:'club-pin',html:pin.html,iconSize:pin.iconSize,iconAnchor:pin.iconAnchor,popupAnchor:[0,-pin.iconAnchor[1]]});L.marker([item.latitude,item.longitude],{icon}).addTo(map).on('click',()=>window.ReactNativeWebView.postMessage(JSON.stringify({type:'marker',index:item.index})));});
const pointsCluster=L.markerClusterGroup({maxClusterRadius:56,spiderfyOnMaxZoom:true,showCoverageOnHover:false,iconCreateFunction:function(cluster){const o=clusterIconOptions(cluster.getChildCount());return L.divIcon({className:'',html:o.html,iconSize:[o.size,o.size],iconAnchor:[o.size/2,o.size/2]});}});
points.forEach(p=>{const icon=L.divIcon({className:'',html:'<div class="simple-point" style="background:'+(p.color||'${colors.backgroundCard}')+'">'+(p.icon||'📍')+'</div>',iconSize:[30,30],iconAnchor:[15,15],popupAnchor:[0,-15]});const marker=L.marker([p.latitude,p.longitude],{icon});marker.on('click',()=>window.ReactNativeWebView.postMessage(JSON.stringify({type:'point',id:p.id})));pointsCluster.addLayer(marker);});
map.addLayer(pointsCluster);
if(route.length>1){
  const last=route.length-2;
  const bounds=[];
  for(let i=0;i<route.length-1;i++){
    const t=last===0?0:i/last;
    const color=colorAt(gradientStops,t);
    const seg=[route[i],route[i+1]];
    L.polyline(seg,{color,weight:12,opacity:.18,lineCap:'round',lineJoin:'round'}).addTo(map);
    L.polyline(seg,{color,weight:5,opacity:.95,lineCap:'round',lineJoin:'round'}).addTo(map);
    bounds.push(seg[0],seg[1]);
  }
  L.circleMarker(route[0],{radius:7,color:'#ffffff',weight:3,fillColor:'${colors.brandPink}',fillOpacity:1}).addTo(map);
  map.fitBounds(bounds,{padding:[40,40]});
}
map.on('click',(e)=>window.ReactNativeWebView.postMessage(JSON.stringify({type:'map',lat:e.latlng.lat,lng:e.latlng.lng})));
</script></body></html>`;
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
    selected: Boolean(marker.props.selected),
    hasAlerts: Boolean(marker.props.hasAlerts),
    eventImage: marker.props.eventImage ?? null,
  }));

  const mapHtml = buildMapHtml({
    center: {
      latitude: center?.latitude ?? 36.5982,
      longitude: center?.longitude ?? -6.2242,
    },
    markers: markerData,
    route: routeCoordinates ?? [],
    points,
    gradientStops: BRAND_GRADIENT,
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
              onPress?.(
                typeof message.lat === 'number' && typeof message.lng === 'number'
                  ? { latitude: message.lat, longitude: message.lng }
                  : undefined,
              );
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
