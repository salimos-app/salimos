import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { discotecas } from '../data/discotecas';
import { Discoteca } from '../types/discoteca';
import { colors } from '../theme/colors';

interface Props {
  onSelectDiscoteca: (discoteca: Discoteca) => void;
}

export default function ListScreen({ onSelectDiscoteca }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDiscotecas = discotecas.filter((d) => {
    const query = searchQuery.toLowerCase();
    return (
      d.nombre.toLowerCase().includes(query) ||
      d.genero.toLowerCase().includes(query) ||
      d.direccion.toLowerCase().includes(query)
    );
  });

  const renderDiscoteca = ({ item }: { item: Discoteca }) => (
    <TouchableOpacity style={styles.card} onPress={() => onSelectDiscoteca(item)}>
      <Image source={{ uri: item.imagen }} style={styles.image} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.nombre}>{item.nombre}</Text>
          <View style={[styles.ratingBadge, { backgroundColor: item.color + '22' }]}>
            <Text style={[styles.ratingText, { color: item.color }]}>
              ⭐ {item.rating.toFixed(1)}
            </Text>
          </View>
        </View>

        <Text style={styles.direccion}>{item.direccion}</Text>

        <View style={styles.tags}>
          <View style={[styles.tag, { backgroundColor: item.color + '22' }]}>
            <Text style={[styles.tagText, { color: item.color }]}>{item.genero}</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: colors.neonGreen + '22' }]}>
            <Text style={[styles.tagText, { color: colors.neonGreen }]}>
              💶 {item.precioEntrada}€
            </Text>
          </View>
        </View>

        <Text style={styles.horario}>🕐 {item.horario}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar discotecas..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredDiscotecas}
        keyExtractor={(item) => item.id}
        renderItem={renderDiscoteca}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No se encontraron discotecas</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 48,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    height: 150,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nombre: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  direccion: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  horario: {
    color: colors.textMuted,
    fontSize: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
  },
});