import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import Text from './Text';
import { colors } from '../theme/colors';
import { SimpleMapPoint } from './MapView';
import RoutePanel from './RoutePanel';
import { RouteResult, TravelProfile } from '../services/directionsApi';

interface Props {
  point: SimpleMapPoint;
  route: RouteResult | null;
  routeLoading: boolean;
  routeError: string | null;
  onSelectProfile: (profile: TravelProfile) => void;
  onClearRoute: () => void;
  onClose: () => void;
}

/**
 * Tarjeta genérica para cualquier punto del mapa que no sea una discoteca
 * (paradas de taxi, bares, supermercados...). Igual que la tarjeta de una
 * discoteca, pero más simple: nombre, botón de llamar si tiene teléfono, y
 * "Cómo llegar".
 */
export default function PointCard({
  point,
  route,
  routeLoading,
  routeError,
  onSelectProfile,
  onClearRoute,
  onClose,
}: Props) {
  const handleCall = () => {
    if (point.phone) {
      Linking.openURL(`tel:${point.phone.replace(/\s+/g, '')}`);
    }
  };

  return (
    <View
      style={[styles.card, { borderLeftColor: point.color ?? colors.border }]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: point.color ?? colors.backgroundLight },
          ]}
        >
          <Text style={styles.icon}>{point.icon ?? '📍'}</Text>
        </View>
        <View style={styles.headerText}>
          <Text variant="heading" style={styles.nombre} numberOfLines={2}>
            {point.label}
          </Text>
          {point.sublabel ? (
            <Text variant="bodySmall" style={styles.sublabel}>{point.sublabel}</Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text variant="label" style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {point.phone && (
        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Text variant="button" style={styles.callButtonText}>📞 Llamar: {point.phone}</Text>
        </TouchableOpacity>
      )}

      <RoutePanel
        route={route}
        loading={routeLoading}
        error={routeError}
        onSelectProfile={onSelectProfile}
        onClear={onClearRoute}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  icon: {
    fontSize: 20,
  },
  headerText: {
    flex: 1,
  },
  nombre: {
    color: colors.textPrimary,
  },
  sublabel: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundLight,
    marginLeft: 8,
  },
  closeText: {
    color: colors.textSecondary,
  },
  callButton: {
    backgroundColor: colors.neonGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  callButtonText: {
    color: colors.background,
  },
});
