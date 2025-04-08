// Navigation.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import your screens
import HomeScreen from './screens/HomeScreen';
import MemoriesScreen from './screens/MemoriesScreen';
import MyTripScreen from './screens/MyTripScreen';
import DocumentViewerScreen from './screens/DocumentViewerScreen';
import AccountScreen from './screens/AccountScreen';
import WeatherScreen from './screens/WeatherScreen';
import MapScreen from './screens/MapScreen';
import FoodScreen from './screens/FoodScreen';
import LanguageEssentialsScreen from './screens/LanguageEssentialsScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MemoryDetailsScreen from './screens/MemoryDetailsScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import PrivacySettingsScreen from './screens/PrivacySettingsScreen';
import DevScreen from './screens/DevScreen';

// DO NOT IMPORT THE DEBUG COMPONENTS YET
// We'll add them back once we get the base app working

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = 'home';
        } else if (route.name === 'Memories') {
          iconName = 'images';
        } else if (route.name === 'MyTrip') {
          iconName = 'map';
        } else if (route.name === 'Account') {
          iconName = 'person';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#4A90E2',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Memories" component={MemoriesScreen} />
    <Tab.Screen name="MyTrip" component={MyTripScreen} />
    <Tab.Screen name="Account" component={AccountScreen} />
  </Tab.Navigator>
);

const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Weather" component={WeatherScreen} />
        <Stack.Screen name="MapScreen" component={MapScreen} />
        <Stack.Screen name="FoodScreen" component={FoodScreen} />
        <Stack.Screen name="LanguageEssentials" component={LanguageEssentialsScreen} />
        <Stack.Screen name="MemoryDetails" component={MemoryDetailsScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Settings" component={PrivacySettingsScreen} />
        <Stack.Screen name="DocumentViewer" component={DocumentViewerScreen} />
        <Stack.Screen name="DevScreen" component={DevScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
      
      {/* We'll add the debug trigger back later */}
    </NavigationContainer>
  );
};

export default Navigation;