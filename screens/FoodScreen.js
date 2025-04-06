// FoodScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, SafeAreaView } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const FoodScreen = ({ navigation }) => {
  const [foodPlaces, setFoodPlaces] = useState([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      fetchFoodPlaces(location.coords.latitude, location.coords.longitude);
    })();
  }, []);

  const fetchFoodPlaces = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/restaurant.json?proximity=${lon},${lat}&access_token=pk.eyJ1IjoibXV6emllMjIiLCJhIjoiY204bjRvcHA2MG5jaDJqcGw5eWJzOTcxbyJ9.d7PVM68c3Fv734NMJaMuRg`
      );
      const data = await response.json();
      setFoodPlaces(data.features);
    } catch (error) {
      console.error('Error fetching food places:', error);
    }
  };

  const openMap = (longitude, latitude) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Food</Text>
      </View>
      <FlatList
        data={foodPlaces}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.placeContainer}
            onPress={() => openMap(item.center[0], item.center[1])}
          >
            <Text style={styles.placeName}>{item.text}</Text>
            <Text style={styles.placeAddress}>{item.place_name}</Text>
          </TouchableOpacity>
        )}
      />
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
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  placeContainer: {
    padding: 15,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeAddress: {
    fontSize: 14,
    color: '#555',
  },
});

export default FoodScreen;
