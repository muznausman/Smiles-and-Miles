// TripContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TripContext = createContext();

export const TripProvider = ({ children }) => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const storedActivities = await AsyncStorage.getItem('activities');
        if (storedActivities) {
          setActivities(JSON.parse(storedActivities));
        }
      } catch (error) {
        console.error('Failed to load activities from storage:', error);
      }
    };

    loadActivities();
  }, []);

  useEffect(() => {
    const saveActivities = async () => {
      try {
        await AsyncStorage.setItem('activities', JSON.stringify(activities));
      } catch (error) {
        console.error('Failed to save activities to storage:', error);
      }
    };

    saveActivities();
  }, [activities]);

  const addActivity = (newActivity) => {
    setActivities((prevActivities) => [...prevActivities, newActivity]);
  };

  return (
    <TripContext.Provider value={{ activities, setActivities, addActivity }}>
      {children}
    </TripContext.Provider>
  );
};
