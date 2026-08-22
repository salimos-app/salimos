import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Discoteca, Region } from '../types/discoteca';

export interface MarkerProps {
  coordinate: { latitude: number; longitude: number };
  title?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  discoteca?: Discoteca;
  selected?: boolean;
  /** Muestra un badge (estilo Waze) pegado a la izquierda del pin si hay alertas activas. */
  hasAlerts?: boolean;
  /** Foto del evento del día: reemplaza la inicial como contenido principal del pin. */
  eventImage?: string;
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

export interface MapViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  initialRegion?: Region;
  region?: Region;
  onPress?: () => void;
  /** Puntos [latitud, longitud] de una ruta a dibujar sobre el mapa. */
  routeCoordinates?: [number, number][];
  /** Puntos genéricos (no discotecas) a marcar en el mapa. */
  points?: SimpleMapPoint[];
  /** Se llama al tocar uno de `points` (abre la tarjeta correspondiente en la app). */
  onPointPress?: (point: SimpleMapPoint) => void;
}

export const TILE_URL =
  'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png';

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
