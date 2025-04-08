// TripContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { loadUserData, saveUserData, getCurrentUserId } from './utils/storage';
import { auth } from './firebase/firebaseConfig';

// Constants for storage keys
const ACTIVITIES_STORAGE_KEY = '@tripActivities';

export const TripContext = createContext();

export const TripProvider = ({ children }) => {
  const [activities, setActivities] = useState([]);
  const [userId, setUserId] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        // Clear activities when user logs out
        setActivities([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load activities when userId changes
  useEffect(() => {
    const loadActivities = async () => {
      if (!userId) return;
      
      try {
        const storedActivities = await loadUserData(ACTIVITIES_STORAGE_KEY);
        if (storedActivities) {
          // Filter activities to only include those for the current user
          // or ones without a userId field (for backward compatibility)
          const filteredActivities = storedActivities.filter(
            activity => !activity.userId || activity.userId === userId
          );
          setActivities(filteredActivities);
        } else {
          // Reset activities when switching users
          setActivities([]);
        }
      } catch (error) {
        console.error('Failed to load activities from storage:', error);
      }
    };

    loadActivities();
  }, [userId]);

  // Save activities when they change
  useEffect(() => {
    const saveActivities = async () => {
      if (!userId) return;
      
      try {
        // Make sure each activity has the current userId if not already set
        const activitiesWithUserId = activities.map(activity => {
          if (!activity.userId) {
            return { ...activity, userId };
          }
          return activity;
        });
        
        await saveUserData(ACTIVITIES_STORAGE_KEY, activitiesWithUserId);
      } catch (error) {
        console.error('Failed to save activities to storage:', error);
      }
    };

    if (userId) {
      saveActivities();
    }
  }, [activities, userId]);

  const addActivity = (newActivity) => {
    // Make sure the activity has a userId if not already set
    const activityWithUserId = newActivity.userId 
      ? newActivity 
      : { ...newActivity, userId };
      
    setActivities((prevActivities) => [...prevActivities, activityWithUserId]);
  };

  return (
    <TripContext.Provider value={{ 
      activities, 
      setActivities, 
      addActivity, 
      userId 
    }}>
      {children}
    </TripContext.Provider>
  );
};

// Helper hook to access TripContext
export const useTrip = () => {
  return useContext(TripContext);
};