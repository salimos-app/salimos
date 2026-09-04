import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, BRAND_GRADIENT } from '../theme/colors';
import { mapStyle, MarkerProps, MapViewProps } from './MapView.types';

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
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.css">
<style>
html,body,#map{height:100%;margin:0;background:${colors.background}}
.simple-point{width:30px;height:30px;border-radius:50%;border:2.5px solid ${colors.background};box-shadow:0 0 0 1.5px rgba(255,255,255,.55),0 6px 14px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font-size:14px}
.maplibregl-ctrl-attrib{background:${colors.background}CC !important;color:${colors.textSecondary} !important}
.maplibregl-ctrl-attrib a{color:${colors.neonPink} !important}
</style></head>
<body><div id="map"></div><script src="https://unpkg.com/maplibre-gl@4/dist/maplibre-gl.js"></script><script>
const mapStyle=${toJsonForScript(mapStyle)};
const markers=${toJsonForScript(markers)};
const route=${toJsonForScript(route)};
const points=${toJsonForScript(points ?? [])};
const gradientStops=${toJsonForScript(gradientStops)};
const EVENT_PIN_WIDTH=100;
const EVENT_PIN_POINTER_HEIGHT=10;
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
    const html='<div style="width:140px;display:flex;flex-direction:column;align-items:center;transform:scale('+(sel?1.06:1)+');transform-origin:50% 100%;transition:transform .15s ease;">'
      +pinNameLabelHtml(item)
      +'<div style="position:relative;width:'+EVENT_PIN_WIDTH+'px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.5));">'
      +'<img src="'+item.eventImage+'" style="display:block;width:'+EVENT_PIN_WIDTH+'px;height:auto;border:3px solid '+(sel?'#ffffff':item.color)+';box-sizing:border-box;" />'
      +'<div style="width:0;height:0;margin:0 auto;border-left:8px solid transparent;border-right:8px solid transparent;border-top:'+EVENT_PIN_POINTER_HEIGHT+'px solid '+item.color+';"></div>'
      +alertBadge+'</div></div>';
    return html;
  }
  const html='<div style="width:140px;display:flex;flex-direction:column;align-items:center;transform:scale('+(sel?1.1:1)+');transform-origin:50% 100%;transition:transform .15s ease;">'
    +pinNameLabelHtml(item)
    +'<div style="position:relative;width:36px;height:42px;filter:drop-shadow(0 6px 8px rgba(0,0,0,.45));">'
    +'<svg width="36" height="42" viewBox="0 0 36 42"><path d="M18,2 C25.7,2 32,8.3 32,16 C32,22.4 27,28.4 18,40 C9,28.4 4,22.4 4,16 C4,8.3 10.3,2 18,2 Z" fill="'+item.color+'" stroke="'+(sel?'#ffffff':'${colors.background}')+'" stroke-width="'+(sel?2.5:1.5)+'"/></svg>'
    +'<div style="position:absolute;top:8px;left:0;right:0;text-align:center;color:#fff;font-weight:800;font-size:14px;font-family:-apple-system,system-ui,sans-serif;text-shadow:0 1px 3px rgba(0,0,0,.45);">'+initial+'</div>'
    +alertBadge+'</div></div>';
  return html;
}
function clusterHtml(count){
  const size=count<10?36:count<25?44:52;
  const fontSize=count<10?12:count<25?13.5:15;
  return '<div style="width:'+size+'px;height:'+size+'px;border-radius:50%;background:${colors.backgroundCard}F2;border:2.5px solid ${colors.brandPink};box-shadow:0 0 0 4px ${colors.brandPink}26,0 8px 18px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:'+fontSize+'px;font-family:-apple-system,system-ui,sans-serif;">'+count+'</div>';
}
function simplePointHtml(icon,color){
  return '<div class="simple-point" style="background:'+(color||'${colors.backgroundCard}')+'">'+(icon||'📍')+'</div>';
}

const map=new maplibregl.Map({container:'map',style:mapStyle,center:[${center.longitude},${center.latitude}],zoom:13});
map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
map.on('click',(e)=>window.ReactNativeWebView.postMessage(JSON.stringify({type:'map',lat:e.lngLat.lat,lng:e.lngLat.lng})));

markers.forEach(item=>{
  const el=document.createElement('div');
  el.innerHTML=discotecaPinHtml(item);
  const markerEl=el.firstElementChild;
  markerEl.style.cursor='pointer';
  markerEl.addEventListener('click',(ev)=>{ev.stopPropagation();window.ReactNativeWebView.postMessage(JSON.stringify({type:'marker',index:item.index}));});
  new maplibregl.Marker({element:markerEl,anchor:'bottom'}).setLngLat([item.longitude,item.latitude]).addTo(map);
});

map.on('load',()=>{
  map.addSource('salimos-points',{type:'geojson',cluster:true,clusterMaxZoom:16,clusterRadius:56,data:{type:'FeatureCollection',features:points.map(p=>({type:'Feature',properties:{id:p.id},geometry:{type:'Point',coordinates:[p.longitude,p.latitude]}}))}});
  map.addLayer({id:'salimos-points-clusters',type:'symbol',source:'salimos-points',filter:['has','point_count'],layout:{'icon-allow-overlap':true}});

  const clusterMarkers=new Map();
  const pointMarkers=[];
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

    pointMarkers.forEach(m=>m.remove());
    pointMarkers.length=0;
    const singleFeatures=map.querySourceFeatures('salimos-points',{filter:['!',['has','point_count']]});
    const seenPoints=new Set();
    singleFeatures.forEach(f=>{
      const id=f.properties.id;
      if(seenPoints.has(id))return;
      seenPoints.add(id);
      const point=points.find(p=>p.id===id);
      if(!point)return;
      const el=document.createElement('div');
      el.innerHTML=simplePointHtml(point.icon,point.color);
      const markerEl=el.firstElementChild;
      markerEl.addEventListener('click',(ev)=>{ev.stopPropagation();window.ReactNativeWebView.postMessage(JSON.stringify({type:'point',id:point.id}));});
      const marker=new maplibregl.Marker({element:markerEl}).setLngLat([point.longitude,point.latitude]).addTo(map);
      pointMarkers.push(marker);
    });
  }
  map.on('data',renderPoints);
  map.on('move',renderPoints);
  renderPoints();

  if(route.length>1){
    const coordinates=route.map(([lat,lng])=>[lng,lat]);
    map.addSource('salimos-route',{type:'geojson',lineMetrics:true,data:{type:'Feature',properties:{},geometry:{type:'LineString',coordinates}}});
    const gradient=['interpolate',['linear'],['line-progress']];
    gradientStops.forEach((color,i)=>{gradient.push(i/(gradientStops.length-1),color);});
    map.addLayer({id:'salimos-route-glow',type:'line',source:'salimos-route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-gradient':gradient,'line-width':12,'line-opacity':.18}});
    map.addLayer({id:'salimos-route-line',type:'line',source:'salimos-route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-gradient':gradient,'line-width':5,'line-opacity':.95}});
    const start=document.createElement('div');
    start.style.cssText='width:14px;height:14px;border-radius:50%;background:${colors.brandPink};border:3px solid #ffffff;';
    new maplibregl.Marker({element:start}).setLngLat(coordinates[0]).addTo(map);
    const bounds=coordinates.reduce((b,c)=>b.extend(c),new maplibregl.LngLatBounds(coordinates[0],coordinates[0]));
    map.fitBounds(bounds,{padding:40});
  }
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
