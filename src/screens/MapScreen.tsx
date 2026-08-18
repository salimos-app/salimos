import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Keyboard,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { discotecas } from '../data/discotecas';
import { Discoteca, Region } from '../types/discoteca';
import { colors } from '../theme/colors';
import DiscotecaMarker from '../components/DiscotecaMarker';
import DiscotecaCard from '../components/DiscotecaCard';
import { MapViewComponent, MarkerComponent } from '../components/MapView';

const PUERTO_REGION: Region = {
  latitude: 36.5982,
  longitude: -6.2242,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export default function MapScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscoteca, setSelectedDiscoteca] = useState<Discoteca | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState<Region>(PUERTO_REGION);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permiso de ubicación denegado');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.log('Error obteniendo ubicación:', error);
    }
  };

  const filteredDiscotecas = discotecas.filter((d) => {
    const query = searchQuery.toLowerCase();
    return (
      d.nombre.toLowerCase().includes(query) ||
      d.genero.toLowerCase().includes(query) ||
      d.direccion.toLowerCase().includes(query)
    );
  });

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setShowResults(text.length > 0);
  };

  const handleSelectDiscoteca = (discoteca: Discoteca) => {
    setSelectedDiscoteca(discoteca);
    setShowResults(false);
    setSearchQuery(discoteca.nombre);
    Keyboard.dismiss();

    const newRegion: Region = {
      latitude: discoteca.latitud,
      longitude: discoteca.longitud,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setRegion(newRegion);
    if (Platform.OS !== 'web' && mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 500);
    }
  };

  const handleMarkerPress = (discoteca: Discoteca) => {
    setSelectedDiscoteca(discoteca);
  };

  const handleCloseCard = () => {
    setSelectedDiscoteca(null);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowResults(false);
    setSelectedDiscoteca(null);
  };

  const handleCenterOnUser = () => {
    if (userLocation) {
      const newRegion: Region = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setRegion(newRegion);
      if (Platform.OS !== 'web' && mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 500);
      }
    }
  };

  return (
    <View style={styles.container}>
      <MapViewComponent
        ref={mapRef}
        style={styles.map}
        initialRegion={PUERTO_REGION}
        region={region}
        onRegionChangeComplete={setRegion}
        customMapStyle={darkMapStyle}
      >
        {userLocation && (
          <MarkerComponent
            coordinate={userLocation}
            title="Tu ubicación"
            pinColor={colors.neonBlue}
          />
        )}

        {filteredDiscotecas.map((discoteca) => (
          <MarkerComponent
            key={discoteca.id}
            coordinate={{
              latitude: discoteca.latitud,
              longitude: discoteca.longitud,
            }}
            onPress={() => handleMarkerPress(discoteca)}
            tracksViewChanges={false}
            discoteca={discoteca}
            selected={selectedDiscoteca?.id === discoteca.id}
          >
            <DiscotecaMarker
              nombre={discoteca.nombre}
              color={discoteca.color}
              selected={selectedDiscoteca?.id === discoteca.id}
            />
          </MarkerComponent>
        ))}
      </MapViewComponent>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar discotecas..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setShowResults(searchQuery.length > 0)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {showResults && (
          <View style={styles.resultsContainer}>
            <FlatList
              data={filteredDiscotecas}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => handleSelectDiscoteca(item)}
                >
                  <View style={[styles.resultDot, { backgroundColor: item.color }]} />
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{item.nombre}</Text>
                    <Text style={styles.resultGenre}>{item.genero}</Text>
                  </View>
                  <Text style={styles.resultRating}>⭐ {item.rating.toFixed(1)}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyResults}>
                  <Text style={styles.emptyText}>No se encontraron discotecas</Text>
                </View>
              }
            />
          </View>
        )}
      </View>

      {/* Botón de ubicación */}
      <TouchableOpacity style={styles.locationButton} onPress={handleCenterOnUser}>
        <Text style={styles.locationIcon}>📍</Text>
      </TouchableOpacity>

      {/* Tarjeta de discoteca seleccionada */}
      {selectedDiscoteca && (
        <DiscotecaCard discoteca={selectedDiscoteca} onClose={handleCloseCard} />
      )}
    </View>
  );
}

const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#1A1633' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#B8B3D4' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0D0B1E' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#3A3460' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#221D3D' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#2A2450' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#3A3460' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0D0B1E' }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    zIndex: 10,
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
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  resultsContainer: {
    marginTop: 8,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 300,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  resultGenre: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  resultRating: {
    color: colors.neonYellow,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyResults: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  locationButton: {
    position: 'absolute',
    right: 16,
    bottom: 200,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  locationIcon: {
    fontSize: 20,
  },
});