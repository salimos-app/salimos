import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, BRAND_GRADIENT } from '../theme/colors';
import { MAP_FONT_STYLESHEET_URL } from '../theme/mapPins';
import { CATEGORY_COLORS } from '../theme/categoryColors';
import {
  CLUSTER_SIZE_THRESHOLDS,
  clusterPinHtml,
  discotecaPinHtml,
  pointPinHtml,
} from '../theme/mapPinHtml';
import { mapStyle, MarkerProps, MapViewProps, SimpleMapPoint } from './MapView.types';

function toJsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/** Id estable de un marcador de discoteca, para poder actualizarlo sin recrear el resto. */
function markerId(marker: React.ReactElement<MarkerProps>, index: number): string {
  return marker.props.discoteca?.slug ?? marker.props.title ?? String(index);
}

interface MarkerDatum {
  id: string;
  latitude: number;
  longitude: number;
  /** HTML del pin ya construido (`mapPinHtml.ts`): el WebView solo lo inserta. */
  html: string;
}

/** Marcador de posición del número dentro de las plantillas de cluster. */
const CLUSTER_COUNT_PLACEHOLDER = '{{count}}';

/**
 * Plantillas del pin de punto, deduplicadas: los puntos de una misma
 * categoría comparten HTML, así que se manda una vez por categoría y cada
 * punto solo lleva su clave.
 */
function pointPinTemplates(points: SimpleMapPoint[]) {
  const templates: Record<string, string> = {};
  const items = points.map((point) => {
    const pinKey = `${point.kind ?? ''}|${point.icon ?? ''}|${point.color ?? ''}`;
    templates[pinKey] ??= pointPinHtml(point.kind, point.icon, point.color);
    return { ...point, pinKey };
  });
  return { items, templates };
}

/**
 * HTML/JS de MapLibre GL, construido UNA SOLA VEZ por montaje (ver
 * `useMemo` más abajo). Los datos (marcadores, puntos, ruta) no se
 * embeben aquí: llegan después vía `injectJavaScript`, a través de
 * `window.updateMarkers/updatePoints/updateRoute`. Antes esta función se
 * reconstruía en cada render con los datos embebidos y se pasaba como
 * `source={{html}}` nuevo cada vez, lo que forzaba a WebView a recargar
 * la página entera (reinicializar MapLibre, redescargar tiles, recrear
 * todos los pines) por cada cambio de estado, por pequeño que fuera —
 * grave en una app con alertas en vivo por WebSocket. Actualizar el mapa
 * ya vivo, como aquí, es el mismo enfoque que ya usa `MapView.web.tsx`.
 */
