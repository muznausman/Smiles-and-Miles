import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PrivacySettingsScreen = ({ navigation }) => {
  // Privacy settings states
  const [locationSharing, setLocationSharing] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState('friends');
  const [dataCollection, setDataCollection] = useState(true);
  const [allowTagging, setAllowTagging] = useState(true);
  const [shareTrips, setShareTrips] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const settingsJson = await AsyncStorage.getItem('privacySettings');
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        setLocationSharing(settings.locationSharing ?? false);
        setProfileVisibility(settings.profileVisibility ?? 'friends');
        setDataCollection(settings.dataCollection ?? true);
        setAllowTagging(settings.allowTagging ?? true);
        setShareTrips(settings.shareTrips ?? true);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      Alert.alert('Error', 'Failed to load your privacy settings');
    }
  };

  const savePrivacySettings = async () => {
    setIsLoading(true);

    try {
      // Prepare settings data
      const settings = {
        locationSharing,
        profileVisibility,
        dataCollection,
        allowTagging,
        shareTrips,
        updatedAt: new Date().toISOString()
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem('privacySettings', JSON.stringify(settings));

      // Show success message and go back
      Alert.alert('Success', 'Privacy settings updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      Alert.alert('Error', 'Failed to save your privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for profile visibility selection
  const VisibilityOption = ({ value, label, selected, onSelect }) => (
    <TouchableOpacity 
      style={[styles.visibilityOption, selected && styles.selectedOption]} 
      onPress={() => onSelect(value)}
    >
      <Text style={[styles.visibilityOptionText, selected && styles.selectedOptionText]}>
        {label}
      </Text>
      {selected && (
        <Ionicons name="checkmark" size={18} color="#6C84F5" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Settings</Text>
          <TouchableOpacity onPress={savePrivacySettings} disabled={isLoading}>
            <Text style={[styles.saveText, isLoading && styles.disabledText]}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Sharing</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Share Location</Text>
              <Text style={styles.settingDescription}>
                Allow the app to access your location while using it
              </Text>
            </View>
            <Switch
              value={locationSharing}
              onValueChange={setLocationSharing}
              trackColor={{ false: '#ddd', true: '#a0c8ff' }}
              thumbColor={locationSharing ? '#4A90E2' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Visibility</Text>
          <Text style={styles.settingDescription}>
            Control who can see your profile information
          </Text>
          
          <View style={styles.visibilityOptions}>
            <VisibilityOption
              value="public"
              label="Public"
              selected={profileVisibility === 'public'}
              onSelect={setProfileVisibility}
            />
            <VisibilityOption
              value="friends"
              label="Friends Only"
              selected={profileVisibility === 'friends'}
              onSelect={setProfileVisibility}
            />
            <VisibilityOption
              value="private"
              label="Private"
              selected={profileVisibility === 'private'}
              onSelect={setProfileVisibility}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Permissions</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Data Collection</Text>
              <Text style={styles.settingDescription}>
                Allow app to collect usage data to improve your experience
              </Text>
            </View>
            <Switch
              value={dataCollection}
              onValueChange={setDataCollection}
              trackColor={{ false: '#ddd', true: '#a0c8ff' }}
              thumbColor={dataCollection ? '#6C84F5' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow Tagging</Text>
              <Text style={styles.settingDescription}>
                Allow friends to tag you in photos and posts
              </Text>
            </View>
            <Switch
              value={allowTagging}
              onValueChange={setAllowTagging}
              trackColor={{ false: '#ddd', true: '#a0c8ff' }}
              thumbColor={allowTagging ? '#4A90E2' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Share Trips</Text>
              <Text style={styles.settingDescription}>
                Allow app to share your trips with friends
              </Text>
            </View>
            <Switch
              value={shareTrips}
              onValueChange={setShareTrips}
              trackColor={{ false: '#ddd', true: '#a0c8ff' }}
              thumbColor={shareTrips ? '#4A90E2' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Privacy Policy */}
        <TouchableOpacity style={styles.privacyPolicyButton}>
          <Text style={styles.privacyPolicyText}>Read Full Privacy Policy</Text>
        </TouchableOpacity>

        {/* Save Button (for bottom of screen) */}
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.disabledButton]} 
          onPress={savePrivacySettings}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveText: {
    color: '#6C84F5',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledText: {
    color: '#999',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  visibilityOptions: {
    marginTop: 12,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    borderColor: '#6C84F5',
    backgroundColor: '#f0f7ff',
  },
  visibilityOptionText: {
    fontSize: 15,
    color: '#555',
  },
  selectedOptionText: {
    color: '#6C84F5',
    fontWeight: '500',
  },
  privacyPolicyButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  privacyPolicyText: {
    color: '#4A90E2',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#6C84F5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#a0c8ff',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PrivacySettingsScreen;