import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import {
  useAlertCatalog,
  useDiscotecaAlerts,
} from '../hooks/useDiscotecaAlerts';

interface Props {
  slug: string;
}

function timeAgo(timestampMs: number): string {
  const minutes = Math.max(0, Math.round((Date.now() - timestampMs) / 60000));
  if (minutes < 1) return 'ahora';
  return `hace ${minutes} min`;
}

/**
 * Alertas en vivo estilo Waze para una discoteca (mucha cola, sitio vacío...).
 * Solo se suscribe al WebSocket mientras esta discoteca está cargada en
 * pantalla (ver App.tsx), así que nunca recibe info de otras discotecas.
 */
export default function AlertsPanel({ slug }: Props) {
  const catalog = useAlertCatalog();
  const { alerts, report } = useDiscotecaAlerts(slug);

  return (
    <View style={styles.container}>
      {alerts.length > 0 && (
        <View style={styles.activeRow}>
          {alerts.map((alert) => {
            const type = catalog.find((t) => t.id === alert.typeId);
            if (!type) return null;
            return (
              <View key={alert.id} style={styles.badge}>
                <Text style={styles.badgeText}>
                  {type.icon} {type.label}
                  {alert.value != null ? ` ${alert.value}+` : ''} ·{' '}
                  {alert.count} · {timeAgo(alert.lastReportedAt)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.reportRow}
      >
        {catalog.map((type) =>
          type.requiresValue ? (
            (type.valuePresets ?? []).map((value) => (
              <TouchableOpacity
                key={`${type.id}-${value}`}
                style={styles.reportButton}
                onPress={() => report(type.id, value)}
              >
                <Text style={styles.reportButtonText}>
                  {type.icon} {value}+
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity
              key={type.id}
              style={styles.reportButton}
              onPress={() => report(type.id)}
            >
              <Text style={styles.reportButtonText}>
                {type.icon} {type.label}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  activeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  reportRow: {
    gap: 8,
  },
  reportButton: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  reportButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
