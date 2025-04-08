// FoodScreen.js - Works with Versatile mapboxService
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Linking, 
  SafeAreaView, 
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { fetchPOIsFromMapbox } from '../utils/mapboxService';

const FoodScreen = ({ navigation }) => {
  const [foodPlaces, setFoodPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationName, setLocationName] = useState(null);

  useEffect(() => {
    loadFoodPlaces();
  }, []);

  const loadFoodPlaces = async () => {
    setLoading(true);
    setError(null);
    setFoodPlaces([]);
    
    try {
      // Request location permission
      console.log("Requesting location permission...");
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission denied. Please enable location permissions to find nearby restaurants.');
        setLoading(false);
        return;
      }

      console.log("Getting current location with high accuracy...");
      
      // Get highest accuracy location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        mayShowUserSettingsDialog: true
      });
      
      const coords = location.coords;
      setCurrentLocation(coords);
      console.log(`Got device location: ${coords.latitude}, ${coords.longitude}`);
      
      // Try to get a human-readable location name
      try {
        const [addressInfo] = await Location.reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude
        });
        
        if (addressInfo) {
          // Create a readable location name from the address components
          const locationComponents = [
            addressInfo.city || addressInfo.district || addressInfo.subregion,
            addressInfo.region,
            addressInfo.country
          ].filter(Boolean);
          
          if (locationComponents.length > 0) {
            setLocationName(locationComponents.join(', '));
            console.log(`Location name: ${locationComponents.join(', ')}`);
          }
        }
      } catch (geoError) {
        console.warn("Error getting location name:", geoError);
      }
      
      // Get restaurants using our versatile service, specify "food" as the type
      console.log("Fetching food places...");
      const results = await fetchPOIsFromMapbox(
        coords.latitude,
        coords.longitude,
        "food"  // This tells the service to use food-specific search
      );
      
      if (results.length === 0) {
        setError('No food places found nearby. Try refreshing or moving to an area with more food options.');
      } else {
        console.log(`Found ${results.length} food places to display`);
        setFoodPlaces(results);
      }
    } catch (error) {
      console.error('Error in loadFoodPlaces:', error);
      setError(`Error finding food places: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openMap = (longitude, latitude, placeName) => {
    const encodedName = encodeURIComponent(placeName);
    
    // Platform specific maps links
    const url = Platform.select({
      ios: `maps:?q=${encodedName}&ll=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${encodedName}`
    }) || `https://www.google.com/maps/search/?api=1&query=${encodedName}`;
    
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          // Fallback for web or if maps app isn't available
          const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
          return Linking.openURL(webUrl);
        }
      })
      .catch(err => {
        console.error('Error opening map:', err);
        Alert.alert('Error', 'Could not open maps application');
      });
  };
  
  const refreshFoodPlaces = () => {
    loadFoodPlaces();
  };

  // Format distance for display
  const formatDistance = (distance) => {
    if (distance === null || distance === undefined) return '';
    
    if (distance < 1) {
      // Less than 1km, show in meters
      return `${Math.round(distance * 1000)}m`;
    } else {
      // More than 1km, show in km with 1 decimal place
      return `${distance.toFixed(1)}km`;
    }
  };
  
  // Get an icon for different types of food places
  const getFoodIcon = (placeName) => {
    const name = (placeName || '').toLowerCase();
    
    if (name.includes('coffee') || name.includes('cafe') || name.includes('starbucks')) {
      return 'cafe-outline';
    } else if (name.includes('bar') || name.includes('pub') || name.includes('brew')) {
      return 'beer-outline';
    } else if (name.includes('bakery') || name.includes('pastry') || name.includes('donut')) {
      return 'nutrition-outline';
    } else if (name.includes('pizza')) {
      return 'pizza-outline';
    } else if (name.includes('fast') || name.includes('burger') || name.includes('mcdonald')) {
      return 'fast-food-outline';
    } else {
      return 'restaurant-outline';
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Food</Text>
        <TouchableOpacity onPress={refreshFoodPlaces} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#4A90E2" />
        </TouchableOpacity>
      </View>
      
      {currentLocation && (
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.locationText}>
            {locationName 
              ? `Current location: ${locationName}` 
              : `Using location: ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
            }
          </Text>
        </View>
      )}
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Looking for nearby food places...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshFoodPlaces}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : foodPlaces.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.noResultsText}>No food places found nearby</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshFoodPlaces}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={foodPlaces}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            // Get and format distance
            const distanceText = formatDistance(item.distance);
            // Get appropriate icon
            const iconName = getFoodIcon(item.text);
            
            return (
              <TouchableOpacity
                style={styles.placeContainer}
                onPress={() => openMap(
                  item.center[0], 
                  item.center[1], 
                  item.text
                )}
              >
                <View style={styles.placeContent}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={iconName} size={24} color="#4A90E2" />
                  </View>
                  
                  <View style={styles.placeDetails}>
                    <View style={styles.placeHeader}>
                      <Text style={styles.placeName} numberOfLines={1}>
                        {item.text}
                      </Text>
                      {distanceText ? (
                        <View style={styles.distanceBadge}>
                          <Text style={styles.distanceText}>{distanceText}</Text>
                        </View>
                      ) : null}
                    </View>
                    
                    <Text style={styles.placeAddress} numberOfLines={2}>
                      {item.place_name}
                    </Text>
                    
                    <View style={styles.placeFooter}>
                      <Ionicons name="navigate-outline" size={16} color="#4A90E2" />
                      <Text style={styles.directionsText}>Get Directions</Text>
                    </View>
                  </View>
                  
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  refreshButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
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
    paddingHorizontal: 20,
  },
  noResultsText: {
    color: '#666',
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
  placeContainer: {
    padding: 12,
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
  },
  placeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#f5f9ff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeDetails: {
    flex: 1,
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  distanceBadge: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    color: '#0277bd',
    fontWeight: '500',
  },
  placeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  placeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  directionsText: {
    fontSize: 13,
    color: '#4A90E2',
    marginLeft: 5,
  },
  listContent: {
    paddingBottom: 20,
  }
});

export default FoodScreen;