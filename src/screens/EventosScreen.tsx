import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Discoteca } from '../types/discoteca';
import { Evento } from '../types/evento';
import { fetchProximosEventos } from '../services/eventosApi';
import { colors } from '../theme/colors';

interface Props {
  discoteca: Discoteca;
  onBack: () => void;
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatFecha(fechaISO: string): { diaSemana: string; dia: string; mes: string } {
  const fecha = new Date(fechaISO);
  return {
    diaSemana: DIAS_SEMANA[fecha.getDay()],
    dia: fecha.getDate().toString().padStart(2, '0'),
    mes: MESES[fecha.getMonth()],
  };
}

function formatHora(fechaISO: string): string {
  const fecha = new Date(fechaISO);
  return `${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`;
}

export default function EventosScreen({ discoteca, onBack }: Props) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEventos();
  }, [discoteca.slug]);

  const loadEventos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProximosEventos(discoteca.slug);
      setEventos(data);
    } catch (err) {
      setError('No se pudieron cargar los próximos eventos.');
    } finally {
      setLoading(false);
    }
  };

  const renderEvento = ({ item }: { item: Evento }) => {
    const fecha = formatFecha(item.startDate);
    return (
      <View style={styles.eventoCard}>
        <View style={styles.fechaBox}>
          <Text style={styles.fechaDia}>{fecha.dia}</Text>
          <Text style={styles.fechaMes}>{fecha.mes}</Text>
          <Text style={styles.fechaDiaSemana}>{fecha.diaSemana}</Text>
        </View>

        <View style={styles.eventoInfo}>
          <Text style={styles.eventoNombre}>{item.name}</Text>
          <View style={styles.eventoDetalle}>
            <Text style={styles.eventoHora}>🕐 {formatHora(item.startDate)}</Text>
            <Text style={styles.eventoUbicacion}>📍 {item.location.name}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Próximos eventos</Text>
          <Text style={styles.headerSubtitle}>{discoteca.nombre}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.neonPink} />
          <Text style={styles.loadingText}>Cargando eventos...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadEventos}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={eventos}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          renderItem={renderEvento}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No hay próximos eventos</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12,
  },
  backText: {
    color: colors.textPrimary,
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.neonPink,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.neonPink,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  eventoCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  fechaBox: {
    width: 70,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginRight: 14,
  },
  fechaDia: {
    color: colors.neonPink,
    fontSize: 24,
    fontWeight: 'bold',
  },
  fechaMes: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fechaDiaSemana: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  eventoInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  eventoNombre: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  eventoDetalle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  eventoHora: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  eventoUbicacion: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});