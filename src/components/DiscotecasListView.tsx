import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { Discoteca } from '../types/discoteca';
import { SimpleMapPoint } from './MapView';
import { distanceMeters, LatLngLike } from '../utils/geo';
import { formatDistance } from '../utils/format';

interface Props {
  discotecas: Discoteca[];
  mostrarDiscotecas: boolean;
  coordsBySlug: Record<string, { latitude: number; longitude: number }>;
  eventImageBySlug: Record<string, string | null | undefined>;
  alertsBySlug: Record<string, unknown[] | undefined>;
  points: SimpleMapPoint[];
  userLocation: LatLngLike | null;
  onSelectDiscoteca: (discoteca: Discoteca) => void;
  onSelectPoint: (point: SimpleMapPoint) => void;
}

/**
 * Alternativa al mapa: mismos datos (discotecas + puntos visibles según los
 * filtros activos), pero como lista ordenada por cercanía a tu ubicación —
 * el más óptimo, arriba del todo — en vez de pines que hay que buscar en el
 * mapa. Tocar un elemento abre exactamente la misma tarjeta que tocar su
 * pin en el mapa.
 */
export default function DiscotecasListView({
  discotecas,
  mostrarDiscotecas,
  coordsBySlug,
  eventImageBySlug,
  alertsBySlug,
  points,
  userLocation,
  onSelectDiscoteca,
  onSelectPoint,
}: Props) {
  const discotecasOrdenadas = useMemo(() => {
    if (!mostrarDiscotecas) return [];
    const conCoords = discotecas.map((discoteca) => ({
      discoteca,
      coords: coordsBySlug[discoteca.slug] ?? { latitude: discoteca.latitud, longitude: discoteca.longitud },
    }));
    return userLocation
      ? [...conCoords].sort(
          (a, b) => distanceMeters(userLocation, a.coords) - distanceMeters(userLocation, b.coords),
        )
      : [...conCoords].sort((a, b) => a.discoteca.nombre.localeCompare(b.discoteca.nombre));
  }, [discotecas, mostrarDiscotecas, coordsBySlug, userLocation]);

  const puntosOrdenados = useMemo(() => {
    return userLocation
      ? [...points].sort((a, b) => distanceMeters(userLocation, a) - distanceMeters(userLocation, b))
      : [...points].sort((a, b) => a.label.localeCompare(b.label));
  }, [points, userLocation]);

  const vacio = discotecasOrdenadas.length === 0 && puntosOrdenados.length === 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {vacio && (
        <View style={styles.vacio}>
          <Text style={styles.vacioText}>No hay nada que mostrar con estos filtros.</Text>
        </View>
      )}

      {discotecasOrdenadas.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>🪩 Discotecas</Text>
          {discotecasOrdenadas.map(({ discoteca, coords }, index) => {
            const distancia = userLocation ? distanceMeters(userLocation, coords) : undefined;
            const esOptima = index === 0 && !!userLocation;
            const imagen = eventImageBySlug[discoteca.slug] ?? discoteca.imagen;
            const hasAlerts = (alertsBySlug[discoteca.slug]?.length ?? 0) > 0;

            return (
              <TouchableOpacity
                key={discoteca.slug}
                style={[styles.discoRow, { borderLeftColor: discoteca.color }]}
                onPress={() => onSelectDiscoteca(discoteca)}
                activeOpacity={0.85}
              >
                <Image source={{ uri: imagen }} style={styles.discoImagen} />
                <View style={styles.discoInfo}>
                  <View style={styles.discoNombreRow}>
                    <Text style={styles.discoNombre} numberOfLines={1}>
                      {discoteca.nombre}
                    </Text>
                    {hasAlerts && <View style={styles.alertDot} />}
                  </View>
                  <Text style={styles.discoSub} numberOfLines={1}>
                    {discoteca.genero}
                    {discoteca.rating != null ? ` · ⭐ ${discoteca.rating.toFixed(1)}` : ''}
                    {discoteca.precioEntrada != null ? ` · ${discoteca.precioEntrada}€` : ''}
                  </Text>
                  <Text style={styles.discoDireccion} numberOfLines={1}>
                    📍 {discoteca.direccion}
                  </Text>
                </View>
                {distancia != null && (
                  <View style={[styles.distBadge, esOptima && styles.distBadgeOptima]}>
                    <Text style={[styles.distBadgeText, esOptima && styles.distBadgeTextOptima]}>
                      {esOptima ? '⭐ ' : ''}
                      {formatDistance(distancia)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {puntosOrdenados.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>📍 Otros lugares</Text>
          {puntosOrdenados.map((point) => {
            const distancia = userLocation ? distanceMeters(userLocation, point) : undefined;
            return (
              <TouchableOpacity
                key={point.id}
                style={styles.pointRow}
                onPress={() => onSelectPoint(point)}
                activeOpacity={0.85}
              >
                <View style={[styles.pointIcon, { backgroundColor: point.color ?? colors.backgroundLight }]}>
                  <Text style={styles.pointIconText}>{point.icon ?? '📍'}</Text>
                </View>
                <View style={styles.pointInfo}>
                  <Text style={styles.pointNombre} numberOfLines={1}>
                    {point.label}
                  </Text>
                  {point.sublabel ? (
                    <Text style={styles.pointSub} numberOfLines={1}>
                      {point.sublabel}
                    </Text>
                  ) : null}
                </View>
                {distancia != null && (
                  <Text style={styles.pointDist}>{formatDistance(distancia)}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: 172,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  vacio: {
    paddingTop: 60,
    alignItems: 'center',
  },
  vacioText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 18,
    marginBottom: 10,
  },
  discoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderLeftWidth: 4,
    padding: 10,
    marginBottom: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  discoImagen: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: colors.backgroundLight,
  },
  discoInfo: {
    flex: 1,
    marginRight: 8,
  },
  discoNombreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discoNombre: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
    marginLeft: 6,
  },
  discoSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  discoDireccion: {
    color: colors.textMuted,
    fontSize: 11.5,
    marginTop: 2,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  pointIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pointIconText: {
    fontSize: 16,
  },
  pointInfo: {
    flex: 1,
    marginRight: 8,
  },
  pointNombre: {
    color: colors.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  pointSub: {
    color: colors.textMuted,
    fontSize: 11.5,
    marginTop: 1,
  },
  pointDist: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  distBadge: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  distBadgeOptima: {
    backgroundColor: colors.neonYellow + '22',
    borderColor: colors.neonYellow,
  },
  distBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  distBadgeTextOptima: {
    color: colors.neonYellow,
  },
});
