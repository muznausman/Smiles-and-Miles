// utils/GetCurrentLocation.js
import * as Location from 'expo-location';

/**
 * Gets the user's current location with high accuracy
 * Returns the coordinates or throws an error if location cannot be determined
 */
export const getCurrentLocation = async () => {
  // First check if we have permission
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }

  // Use high accuracy
  try {
    // First try with high accuracy
    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 5000,  // Get a fresh reading if last one is > 5 seconds old
      mayShowUserSettingsDialog: true  // Allow system to show settings dialog if needed
    });

    // Verify we got valid coordinates
    if (!location || !location.coords || 
        (Math.abs(location.coords.latitude) < 0.0001 && 
         Math.abs(location.coords.longitude) < 0.0001)) {
      
      console.warn('Initial location attempt returned invalid coordinates, retrying with lower accuracy');
      
      // Try again with lower accuracy as fallback
      location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      
      // Check again
      if (!location || !location.coords || 
          (Math.abs(location.coords.latitude) < 0.0001 && 
           Math.abs(location.coords.longitude) < 0.0001)) {
        throw new Error('Received invalid coordinates from location service');
      }
    }

    console.log(`Got location: ${location.coords.latitude}, ${location.coords.longitude}`);
    
    // Try to get the address for debugging
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      if (address) {
        const locationString = [
          address.name,
          address.street,
          address.city,
          address.region,
          address.country
        ].filter(Boolean).join(', ');
        
        console.log(`Location address: ${locationString}`);
      }
    } catch (geoError) {
      // Don't fail if reverse geocoding fails
      console.warn('Geocoding error:', geoError);
    }

    return location.coords;
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
};

/**
 * Gets the user's location or returns null if it can't be determined
 * This version never throws - useful for non-critical features
 */
export const getLocationSafe = async () => {
  try {
    return await getCurrentLocation();
  } catch (error) {
    console.warn('Could not get location:', error);
    return null;
  }
};

/**
 * Checks if two locations are roughly the same within tolerance
 */
export const isSameLocation = (loc1, loc2, toleranceKm = 0.5) => {
  if (!loc1 || !loc2) return false;
  
  const distance = calculateDistance(
    loc1.latitude, 
    loc1.longitude, 
    loc2.latitude, 
    loc2.longitude
  );
  
  return distance <= toleranceKm;
};

/**
 * Calculate distance between two points in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
};

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

export default {
  getCurrentLocation,
  getLocationSafe,
  isSameLocation,
  calculateDistance
};