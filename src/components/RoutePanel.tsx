import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { RouteResult, TravelProfile } from '../services/directionsApi';
import { formatDistance, formatDuration } from '../utils/format';

interface Props {
  route: RouteResult | null;
  loading: boolean;
  error: string | null;
  onSelectProfile: (profile: TravelProfile) => void;
  onClear: () => void;
}

const PROFILES: { id: TravelProfile; icon: string; label: string }[] = [
  { id: 'foot-walking', icon: '🚶', label: 'A pie' },
  { id: 'driving-car', icon: '🚗', label: 'Coche' },
  { id: 'cycling-regular', icon: '🚴', label: 'Bici' },
];

export default function RoutePanel({
  route,
  loading,
  error,
  onSelectProfile,
  onClear,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.profileRow}>
        {PROFILES.map((profile) => (
          <TouchableOpacity
            key={profile.id}
            style={styles.profileButton}
            onPress={() => onSelectProfile(profile.id)}
            disabled={loading}
          >
            <Text style={styles.profileButtonText}>
              {profile.icon} {profile.label}
            </Text>
          </TouchableOpacity>
        ))}

        {route && (
          <TouchableOpacity style={styles.clearButton} onPress={onClear}>
            <Text style={styles.clearButtonText}>✕ Quitar ruta</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color={colors.neonBlue} />
          <Text style={styles.statusText}>Calculando ruta...</Text>
        </View>
      )}

      {error && !loading && <Text style={styles.errorText}>{error}</Text>}

      {route && !loading && !error && (
        <Text style={styles.summaryText}>
          🧭 {formatDistance(route.distanceMeters)} ·{' '}
          {formatDuration(route.durationSeconds)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  profileRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  profileButton: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: colors.error + '22',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  clearButtonText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 8,
  },
  summaryText: {
    color: colors.neonBlue,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
});
