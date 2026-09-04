import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Discoteca } from '../types/discoteca';
import { Evento } from '../types/evento';
import { fetchProximosEventos, fetchEventTicketTypes, precioDesde } from '../services/eventosApi';
import { colors, gradients } from '../theme/colors';

interface Props {
  discoteca: Discoteca;
  onBack: () => void;
}

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('es-ES', { weekday: 'long' });
const DAY_FORMATTER = new Intl.DateTimeFormat('es-ES', { day: '2-digit' });
const MONTH_FORMATTER = new Intl.DateTimeFormat('es-ES', { month: 'long' });

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function weekdayShort(fecha: Date): string {
  return capitalize(WEEKDAY_FORMATTER.format(fecha)).slice(0, 3);
}

function formatFecha(fechaISO: string): { diaSemana: string; dia: string; mes: string } {
  const fecha = new Date(fechaISO);
  return {
    diaSemana: capitalize(WEEKDAY_FORMATTER.format(fecha)),
    dia: DAY_FORMATTER.format(fecha),
    mes: capitalize(MONTH_FORMATTER.format(fecha)),
  };
}

function formatHora(fechaISO: string): string {
  const fecha = new Date(fechaISO);
  return `${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`;
}

/** Clave estable de "día" (sin hora) para agrupar eventos por fecha. */
function diaKey(fechaISO: string): string {
  return new Date(fechaISO).toDateString();
}

