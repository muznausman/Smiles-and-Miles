// utils/AsyncStorageDebugTool.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a global variable accessible from the dev menu or console
global.showAsyncStorageData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const result = await AsyncStorage.multiGet(keys);
    
    console.log('\n===== ASYNCSTORAGE CONTENTS =====\n');
    
    if (keys.length === 0) {
      console.log('AsyncStorage is empty');
    } else {
      result.forEach(([key, value]) => {
        try {
          const parsedValue = JSON.parse(value);
          console.log(`${key}:`, parsedValue);
        } catch (e) {
          console.log(`${key}:`, value);
        }
      });
    }
    
    console.log('\n=================================\n');
    
    return result;
  } catch (error) {
    console.error('Error reading AsyncStorage:', error);
  }
};

// Utility to add some demo data
global.addAsyncStorageDemoData = async () => {
  try {
    await AsyncStorage.setItem('demo_preferences', JSON.stringify({
      theme: 'dark',
      notifications: true,
      language: 'en',
      lastUpdated: new Date().toISOString()
    }));
    
    await AsyncStorage.setItem('demo_profile', JSON.stringify({
      name: 'Demo User',
      email: 'demo@example.com',
      joinDate: new Date().toISOString(),
      isPremium: true
    }));
    
    await AsyncStorage.setItem('demo_history', JSON.stringify([
      { id: 'item1', name: 'First Item', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { id: 'item2', name: 'Second Item', timestamp: new Date(Date.now() - 43200000).toISOString() },
      { id: 'item3', name: 'Third Item', timestamp: new Date().toISOString() }
    ]));
    
    console.log('Demo data added to AsyncStorage');
    
    // Show the data we just added
    await global.showAsyncStorageData();
  } catch (error) {
    console.error('Error adding demo data:', error);
  }
};

// Utility to clear demo data
global.clearAsyncStorageDemoData = async () => {
  try {
    await AsyncStorage.multiRemove(['demo_preferences', 'demo_profile', 'demo_history']);
    console.log('Demo data cleared from AsyncStorage');
    
    // Show the remaining data
    await global.showAsyncStorageData();
  } catch (error) {
    console.error('Error clearing demo data:', error);
  }
};

// Initialize the debug tool
const initAsyncStorageDebugTool = () => {
  if (__DEV__) {
    console.log('\n===== ASYNCSTORAGE DEBUG TOOL =====');
    console.log('Available commands:');
    console.log('• global.showAsyncStorageData() - Show all AsyncStorage data');
    console.log('• global.addAsyncStorageDemoData() - Add sample data');
    console.log('• global.clearAsyncStorageDemoData() - Clear sample data');
    console.log('===================================\n');
  }
};

export default initAsyncStorageDebugTool;