function buildMapHtml({
  center,
  gradientStops,
}: {
  center: { latitude: number; longitude: number };
  gradientStops: readonly string[];
}): string {
  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.css">
<link rel="stylesheet" href="${MAP_FONT_STYLESHEET_URL}">
<style>
html,body,#map{height:100%;margin:0;background:${colors.background}}
.maplibregl-ctrl-attrib{background:${colors.background}CC !important;color:${colors.textSecondary} !important}
.maplibregl-ctrl-attrib a{color:${colors.neonPink} !important}
</style></head>
<body><div id="map"></div><script src="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.js"></script><script>
const mapStyle=${toJsonForScript(mapStyle)};
const gradientStops=${toJsonForScript(gradientStops)};
const clusterTemplates=${toJsonForScript([1, ...CLUSTER_SIZE_THRESHOLDS].map((count) => clusterPinHtml(count, CLUSTER_COUNT_PLACEHOLDER)))};
function clusterHtml(count){
  const bucket=count<${CLUSTER_SIZE_THRESHOLDS[0]}?0:count<${CLUSTER_SIZE_THRESHOLDS[1]}?1:2;
  return clusterTemplates[bucket].replace('${CLUSTER_COUNT_PLACEHOLDER}',count);
}

const map=new maplibregl.Map({container:'map',style:mapStyle,center:[${center.longitude},${center.latitude}],zoom:13});
map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
map.on('click',(e)=>window.ReactNativeWebView.postMessage(JSON.stringify({type:'map',lat:e.lngLat.lat,lng:e.lngLat.lng})));

// Marcadores de discotecas: se actualizan uno a uno por id (comparando una
// "firma" serializada de lo que se ve de cada uno). Solo se recrea el DOM
// del pin cuyo aspecto cambió — el resto se queda tal cual, así que un
// evento de alertas o una foto que llega no reconstruye pines que no
// cambiaron.
const markersById=new Map();
function updateMarkers(items){
  const seen=new Set();
  items.forEach(item=>{
    seen.add(item.id);
    const firma=JSON.stringify(item);
    const existente=markersById.get(item.id);
    if(existente&&existente.firma===firma)return;
    if(existente)existente.marker.remove();
    const el=document.createElement('div');
    el.innerHTML=item.html;
    const markerEl=el.firstElementChild;
    markerEl.addEventListener('click',(ev)=>{ev.stopPropagation();window.ReactNativeWebView.postMessage(JSON.stringify({type:'marker',id:item.id}));});
    const marker=new maplibregl.Marker({element:markerEl,anchor:'bottom'}).setLngLat([item.longitude,item.latitude]).addTo(map);
    markersById.set(item.id,{marker,firma});
  });
  markersById.forEach((entrada,id)=>{if(!seen.has(id)){entrada.marker.remove();markersById.delete(id);}});
}
window.updateMarkers=updateMarkers;

let pointsById=new Map();
let pointTemplates={};
let routeStartMarker=null;

map.on('load',()=>{
  map.addSource('salimos-points',{type:'geojson',cluster:true,clusterMaxZoom:16,clusterRadius:56,data:{type:'FeatureCollection',features:[]}});
  map.addLayer({id:'salimos-points-clusters',type:'symbol',source:'salimos-points',filter:['has','point_count'],layout:{'icon-allow-overlap':true}});

  const clusterMarkers=new Map();
  const pointMarkers=new Map();
  function renderPoints(){
    const clusterFeatures=map.querySourceFeatures('salimos-points',{filter:['has','point_count']});
    const seenClusters=new Set();
    clusterFeatures.forEach(f=>{
      const id=f.properties.cluster_id;
      if(seenClusters.has(id))return;
      seenClusters.add(id);
      const coords=f.geometry.coordinates;
      let marker=clusterMarkers.get(id);
      if(!marker){
        const el=document.createElement('div');
        el.innerHTML=clusterHtml(f.properties.point_count);
        marker=new maplibregl.Marker({element:el.firstElementChild});
        el.firstElementChild.addEventListener('click',()=>{
          map.getSource('salimos-points').getClusterExpansionZoom(id).then(zoom=>map.easeTo({center:coords,zoom}));
        });
        clusterMarkers.set(id,marker);
      }
      marker.setLngLat(coords).addTo(map);
    });
    clusterMarkers.forEach((marker,id)=>{if(!seenClusters.has(id)){marker.remove();clusterMarkers.delete(id);}});

    // Diferencial, como los clusters de arriba: recrear todos los pines aquí
    // hacía que arrastrar el mapa reconstruyera su DOM en cada frame del
    // gesto, y se veía a tirones.
    const singleFeatures=map.querySourceFeatures('salimos-points',{filter:['!',['has','point_count']]});
    const seenPoints=new Set();
    singleFeatures.forEach(f=>{
      const id=f.properties.id;
      if(seenPoints.has(id))return;
      seenPoints.add(id);
      if(pointMarkers.has(id))return;
      const point=pointsById.get(id);
      if(!point)return;
      const el=document.createElement('div');
      el.innerHTML=pointTemplates[point.pinKey];
      const markerEl=el.firstElementChild;
      markerEl.addEventListener('click',(ev)=>{ev.stopPropagation();window.ReactNativeWebView.postMessage(JSON.stringify({type:'point',id:point.id}));});
      const marker=new maplibregl.Marker({element:markerEl,anchor:'bottom'}).setLngLat([point.longitude,point.latitude]).addTo(map);
      pointMarkers.set(id,marker);
    });
    pointMarkers.forEach((marker,id)=>{if(!seenPoints.has(id)){marker.remove();pointMarkers.delete(id);}});
  }
  map.on('data',renderPoints);
  map.on('move',renderPoints);

  window.updatePoints=function(points,templates){
    pointTemplates=templates;
    pointMarkers.forEach(marker=>marker.remove());
    pointMarkers.clear();
    pointsById=new Map(points.map(p=>[p.id,p]));
    map.getSource('salimos-points').setData({type:'FeatureCollection',features:points.map(p=>({type:'Feature',properties:{id:p.id},geometry:{type:'Point',coordinates:[p.longitude,p.latitude]}}))});
  };

  window.updateRoute=function(route){
    if(map.getLayer('salimos-route-glow'))map.removeLayer('salimos-route-glow');
    if(map.getLayer('salimos-route-line'))map.removeLayer('salimos-route-line');
    if(map.getSource('salimos-route'))map.removeSource('salimos-route');
    if(routeStartMarker){routeStartMarker.remove();routeStartMarker=null;}
    if(!route||route.length<2)return;

    const coordinates=route.map(([lat,lng])=>[lng,lat]);
    map.addSource('salimos-route',{type:'geojson',lineMetrics:true,data:{type:'Feature',properties:{},geometry:{type:'LineString',coordinates}}});
    const gradient=['interpolate',['linear'],['line-progress']];
    gradientStops.forEach((color,i)=>{gradient.push(i/(gradientStops.length-1),color);});
    map.addLayer({id:'salimos-route-glow',type:'line',source:'salimos-route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-gradient':gradient,'line-width':12,'line-opacity':.18}});
    map.addLayer({id:'salimos-route-line',type:'line',source:'salimos-route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-gradient':gradient,'line-width':5,'line-opacity':.95}});
    const start=document.createElement('div');
    start.style.cssText='width:14px;height:14px;border-radius:50%;background:${colors.brandPink};border:3px solid #ffffff;';
    routeStartMarker=new maplibregl.Marker({element:start}).setLngLat(coordinates[0]).addTo(map);
    const bounds=coordinates.reduce((b,c)=>b.extend(c),new maplibregl.LngLatBounds(coordinates[0],coordinates[0]));
    map.fitBounds(bounds,{padding:40});
  };

  window.ReactNativeWebView.postMessage(JSON.stringify({type:'ready'}));
});
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
  const webviewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);
  const center = region || initialRegion;

  const markers = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<MarkerProps> =>
      React.isValidElement(child) &&
      Boolean((child as React.ReactElement<MarkerProps>).props.coordinate),
  );

  const markerData: MarkerDatum[] = markers.map((marker, index) => ({
    id: markerId(marker, index),
    latitude: marker.props.coordinate.latitude,
    longitude: marker.props.coordinate.longitude,
    html: discotecaPinHtml({
      nombre: marker.props.title ?? 'Discoteca',
      color: marker.props.discoteca?.color ?? CATEGORY_COLORS.discoteca,
      selected: Boolean(marker.props.selected),
      hasAlerts: Boolean(marker.props.hasAlerts),
      eventImage: marker.props.eventImage,
    }),
  }));
  const markersKey = JSON.stringify(markerData);

  // El handler de cada pin se lee siempre por referencia (vía este mapa), no
  // por índice: así identificar el marcador por `id` en el mensaje del
  // WebView sigue funcionando aunque el orden de `children` cambie entre
  // renders.
  const markerPressRef = useRef<Map<string, () => void>>(new Map());
  markerPressRef.current = new Map(
    markers.map((marker, index) => [markerId(marker, index), () => marker.props.onPress?.()]),
  );

  // El HTML/JS del mapa se construye una única vez por montaje: no depende
  // de los datos (ver comentario en `buildMapHtml`), solo del centro inicial.
  const mapHtml = useMemo(
    () =>
      buildMapHtml({
        center: {
          latitude: center?.latitude ?? 36.5982,
          longitude: center?.longitude ?? -6.2242,
        },
        gradientStops: BRAND_GRADIENT,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (!mapReady) return;
    webviewRef.current?.injectJavaScript(`window.updateMarkers(${toJsonForScript(markerData)});true;`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, markersKey]);

  useEffect(() => {
    if (!mapReady) return;
    const { items, templates } = pointPinTemplates(points);
    webviewRef.current?.injectJavaScript(
      `window.updatePoints(${toJsonForScript(items)},${toJsonForScript(templates)});true;`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, points]);

  useEffect(() => {
    if (!mapReady) return;
    webviewRef.current?.injectJavaScript(`window.updateRoute(${toJsonForScript(routeCoordinates ?? [])});true;`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, routeCoordinates]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webviewRef}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        source={{ html: mapHtml }}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'ready') {
              setMapReady(true);
            } else if (message.type === 'marker') {
              markerPressRef.current.get(message.id)?.();
            } else if (message.type === 'point') {
              const point = points?.find((p) => p.id === message.id);
              if (point) onPointPress?.(point);
            } else if (message.type === 'map') {
              onPress?.(
                typeof message.lat === 'number' &&
                  typeof message.lng === 'number'
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