export default function EventosScreen({ discoteca, onBack }: Props) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [preciosPorId, setPreciosPorId] = useState<Record<string, number | null>>({});
  const preciosSolicitados = useRef<Set<string>>(new Set());

  const loadEventos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProximosEventos(discoteca.slug);
      setEventos(data);

      const hoy = new Date().toDateString();
      const diasDisponibles = Array.from(new Set(data.map((e) => diaKey(e.startDate))));
      setSelectedDay(diasDisponibles.includes(hoy) ? hoy : diasDisponibles[0] ?? null);
    } catch {
      setError('No se pudieron cargar los próximos eventos.');
    } finally {
      setLoading(false);
    }
  }, [discoteca.slug]);

  useEffect(() => {
    loadEventos();
  }, [loadEventos]);

  const hoyKey = new Date().toDateString();

  const dias = useMemo(() => {
    const porDia = new Map<string, { date: Date; image?: string }>();
    eventos.forEach((evento) => {
      const key = diaKey(evento.startDate);
      const existente = porDia.get(key);
      if (!existente) {
        porDia.set(key, { date: new Date(evento.startDate), image: evento.image });
      } else if (!existente.image && evento.image) {
        existente.image = evento.image;
      }
    });
    return Array.from(porDia.entries())
      .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
      .map(([key, { date, image }]) => ({ key, date, image }));
  }, [eventos]);

  const eventosDelDia = useMemo(
    () => (selectedDay ? eventos.filter((evento) => diaKey(evento.startDate) === selectedDay) : eventos),
    [eventos, selectedDay]
  );

  // Los precios se piden solo para los eventos del día seleccionado (pocos a
  // la vez), no para todo el listado — evita disparar de golpe una petición
  // por cada evento de la discoteca.
  useEffect(() => {
    const pendientes = eventosDelDia.filter(
      (evento) => evento.id && !preciosSolicitados.current.has(evento.id)
    );
    pendientes.forEach((evento) => {
      const id = evento.id!;
      preciosSolicitados.current.add(id);
      fetchEventTicketTypes(discoteca.slug, id)
        .then((tipos) => setPreciosPorId((prev) => ({ ...prev, [id]: precioDesde(tipos) })))
        .catch(() => setPreciosPorId((prev) => ({ ...prev, [id]: null })));
    });
  }, [eventosDelDia, discoteca.slug]);

  // El primer evento del día seleccionado se destaca grande debajo del
  // calendario; si ese día tiene más de uno, el resto va en la lista.
  const eventoDestacado = eventosDelDia[0] ?? null;
  const restoDelDia = eventosDelDia.slice(1);

  const renderEvento = ({ item }: { item: Evento }) => {
    const fecha = formatFecha(item.startDate);
    const precio = item.id ? preciosPorId[item.id] : undefined;
    return (
      <View style={styles.eventoCard}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.eventoImagen} />
        ) : null}

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
            {precio != null && <Text style={styles.eventoPrecio}>💶 Desde {precio}€</Text>}
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
          <TouchableOpacity onPress={loadEventos} activeOpacity={0.85}>
            <LinearGradient
              colors={gradients.brandSoft}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Reintentar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {dias.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.diasContent}
              style={styles.diasContainer}
            >
              {dias.map(({ key, date, image }) => {
                const activo = key === selectedDay;
                const esHoy = key === hoyKey;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.diaChip,
                      !image && styles.diaChipSinFoto,
                      activo && styles.diaChipActivo,
                      activo && styles.diaChipGrande,
                    ]}
                    onPress={() => setSelectedDay(key)}
                    activeOpacity={0.85}
                  >
                    {image ? (
                      <>
                        <Image source={{ uri: image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        <LinearGradient
                          colors={['transparent', 'rgba(10,8,16,0.85)']}
                          style={StyleSheet.absoluteFill}
                        />
                      </>
                    ) : null}
                    <Text
                      style={[
                        styles.diaChipLabel,
                        !image && activo && styles.diaChipLabelActivo,
                        !!image && styles.diaChipLabelSobreImagen,
                      ]}
                    >
                      {esHoy ? 'Hoy' : weekdayShort(date)}
                    </Text>
                    <Text style={styles.diaChipNumero}>{date.getDate().toString().padStart(2, '0')}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <FlatList
            data={restoDelDia}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            renderItem={renderEvento}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              eventoDestacado ? (
                <View style={styles.heroCard}>
                  {eventoDestacado.image ? (
                    <Image source={{ uri: eventoDestacado.image }} style={styles.heroImagen} resizeMode="cover" />
                  ) : (
                    <View style={styles.heroImagenPlaceholder}>
                      <Text style={styles.heroImagenPlaceholderText}>
                        {eventoDestacado.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(10,8,16,0.92)']}
                    style={styles.heroFade}
                    pointerEvents="none"
                  />
                  <View style={styles.heroInfo}>
                    <Text style={styles.heroNombre}>{eventoDestacado.name}</Text>
                    <View style={styles.heroDetalle}>
                      <Text style={styles.heroHora}>🕐 {formatHora(eventoDestacado.startDate)}</Text>
                      <Text style={styles.heroUbicacion}>📍 {eventoDestacado.location.name}</Text>
                      {eventoDestacado.id && preciosPorId[eventoDestacado.id] != null && (
                        <Text style={styles.heroPrecio}>💶 Desde {preciosPorId[eventoDestacado.id]}€</Text>
                      )}
                    </View>
                  </View>
                </View>
              ) : null
            }
            ListEmptyComponent={
              eventoDestacado ? null : (
                <View style={styles.centerContainer}>
                  <Text style={styles.emptyText}>No hay próximos eventos</Text>
                </View>
              )
            }
          />
        </>
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
    paddingTop: 56,
    paddingBottom: 18,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.2,
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
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  diasContainer: {
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  diasContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    alignItems: 'flex-end',
  },
  diaChip: {
    width: 58,
    height: 78,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
    borderRadius: 14,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  diaChipSinFoto: {
    justifyContent: 'center',
    paddingBottom: 0,
  },
  diaChipActivo: {
    borderWidth: 2,
    borderColor: colors.brandPink,
  },
  diaChipGrande: {
    transform: [{ scale: 1.18 }],
  },
  diaChipLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  diaChipLabelActivo: {
    color: colors.brandPink,
  },
  diaChipLabelSobreImagen: {
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 3,
  },
  diaChipNumero: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 300,
    marginBottom: 18,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  heroImagen: {
    width: '100%',
    height: '100%',
  },
  heroImagenPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundLight,
  },
  heroImagenPlaceholderText: {
    color: colors.textMuted,
    fontSize: 64,
    fontWeight: '800',
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
  },
  heroInfo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
  },
  heroNombre: {
    color: '#ffffff',
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  heroDetalle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  heroHora: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontWeight: '700',
  },
  heroUbicacion: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    fontWeight: '700',
  },
  heroPrecio: {
    color: colors.brandPink,
    fontSize: 13,
    fontWeight: '800',
  },
  eventoCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  eventoImagen: {
    width: 64,
    height: 64,
    borderRadius: 14,
    marginRight: 14,
    backgroundColor: colors.backgroundLight,
  },
  fechaBox: {
    width: 70,
    backgroundColor: colors.backgroundLight,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginRight: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fechaDia: {
    color: colors.brandPink,
    fontSize: 24,
    fontWeight: '800',
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
  eventoPrecio: {
    color: colors.brandPink,
    fontSize: 13,
    fontWeight: '700',
  },
});