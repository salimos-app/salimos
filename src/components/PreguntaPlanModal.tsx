import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Text from './Text';
import { colors } from '../theme/colors';

interface Props {
  onElegir: (modo: 'casa' | 'bar') => void;
  onCancelar: () => void;
}

/**
 * Pregunta que dispara el segundo toque en el hub del mapa (ver
 * FiltrosBurbujas.onCollapse): según la respuesta, App.tsx monta el plan de
 * la noche completo (taxi, parada intermedia, mejor discoteca) y lo calcula
 * automáticamente en el planificador.
 */
export default function PreguntaPlanModal({ onElegir, onCancelar }: Props) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text variant="heading" style={styles.titulo}>¿Cómo empiezas la noche?</Text>
        <TouchableOpacity style={styles.opcion} onPress={() => onElegir('casa')} activeOpacity={0.85}>
          <Text variant="body" style={styles.opcionText}>🍾 Botellona en casa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.opcion} onPress={() => onElegir('bar')} activeOpacity={0.85}>
          <Text variant="body" style={styles.opcionText}>🍹 Tomar algo fuera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancelar} style={styles.cancelar}>
          <Text variant="subheading" style={styles.cancelarText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6,4,10,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 16,
  },
  titulo: {
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  opcion: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.neonPink,
    backgroundColor: colors.neonPink + '18',
  },
  opcionText: {
    color: colors.textPrimary,
  },
  cancelar: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelarText: {
    color: colors.textMuted,
  },
});
