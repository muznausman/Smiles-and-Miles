// MapScreen.js - General map version
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { fetchPOIsFromMapbox } from '../utils/mapboxService';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const MapScreen = () => {
  const [location, setLocation] = useState(null);
  const [pois, setPOIs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setLoading(false);
        return;
      }

      // Get current location
      const currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      setLocation(currentLoc.coords);
      console.log(`Map using location: ${currentLoc.coords.latitude}, ${currentLoc.coords.longitude}`);

      // Get POIs
      const results = await fetchPOIsFromMapbox(
        currentLoc.coords.latitude,
        currentLoc.coords.longitude,
        'restaurant' // Keep original type
      );
      
      console.log(`Got ${results.length} POIs for map`);
      setPOIs(results);
    } catch (error) {
      console.error("Error loading map data:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMapData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* Current location marker */}
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Your Location"
            pinColor="#4A90E2"
          />
          
          {/* POI markers */}
          {Array.isArray(pois) && pois.map((poi) => {
            // Safely access coordinates, supporting both center array and geometry.coordinates
            if (!poi) return null;
            
            let latitude, longitude;
            
            // Check for center property (new format)
            if (poi.center && poi.center.length >= 2) {
              latitude = poi.center[1];
              longitude = poi.center[0];
            } 
            // Check for geometry property (old format)
            else if (poi.geometry && poi.geometry.coordinates && poi.geometry.coordinates.length >= 2) {
              latitude = poi.geometry.coordinates[1];
              longitude = poi.geometry.coordinates[0];
            } else {
              // Skip invalid POIs
              return null;
            }
            
            return (
              <Marker
                key={poi.id}
                title={poi.text || "Point of Interest"}
                description={poi.place_name || ""}
                coordinate={{
                  latitude,
                  longitude,
                }}
              />
            );
          })}
        </MapView>
      ) : (
        <Text style={styles.errorText}>Loading map...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
    backgroundColor: '#ffffffcc',
    padding: 10,
    borderRadius: 8,
  },
  backText: {
    fontSize: 16,
    color: '#333',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default MapScreen;