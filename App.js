import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './Navigation';
import { TripProvider } from './TripContext';
import UserDataService from './UserDataService';

export default function App() {
  // Initialize user data on app start
  useEffect(() => {
    const initializeApp = async () => {
      await UserDataService.initializeUserData();
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
