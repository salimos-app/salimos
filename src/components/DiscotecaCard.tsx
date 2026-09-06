import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { Discoteca } from '../types/discoteca';
import { Evento } from '../types/evento';
import { RouteResult, TravelProfile } from '../services/directionsApi';
import EventoCarousel from './EventoCarousel';
// Ocultada a petición la parte de info de la discoteca (ver bloque comentado
// en el render): estos imports vuelven a hacer falta al restaurarla.
// import { ScrollView, TouchableOpacity } from 'react-native';
// import Text from './Text';
// import { gradients } from '../theme/colors';
// import AlertsPanel from './AlertsPanel';
// import RoutePanel from './RoutePanel';

interface Props {
  discoteca: Discoteca;
  /** Próximo evento con foto, o `null` si no tiene (cae al diseño genérico de la foto del local). */
  nextEvento: Evento | null;
  route: RouteResult | null;
  routeLoading: boolean;
  routeError: string | null;
  onSelectRouteProfile: (profile: TravelProfile) => void;
  onClearRoute: () => void;
  onPlanificarRuta: () => void;
  onVerEventos: () => void;
}

/**
 * Tarjeta que aparece al tocar una discoteca (en el mapa o en la lista).
 *
 * Ahora mismo la tarjeta es SOLO el carrusel de carteles de eventos
 * (`EventoCarousel`, uno por evento, deslizable en horizontal); si la
 * discoteca no tiene eventos, cae a la foto genérica del local.
 *
 * Toda la parte de info de la discoteca (nombre, valoración, dirección,
 * tags, alertas en vivo, panel de ruta y botones de "planificar ruta" /
 * "ver próximos eventos") está oculta a petición — el bloque sigue abajo,
 * comentado, junto con sus imports y props, para poder restaurarlo.
 */
export default function DiscotecaCard({ discoteca, nextEvento }: Props) {
  return (
    <View style={styles.card}>
      {nextEvento ? (
        <EventoCarousel slug={discoteca.slug} seedEvento={nextEvento} />
      ) : (
        <View style={styles.imageWrap}>
          <Image source={{ uri: discoteca.imagen }} style={styles.image} />
          <LinearGradient
            colors={['transparent', colors.backgroundCard]}
            style={styles.imageFade}
            pointerEvents="none"
          />
        </View>
      )}

      {/* --- Info de la discoteca (oculta a petición). Para restaurarla:
          descomentar este bloque, los imports de arriba y las props en la
          firma de la función (`route`, `routeLoading`, `routeError`,
          `onSelectRouteProfile`, `onClearRoute`, `onPlanificarRuta`,
          `onVerEventos`).

      <ScrollView contentContainerStyle={styles.cardContent} showsVerticalScrollIndicator={false}>
        <AlertsPanel slug={discoteca.slug} />

        <View style={styles.divider} />

        <View style={styles.cardHeader}>
          <Text variant="heading" style={styles.cardNombre}>{discoteca.nombre}</Text>
          {discoteca.rating != null && (
            <View style={styles.ratingBadge}>
              <Text variant="caption" style={styles.ratingText}>⭐ {discoteca.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        <Text variant="bodySmall" style={styles.direccion}>📍 {discoteca.direccion}</Text>

        <View style={styles.tags}>
          <View style={[styles.tag, { backgroundColor: discoteca.color + '22', borderColor: discoteca.color + '55' }]}>
            <Text variant="caption" style={{ color: discoteca.color }}>{discoteca.genero}</Text>
          </View>
          {discoteca.precioEntrada != null && (
            <View style={[styles.tag, { backgroundColor: colors.neonGreen + '1F', borderColor: colors.neonGreen + '55' }]}>
              <Text variant="caption" style={{ color: colors.neonGreen }}>💶 {discoteca.precioEntrada}€</Text>
            </View>
          )}
          {discoteca.horario && (
            <View style={styles.tag}>
              <Text variant="caption" style={styles.tagTextMuted}>🕐 {discoteca.horario}</Text>
            </View>
          )}
        </View>

        <Text variant="bodySmall" style={styles.descripcion} numberOfLines={2}>
          {discoteca.descripcion}
        </Text>

        <RoutePanel
          route={route}
          loading={routeLoading}
          error={routeError}
          onSelectProfile={onSelectRouteProfile}
          onClear={onClearRoute}
        />

        <TouchableOpacity onPress={onPlanificarRuta} activeOpacity={0.85} style={styles.rutaButton}>
          <Text variant="button" style={styles.rutaButtonText}>🗺️ Planificar ruta (ida y vuelta)</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onVerEventos} activeOpacity={0.85}>
          <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.eventosButton}>
            <Text variant="button" style={styles.eventosButtonText}>📅 Ver próximos eventos</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      --- fin bloque oculto */}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    // El flyer del evento va fijo (siempre visible entero, es lo más
    // importante); si el resto del contenido no cabe, hace scroll dentro
    // de la tarjeta en vez de cortarse contra el borde de la pantalla.
    maxHeight: Dimensions.get('window').height * 0.78,
    backgroundColor: colors.background,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 16,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 130,
  },
  imageFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 36,
  },
  cardContent: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardNombre: {
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
    letterSpacing: 0.2,
  },
  ratingBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: colors.neonYellow + '1F',
    borderColor: colors.neonYellow + '55',
  },
  ratingText: {
    color: colors.neonYellow,
  },
  direccion: {
    color: colors.textSecondary,
    marginBottom: 14,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundLight,
  },
  tagTextMuted: {
    color: colors.textSecondary,
  },
  descripcion: {
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginTop: 16,
  },
  rutaButton: {
    borderRadius: 15,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: colors.neonBlue,
    backgroundColor: colors.neonBlue + '18',
  },
  rutaButtonText: {
    color: colors.neonBlue,
    letterSpacing: 0.2,
  },
  eventosButton: {
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: colors.brandPink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  eventosButtonText: {
    color: '#ffffff',
    letterSpacing: 0.2,
  },
});
