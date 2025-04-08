// screens/DevScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const DevScreen = ({ navigation }) => {
  const [storageData, setStorageData] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  
  useEffect(() => {
    loadStorageData();
  }, []);
  
  const loadStorageData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const result = await AsyncStorage.multiGet(keys);
      
      const formattedData = result.map(([key, value]) => {
        try {
          const parsedValue = JSON.parse(value);
          return { key, value: parsedValue };
        } catch (e) {
          return { key, value };
        }
      });
      
      setStorageData(formattedData);
    } catch (error) {
      console.error('Error loading storage data:', error);
    }
  };
  
  const addDemoData = async () => {
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
      
      loadStorageData();
    } catch (error) {
      console.error('Error adding demo data:', error);
    }
  };
  
  const clearDemoData = async () => {
    try {
      await AsyncStorage.multiRemove(['demo_preferences', 'demo_profile', 'demo_history']);
      loadStorageData();
    } catch (error) {
      console.error('Error clearing demo data:', error);
    }
  };
  
  const toggleItem = (key) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const renderValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Developer Tools</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AsyncStorage Database</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.button} onPress={loadStorageData}>
            <Text style={styles.buttonText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={addDemoData}>
            <Text style={styles.buttonText}>Add Demo Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearDemoData}>
            <Text style={styles.buttonText}>Clear Demo Data</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {storageData.length === 0 ? (
          <Text style={styles.emptyText}>No data in AsyncStorage</Text>
        ) : (
          storageData.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.item}
              onPress={() => toggleItem(item.key)}
            >
              <Text style={styles.itemKey}>{item.key}</Text>
              <View style={styles.valueContainer}>
                {expandedItems[item.key] ? (
                  <Text style={styles.itemValue}>{renderValue(item.value)}</Text>
                ) : (
                  <Text style={styles.itemValuePreview}>
                    {typeof item.value === 'object' && item.value !== null 
                      ? `Object with ${Object.keys(item.value).length} properties` 
                      : (renderValue(item.value).substring(0, 40) + 
                         (renderValue(item.value).length > 40 ? '...' : ''))}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  section: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  clearButton: {
    backgroundColor: '#ffcdd2',
  },
  buttonText: {
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  item: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  itemKey: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  valueContainer: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
  },
  itemValue: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  itemValuePreview: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
    color: '#666',
  },
});

export default DevScreen;