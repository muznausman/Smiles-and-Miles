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

const NotificationsScreen = ({ navigation }) => {
  // Notification settings states
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [tripReminders, setTripReminders] = useState(true);
  const [activityAlerts, setActivityAlerts] = useState(true);
  const [friendRequests, setFriendRequests] = useState(true);
  const [marketingNotifs, setMarketingNotifs] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const settingsJson = await AsyncStorage.getItem('notificationSettings');
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        setPushEnabled(settings.pushEnabled ?? true);
        setEmailEnabled(settings.emailEnabled ?? true);
        setTripReminders(settings.tripReminders ?? true);
        setActivityAlerts(settings.activityAlerts ?? true);
        setFriendRequests(settings.friendRequests ?? true);
        setMarketingNotifs(settings.marketingNotifs ?? false);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      Alert.alert('Error', 'Failed to load your notification settings');
    }
  };

  const saveNotificationSettings = async () => {
    setIsLoading(true);

    try {
      // Prepare settings data
      const settings = {
        pushEnabled,
        emailEnabled,
        tripReminders,
        activityAlerts,
        friendRequests,
        marketingNotifs,
        updatedAt: new Date().toISOString()
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(settings));

      // Show success message and go back
      Alert.alert('Success', 'Notification settings updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save your notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to disable notification types if all notifications are off
  const isDisabled = !pushEnabled && !emailEnabled;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={saveNotificationSettings} disabled={isLoading}>
            <Text style={[styles.saveText, isLoading && styles.disabledText]}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notification Channels */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Channels</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications on your device
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#ddd', true: '#a0c8ff' }}
              thumbColor={pushEnabled ? '#4A90E2' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications via email
              </Text>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
              trackColor={{ false: '#ddd', true: '#a0c8ff' }}
              thumbColor={emailEnabled ? '#4A90E2' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Notification Types */}
        <View style={[styles.section, isDisabled && styles.disabledSection]}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, isDisabled && styles.disabledText]}>
                Trip Reminders
              </Text>
              <Text style={[styles.settingDescription, isDisabled && styles.disabledText]}>
                Reminders about upcoming trips and activities
              </Text>
            </View>
            <Switch
              value={tripReminders}
              onValueChange={setTripReminders}
              trackColor={{ false: '#ddd', true: '#a0c8ff' }}
              thumbColor={tripReminders ? '#4A90E2' : '#f4f3f4'}
              disabled={isDisabled}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, isDisabled && styles.disabledText]}>
                Activity Alerts
              </Text>
              <Text style={[styles.settingDescription, isDisabled && styles.disabledText]}>
                Alerts about your scheduled activities
              </Text>
            </View>
            <Switch
              value={activityAlerts}
              onValueChange={setActivityAlerts}
              trackColor={{ false: '#ddd', true: '#a0c8ff' }}
              thumbColor={activityAlerts ? '#4A90E2' : '#f4f3f4'}
              disabled={isDisabled}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, isDisabled && styles.disabledText]}>
                Friend Requests
              </Text>
              <Text style={[styles.settingDescription, isDisabled && styles.disabledText]}>
                Notifications about new friend requests
              </Text>
            </View>
            <Switch
              value={friendRequests}
              onValueChange={setFriendRequests}
              trackColor={{ false: '#ddd', true: '#a0c8ff' }}
              thumbColor={friendRequests ? '#4A90E2' : '#f4f3f4'}
              disabled={isDisabled}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, isDisabled && styles.disabledText]}>
                Marketing & Promotions
              </Text>
              <Text style={[styles.settingDescription, isDisabled && styles.disabledText]}>
                Special offers and promotional content
              </Text>
            </View>
            <Switch
              value={marketingNotifs}
              onValueChange={setMarketingNotifs}
              trackColor={{ false: '#ddd', true: '#a0c8ff' }}
              thumbColor={marketingNotifs ? '#4A90E2' : '#f4f3f4'}
              disabled={isDisabled}
            />
          </View>
        </View>

        {/* Note about notifications */}
        <View style={styles.noteContainer}>
          <Ionicons name="information-circle-outline" size={22} color="#888" />
          <Text style={styles.noteText}>
            You can customize these settings at any time. Disabling push notifications may affect your experience with the app.
          </Text>
        </View>

        {/* Save Button (for bottom of screen) */}
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.disabledButton]} 
          onPress={saveNotificationSettings}
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
  disabledSection: {
    opacity: 0.7,
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
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f7ff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#6C84F5',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
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

export default NotificationsScreen;