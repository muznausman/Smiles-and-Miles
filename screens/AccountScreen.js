// AccountScreen.js
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  Modal,
  FlatList,
  SafeAreaView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

const AccountScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [debugTaps, setDebugTaps] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [storageData, setStorageData] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [showOnlyCurrentUser, setShowOnlyCurrentUser] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Set up a real-time listener for user document changes
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      try {
        if (docSnap.exists()) {
          const userData = docSnap.data();

          // Load saved profile image from AsyncStorage
          const savedImageUri = await AsyncStorage.getItem('userProfileImage');
          
          // Update Firestore with the AsyncStorage image if it exists
          if (savedImageUri && savedImageUri !== userData.photoURL) {
            await updateDoc(userDocRef, {
              photoURL: savedImageUri
            });
            
            // Update local state
            userData.photoURL = savedImageUri;
          }

          // Set user data and profile image
          setUserData({
            name: userData.name || user.displayName || 'Guest',
            email: user.email || 'example@email.com',
            photoURL: userData.photoURL
          });

          // Set profile image
          if (userData.photoURL) {
            setProfileImage({ uri: userData.photoURL });
          }
        }
      } catch (error) {
        console.error('Error in snapshot listener:', error);
      }
    }, (error) => {
      console.error('Error listening to user document:', error);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const loadStorageData = async () => {
    try {
      const currentUser = auth.currentUser;
      const keys = await AsyncStorage.getAllKeys();
      const result = await AsyncStorage.multiGet(keys);
      
      // Group data by user
      const groupedData = {};
      const systemData = [];
      
      result.forEach(([key, value]) => {
        try {
          // Try to parse JSON values
          const parsedValue = JSON.parse(value);
          
          // Determine which user this data belongs to
          let userId = null;
          let baseKey = key;
          
          // Extract user ID from key if present (looking for pattern: key_userId)
          const userIdMatch = key.match(/_([a-zA-Z0-9]{20,})$/);
          if (userIdMatch && userIdMatch[1]) {
            userId = userIdMatch[1];
            baseKey = key.replace(`_${userId}`, '');
            
            // Initialize user group if not exists
            if (!groupedData[userId]) {
              groupedData[userId] = [];
            }
            
            // Add data to appropriate user group
            groupedData[userId].push({
              key,
              baseKey,
              value: parsedValue,
              type: 'data'
            });
          } else {
            // This is system data (not user-specific)
            systemData.push({
              key,
              baseKey: key,
              value: parsedValue,
              type: 'data'
            });
          }
        } catch (e) {
          // If not JSON, store as raw data
          systemData.push({
            key,
            baseKey: key,
            value,
            type: 'data',
            isRawData: true
          });
        }
      });
      
      // Format data for display with sections
      const formattedData = [];
      
      // Add current user's data first (if there is a current user)
      if (currentUser && groupedData[currentUser.uid]) {
        formattedData.push({
          type: 'header',
          id: 'current-user-header',
          title: 'Current User Data'
        });
        
        formattedData.push(...groupedData[currentUser.uid].map(item => ({
          ...item,
          isCurrentUser: true
        })));
        
        // Remove current user from groupedData to avoid duplication
        delete groupedData[currentUser.uid];
      }
      
      // Add other users' data if we're showing all users
      if (!showOnlyCurrentUser) {
        Object.keys(groupedData).forEach(userId => {
          if (groupedData[userId].length > 0) {
            formattedData.push({
              type: 'header',
              id: `user-${userId}-header`,
              title: `User: ${userId.substring(0, 8)}...`
            });
            
            formattedData.push(...groupedData[userId].map(item => ({
              ...item,
              isCurrentUser: false
            })));
          }
        });
      }
      
      // Add system data (not user-specific) last
      if (systemData.length > 0) {
        formattedData.push({
          type: 'header',
          id: 'system-data-header',
          title: 'System Data'
        });
        
        formattedData.push(...systemData.map(item => ({
          ...item,
          isCurrentUser: false,
          isSystemData: true
        })));
      }
      
      setStorageData(formattedData);
      setShowDebugModal(true);
    } catch (error) {
      console.error('Error loading storage data:', error);
      Alert.alert('Error', 'Failed to load AsyncStorage data');
    }
  };

  const addDemoData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not logged in');
        return;
      }
      
      // Sample user preferences
      await AsyncStorage.setItem(`preferences_${user.uid}`, JSON.stringify({
        theme: 'dark',
        notifications: true,
        language: 'en',
        lastUpdated: new Date().toISOString()
      }));
      
      // Sample user profile
      await AsyncStorage.setItem(`profile_${user.uid}`, JSON.stringify({
        name: userData?.name || 'Demo User',
        email: userData?.email || 'demo@example.com',
        joinDate: new Date().toISOString(),
        isPremium: true
      }));
      
      // Sample recent items
      await AsyncStorage.setItem(`recentItems_${user.uid}`, JSON.stringify([
        { id: 'item1', name: 'First Item', timestamp: new Date().getTime() - 86400000 },
        { id: 'item2', name: 'Second Item', timestamp: new Date().getTime() - 43200000 },
        { id: 'item3', name: 'Third Item', timestamp: new Date().getTime() - 3600000 },
      ]));
      
      Alert.alert('Success', 'Demo data added successfully');
      loadStorageData(); // Refresh the storage data display
    } catch (error) {
      console.error('Error adding demo data:', error);
      Alert.alert('Error', 'Failed to add demo data');
    }
  };

  const clearDemoData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not logged in');
        return;
      }
      
      const keys = [
        `preferences_${user.uid}`,
        `profile_${user.uid}`,
        `recentItems_${user.uid}`
      ];
      
      await AsyncStorage.multiRemove(keys);
      Alert.alert('Success', 'Demo data cleared successfully');
      loadStorageData(); // Refresh the storage data display
    } catch (error) {
      console.error('Error clearing demo data:', error);
      Alert.alert('Error', 'Failed to clear demo data');
    }
  };

  const toggleUserFilter = () => {
    setShowOnlyCurrentUser(!showOnlyCurrentUser);
    loadStorageData();
  };

  const handleDebugTap = () => {
    const now = Date.now();
    
    // Reset counter if last tap was more than 1.5 seconds ago
    if (now - lastTapTime > 1500) {
      setDebugTaps(1);
    } else {
      setDebugTaps(prev => prev + 1);
    }
    
    setLastTapTime(now);
    
    // Show debug modal after 3 quick taps
    if (debugTaps === 2) {
      if (__DEV__) {
        loadStorageData();
      }
      setDebugTaps(0);
    }
  };

  const toggleItem = (key) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const pickImage = async () => {
    try {
      // Request permission for media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      // Launch image picker
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      console.log('Image Picker Result:', JSON.stringify(result, null, 2));

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // Validate image
        if (!selectedImage.uri) {
          Alert.alert('Error', 'Unable to select image. Please try again.');
          return;
        }

        // Save image to AsyncStorage and Firestore
        await saveProfileImage(selectedImage.uri);
      }
    } catch (error) {
      console.error('Image Picker Error:', error);
      Alert.alert('Error', `Failed to pick an image: ${error.message}`);
    }
  };

  const saveProfileImage = async (imageUri) => {
    try {
      setUploading(true);
      const user = auth.currentUser;
      
      // Save image URI to AsyncStorage
      await AsyncStorage.setItem('userProfileImage', imageUri);

      // Update Firestore document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        photoURL: imageUri
      });

      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Save Profile Image Error:', error);
      Alert.alert('Error', 'Failed to save profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear saved profile image on logout
      await AsyncStorage.removeItem('userProfileImage');
      
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Logout Error', error.message);
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      const user = auth.currentUser;
      
      // Remove profile picture from AsyncStorage
      await AsyncStorage.removeItem('userProfileImage');
      
      // Remove photoURL from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        photoURL: null
      });

      // Set profileImage state to null
      setProfileImage(null);

      Alert.alert('Success', 'Profile picture removed');
    } catch (error) {
      console.error('Remove Profile Picture Error:', error);
      Alert.alert('Error', 'Failed to remove profile picture');
    }
  };

  const profileImageSource = profileImage?.uri ? { uri: profileImage.uri } : null;

  const renderStorageItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>{item.title}</Text>
        </View>
      );
    }
    
    return (
      <TouchableOpacity 
        style={[
          styles.storageItem,
          item.isCurrentUser ? styles.currentUserItem : null,
          item.isSystemData ? styles.systemDataItem : null,
        ]}
        onPress={() => toggleItem(item.key)}
      >
        <View style={styles.storageItemHeader}>
          <Text style={styles.storageItemKey}>
            {item.baseKey}
          </Text>
          {item.isCurrentUser && (
            <View style={styles.userBadge}>
              <Text style={styles.userBadgeText}>Current User</Text>
            </View>
          )}
          {item.isSystemData && (
            <View style={[styles.userBadge, styles.systemBadge]}>
              <Text style={styles.userBadgeText}>System</Text>
            </View>
          )}
        </View>
        <View style={styles.storageItemValueContainer}>
          {expandedItems[item.key] ? (
            <Text style={styles.storageItemValue}>{renderValue(item.value)}</Text>
          ) : (
            <Text style={styles.storageItemValuePreview}>
              {typeof item.value === 'object' && item.value !== null 
                ? `Object with ${Object.keys(item.value).length} properties` 
                : (renderValue(item.value).substring(0, 40) + 
                  (renderValue(item.value).length > 40 ? '...' : ''))}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Hidden debug trigger */}
        <TouchableOpacity 
          style={styles.debugTrigger}
          onPress={handleDebugTap}
          activeOpacity={1}
        />

        <TouchableOpacity onPress={pickImage} style={styles.profileContainer} disabled={uploading}>
          {profileImageSource ? (
            <Image 
              source={profileImageSource} 
              style={styles.profileImage} 
            />
          ) : (
            <View style={styles.profileImagePlaceholder} />
          )}
          {uploading ? (
            <Text style={styles.imageUploadText}>Uploading...</Text>
          ) : (
            <Text style={styles.imageUploadText}>Tap to change profile picture</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.name}>{userData?.name || 'Guest'}</Text>
        <Text style={styles.email}>{userData?.email || 'example@email.com'}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Notifications')}>
            <Text style={styles.buttonText}>Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.buttonText}>Privacy & Settings</Text>
          </TouchableOpacity>
          {profileImage?.uri && (
            <TouchableOpacity style={[styles.button, styles.removeButton]} onPress={handleRemoveProfilePicture}>
              <Text style={styles.removeButtonText}>Remove Profile Picture</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
            <Text style={[styles.buttonText, styles.logoutButtonText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* AsyncStorage Debug Modal */}
      <Modal
        visible={showDebugModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowDebugModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>AsyncStorage Database</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowDebugModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalOptions}>
            <TouchableOpacity 
              style={[
                styles.filterButton, 
                showOnlyCurrentUser ? styles.filterButtonActive : null
              ]} 
              onPress={toggleUserFilter}
            >
              <Text style={styles.filterButtonText}>
                {showOnlyCurrentUser ? 'Current User Only' : 'Show All Users'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalActionButton} onPress={loadStorageData}>
              <Text style={styles.modalActionButtonText}>Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalActionButton} onPress={addDemoData}>
              <Text style={styles.modalActionButtonText}>Add Demo Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalActionButton, styles.modalClearButton]} onPress={clearDemoData}>
              <Text style={styles.modalActionButtonText}>Clear Demo Data</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={storageData}
            keyExtractor={(item, index) => item.id || item.key || index.toString()}
            renderItem={renderStorageItem}
            ListEmptyComponent={
              <Text style={styles.emptyListText}>No data in AsyncStorage</Text>
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugTrigger: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 60,
    height: 60,
    zIndex: 999,
    // Uncomment for testing to see the touch area
    // backgroundColor: 'rgba(255,0,0,0.3)',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    marginBottom: 10,
  },
  imageUploadText: {
    color: '#6C84F5',
    fontSize: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#888',
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: '#6C84F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderColor: '#6C84F5',
    borderWidth: 1,
  },
  logoutButtonText: {
    color: '#6C84F5',
  },
  removeButton: {
    backgroundColor: '#FF6347',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    backgroundColor: '#6C84F5',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  modalCloseButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  modalCloseButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalOptions: {
    backgroundColor: 'white',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  filterButtonActive: {
    backgroundColor: '#B0C4DE',
  },
  filterButtonText: {
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalActionButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
  },
  modalActionButtonText: {
    fontWeight: '600',
  },
  modalClearButton: {
    backgroundColor: '#ffcdd2',
  },
  
  // Storage Item Styles
  sectionHeader: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  storageItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  currentUserItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#6C84F5',
  },
  systemDataItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  storageItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  storageItemKey: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6C84F5',
    flex: 1,
  },
  userBadge: {
    backgroundColor: '#6C84F5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  systemBadge: {
    backgroundColor: '#FFA500',
  },
  userBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  storageItemValueContainer: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
  },
  storageItemValue: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  storageItemValuePreview: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#666',
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#888',
  },
});

export default AccountScreen;