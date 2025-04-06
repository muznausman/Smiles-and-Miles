import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TripContext } from '../TripContext';

const HomeScreen = ({ navigation }) => {
  const { activities } = useContext(TripContext);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.topSection}>
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Account')}>
            <Image source={require('../assets/profilepic.png')} style={styles.profileImage} />
          </TouchableOpacity>
          <View>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.userName}>Muzna Usman</Text>
          </View>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput placeholder="Search" style={styles.searchInput} />
        </View>
      </View>

      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoriesContainer}>
          <TouchableOpacity style={styles.categoryButton}>
            <Ionicons name="document-text-outline" size={28} color="#4A90E2" />
            <Text style={styles.categoryText}>Documents</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryButton}>
            <Ionicons name="map-outline" size={28} color="#4A90E2" />
            <Text style={styles.categoryText}>Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryButton}>
            <Ionicons name="cloud-outline" size={28} color="#4A90E2" />
            <Text style={styles.categoryText}>Weather</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryButton}>
            <Ionicons name="restaurant-outline" size={28} color="#4A90E2" />
            <Text style={styles.categoryText}>Food</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Activities Coming up</Text>
        {activities.length === 0 ? (
          <Text>No upcoming activities. Add some from My Trip!</Text>
        ) : (
          <FlatList
            data={activities}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.activityCard}>
                <Image source={require('../assets/trip.png')} style={styles.activityImage} />
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activityLocation}>{item.time}</Text>

                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topSection: {
    backgroundColor: '#6C84F5',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  welcomeText: {
    fontSize: 14,
    color: '#fff',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  categoryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 15,
    width: '30%',
    marginBottom: 10,
  },
  categoryText: {
    marginTop: 5,
    fontSize: 12,
    color: '#555',
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 10,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontWeight: 'bold',
  },
  activityLocation: {
    color: '#888',
    fontSize: 12,
  },
  activityRating: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
