// utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase/firebaseConfig'; // Import your Firebase auth

/**
 * Get a user-specific storage key
 * @param {string} baseKey - The base key to use
 * @returns {string} A user-specific key
 */
export const getUserKey = (baseKey) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user logged in');
  }
  return `${baseKey}_${user.uid}`;
};

/**
 * Save data to AsyncStorage with a user-specific key
 * @param {string} baseKey - The base key to use
 * @param {any} data - The data to save
 */
export const saveUserData = async (baseKey, data) => {
  try {
    const userKey = getUserKey(baseKey);
    await AsyncStorage.setItem(userKey, JSON.stringify(data));
    console.log(`Data saved for user with key ${userKey}`);
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

/**
 * Load data from AsyncStorage with a user-specific key
 * @param {string} baseKey - The base key to use
 * @returns {any} The loaded data, or null if no data exists
 */
export const loadUserData = async (baseKey) => {
  try {
    const userKey = getUserKey(baseKey);
    const data = await AsyncStorage.getItem(userKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading user data:', error);
    throw error;
  }
};

/**
 * Clear user data for a specific key
 * @param {string} baseKey - The base key to clear
 */
export const clearUserData = async (baseKey) => {
  try {
    const userKey = getUserKey(baseKey);
    await AsyncStorage.removeItem(userKey);
    console.log(`Data cleared for user with key ${userKey}`);
  } catch (error) {
    console.error('Error clearing user data:', error);
    throw error;
  }
};

/**
 * Clear all data for the current user
 * Will remove all items that include the user's ID
 */
export const clearAllUserData = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }
    
    const keys = await AsyncStorage.getAllKeys();
    const userKeys = keys.filter(key => key.includes(user.uid));
    
    if (userKeys.length > 0) {
      await AsyncStorage.multiRemove(userKeys);
      console.log(`Cleared all data for user ${user.uid}`);
    }
  } catch (error) {
    console.error('Error clearing all user data:', error);
    throw error;
  }
};

/**
 * Check if a user is logged in
 * @returns {boolean} True if a user is logged in, false otherwise
 */
export const isUserLoggedIn = () => {
  return auth.currentUser !== null;
};

/**
 * Get the current user's ID
 * @returns {string|null} The user's ID, or null if no user is logged in
 */
export const getCurrentUserId = () => {
  const user = auth.currentUser;
  return user ? user.uid : null;
};

/**
 * Get current user's display name or email
 * @returns {string} User display name or email
 */
export const getUserDisplayName = () => {
  const user = auth.currentUser;
  if (!user) return 'Guest';
  return user.displayName || user.email || user.uid.substring(0, 8);
};