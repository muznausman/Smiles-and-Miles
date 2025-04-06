// HomeScreen.js with long press to delete activity (minimal change)
import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TripContext } from '../TripContext';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const HomeScreen = ({ navigation }) => {
  const { activities, setActivities } = useContext(TripContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [userData, setUserData] = useState(null);

  const filteredActivities = activities.filter((activity) =>
    activity.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleDeleteActivity = (id) => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setActivities((prev) => prev.filter((act) => act.id !== id));
          },
        },
      ]
    );
  };

  const handleWeatherPress = async () => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=London&appid=ff0013108650d61834968730de45b9fe&units=metric`
      );
      const data = await response.json();
      navigation.navigate('Weather', { weatherData: data });
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.topSection}>
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Account')}>
            <Image
              source={
                userData?.photoURL
                  ? { uri: userData.photoURL }
                  : require('../assets/profilepic.png')
              }
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <View>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.userName}>{userData?.name || 'Guest'}</Text>
          </View>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoriesContainer}>
          <TouchableOpacity style={styles.categoryButton} onPress={() => navigation.navigate('LanguageEssentials')}>
            <Ionicons name="chatbubble-ellipses-outline" size={28} color="#4A90E2" />
            <Text style={styles.categoryText}>Language</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryButton} onPress={() => navigation.navigate('MapScreen')}>
            <Ionicons name="map-outline" size={28} color="#4A90E2" />
            <Text style={styles.categoryText}>Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryButton} onPress={handleWeatherPress}>
            <Ionicons name="cloud-outline" size={28} color="#4A90E2" />
            <Text style={styles.categoryText}>Weather</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryButton} onPress={() => navigation.navigate('FoodScreen')}>
            <Ionicons name="restaurant-outline" size={28} color="#4A90E2" />
            <Text style={styles.categoryText}>Food</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Activities Coming up</Text>
        {filteredActivities.length === 0 ? (
          <Text>No upcoming activities. Add some from My Trip!</Text>
        ) : (
          <FlatList
            data={filteredActivities}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onLongPress={() => handleDeleteActivity(item.id)}>
                <View style={styles.activityCard}>
                  <Image source={require('../assets/logo.png')} style={styles.activityImage} />
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activityLocation}>{item.time}</Text>
                    
                  </View>
                </View>
              </TouchableOpacity>
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
    marginBottom: 10,
  },
  categoryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 15,
    width: '45%',
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