import AsyncStorage from '@react-native-async-storage/async-storage';

// This service provides helper functions for managing user data
const UserDataService = {
  // User profile
  async getUserProfile() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  async saveUserProfile(profileData) {
    try {
      const currentData = await this.getUserProfile() || {};
      const updatedData = { ...currentData, ...profileData, updatedAt: new Date().toISOString() };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedData));
      return true;
    } catch (error) {
      console.error('Error saving user profile:', error);
      return false;
    }
  },

  // Profile image
  async getProfileImage() {
    try {
      return await AsyncStorage.getItem('profileImage');
    } catch (error) {
      console.error('Error getting profile image:', error);
      return null;
    }
  },

  async saveProfileImage(imageUri) {
    try {
      await AsyncStorage.setItem('profileImage', imageUri);
      return true;
    } catch (error) {
      console.error('Error saving profile image:', error);
      return false;
    }
  },

  // Privacy settings
  async getPrivacySettings() {
    try {
      const settings = await AsyncStorage.getItem('privacySettings');
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error getting privacy settings:', error);
      return null;
    }
  },

  async savePrivacySettings(settingsData) {
    try {
      const currentSettings = await this.getPrivacySettings() || {};
      const updatedSettings = { 
        ...currentSettings, 
        ...settingsData, 
        updatedAt: new Date().toISOString() 
      };
      await AsyncStorage.setItem('privacySettings', JSON.stringify(updatedSettings));
      return true;
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      return false;
    }
  },

  // Notification settings
  async getNotificationSettings() {
    try {
      const settings = await AsyncStorage.getItem('notificationSettings');
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  },

  async saveNotificationSettings(settingsData) {
    try {
      const currentSettings = await this.getNotificationSettings() || {};
      const updatedSettings = { 
        ...currentSettings, 
        ...settingsData, 
        updatedAt: new Date().toISOString() 
      };
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(updatedSettings));
      return true;
    } catch (error) {
      console.error('Error saving notification settings:', error);
      return false;
    }
  },

  // Initialize default settings
  async initializeUserData() {
    const defaultUserData = {
      name: 'Muzna Usman',
      email: 'muzna@example.com',
      phone: '',
      location: '',
      createdAt: new Date().toISOString()
    };

    const defaultPrivacySettings = {
      locationSharing: false,
      profileVisibility: 'friends',
      dataCollection: true,
      allowTagging: true,
      shareTrips: true,
      createdAt: new Date().toISOString()
    };

    const defaultNotificationSettings = {
      pushEnabled: true,
      emailEnabled: true,
      tripReminders: true,
      activityAlerts: true,
      friendRequests: true,
      marketingNotifs: false,
      createdAt: new Date().toISOString()
    };

    // Only initialize if not already set
    const userData = await this.getUserProfile();
    if (!userData) {
      await this.saveUserProfile(defaultUserData);
    }

    const privacySettings = await this.getPrivacySettings();
    if (!privacySettings) {
      await this.savePrivacySettings(defaultPrivacySettings);
    }

    const notificationSettings = await this.getNotificationSettings();
    if (!notificationSettings) {
      await this.saveNotificationSettings(defaultNotificationSettings);
    }
  },

  // Reset all user data (for logout, testing, etc.)
  async resetAllUserData() {
    try {
      await AsyncStorage.multiRemove([
        'userData', 
        'profileImage', 
        'privacySettings', 
        'notificationSettings'
      ]);
      return true;
    } catch (error) {
      console.error('Error resetting user data:', error);
      return false;
    }
  }
};

export default UserDataService;