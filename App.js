import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox } from 'react-native';
import Navigation from './Navigation';
import { TripProvider } from './TripContext';
import UserDataService from './UserDataService';
import AsyncStorageDebugTool from './utils/AsyncStorageDebugTool';

// Disable specific yellow box warnings if necessary
LogBox.ignoreLogs(['AsyncStorage has been extracted from']);

export default function App() {
  // Initialize user data on app start
  useEffect(() => {
    const initializeApp = async () => {
      await UserDataService.initializeUserData();
      
      // Initialize debug tool in development mode
      if (__DEV__) {
        AsyncStorageDebugTool.initialize();
        
        // For development, immediately load/display some demo data
        // Comment this out before production
        // AsyncStorageDebugTool.addDemoData();
      }
    };

    initializeApp();
  }, []);

  return (
    <SafeAreaProvider>
      <TripProvider>
        <Navigation />
      </TripProvider>
    </SafeAreaProvider>
  );
}