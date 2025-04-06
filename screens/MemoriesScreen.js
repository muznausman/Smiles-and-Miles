import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export default function MemoriesScreen() {
  const navigation = useNavigation();
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load memories from AsyncStorage
  const loadMemories = async () => {
    try {
      const savedMemories = await AsyncStorage.getItem('memories');
      if (savedMemories !== null) {
        setMemories(JSON.parse(savedMemories));
      } else {
        // Example memories data (only used first time)
        const initialMemories = [
          { id: 1, location: 'London 2025', description: "New Year's trip with friends", image: require('/Users/muznausman/smiles-and-miles/assets/trip.png') },
          { id: 2, location: 'Paris 2024', description: 'Honeymoon', image: require('/Users/muznausman/smiles-and-miles/assets/trip.png') },
          { id: 3, location: 'California 2024', description: 'Solo Trip', image: require('/Users/muznausman/smiles-and-miles/assets/trip.png') },
          { id: 4, location: 'New York 2023', description: 'First trip with Patrick', image: require('/Users/muznausman/smiles-and-miles/assets/trip.png') },
        ];
        await AsyncStorage.setItem('memories', JSON.stringify(initialMemories));
        setMemories(initialMemories);
      }
    } catch (error) {
      console.error('Failed to load memories:', error);
    }
  };

  // Reload memories each time the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadMemories();
      return () => {};
    }, [])
  );

  // Delete a memory
  const deleteMemory = (memoryId) => {
    Alert.alert(
      'Delete Memory',
      'Are you sure you want to delete this memory? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove memory from state
              const updatedMemories = memories.filter(memory => memory.id !== memoryId);
              setMemories(updatedMemories);
              
              // Save to AsyncStorage
              await AsyncStorage.setItem('memories', JSON.stringify(updatedMemories));
              
              // Also delete associated images and documents
              await AsyncStorage.removeItem(`memory_${memoryId}_images`);
              await AsyncStorage.removeItem(`memory_${memoryId}_documents`);
              
              // Show success message
              Alert.alert('Success', 'Memory deleted successfully');
            } catch (error) {
              console.error('Failed to delete memory:', error);
              Alert.alert('Error', 'Failed to delete memory: ' + error.message);
            }
          },
        },
      ],
    );
  };

  // Pick image for memory cover
  const pickCoverImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'We need access to your photos to set a cover image.');
        return null;
      }
      
      // Open image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Copy image to app's directory for persistence
        const imageUri = result.assets[0].uri;
        const fileName = `memory_cover_${Date.now()}.jpg`;
        const destinationUri = `${FileSystem.cacheDirectory}${fileName}`;
        
        await FileSystem.copyAsync({
          from: imageUri,
          to: destinationUri
        });
        
        return destinationUri;
      }
      
      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
      return null;
    }
  };

  // Create memory with steps (location, description, cover photo)
  const createMemoryWithSteps = async () => {
    setIsLoading(true);
    
    try {
      // Step 1: Get location
      const location = await new Promise((resolve) => {
        Alert.prompt(
          'New Memory',
          'Enter location name:',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
            { text: 'Next', onPress: (text) => resolve(text) }
          ],
          'plain-text'
        );
      });
      
      if (!location) {
        setIsLoading(false);
        return; // User canceled
      }
      
      // Step 2: Get description
      const description = await new Promise((resolve) => {
        Alert.prompt(
          'New Memory',
          'Enter description:',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
            { text: 'Next', onPress: (text) => resolve(text) }
          ],
          'plain-text'
        );
      });
      
      if (!description) {
        setIsLoading(false);
        return; // User canceled
      }
      
      // Step 3: Pick cover image
      Alert.alert(
        'Add Cover Photo',
        'Would you like to choose a cover photo for this memory?',
        [
          {
            text: 'Use Default',
            onPress: async () => {
              // Create memory with default image
              createMemory(location, description, null);
            }
          },
          {
            text: 'Choose Photo',
            onPress: async () => {
              const imageUri = await pickCoverImage();
              createMemory(location, description, imageUri);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating memory:', error);
      Alert.alert('Error', 'Failed to create memory: ' + error.message);
      setIsLoading(false);
    }
  };
  
  // Final creation of memory with all data
  const createMemory = async (location, description, imageUri) => {
    try {
      // Create memory object
      const newMemory = {
        id: Date.now(),
        location,
        description,
        image: imageUri || require('/Users/muznausman/smiles-and-miles/assets/logo.png'),
        imageIsUri: !!imageUri, // Flag to indicate if image is a URI or a require
      };
      
      const updatedMemories = [...memories, newMemory];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('memories', JSON.stringify(updatedMemories));
      
      // Update state
      setMemories(updatedMemories);
      
      // Navigate to memory details
      navigation.navigate('MemoryDetails', { memory: newMemory });
    } catch (error) {
      console.error('Error saving memory:', error);
      Alert.alert('Error', 'Failed to save memory: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render memory image (handles both require and URI)
  const renderMemoryImage = (memory) => {
    if (memory.imageIsUri) {
      return <Image source={{ uri: memory.image }} style={styles.memoryImage} />;
    } else {
      return <Image source={memory.image} style={styles.memoryImage} />;
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Memories</Text>
        </View>

        {/* Previous Trips */}
        <Text style={styles.sectionTitle}>Previous Trips</Text>
        {memories.length > 0 ? (
          memories.map((memory) => (
            <TouchableOpacity 
              key={memory.id} 
              style={styles.memoryCard} 
              onPress={() => navigation.navigate('MemoryDetails', { memory })}
              onLongPress={() => deleteMemory(memory.id)}
            >
              {renderMemoryImage(memory)}
              <View style={styles.memoryInfo}>
                <Text style={styles.memoryTitle}>{memory.location}</Text>
                <Text style={styles.memoryDescription}>{memory.description}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noMemoriesText}>No memories yet. Add your first trip memory!</Text>
        )}
      </ScrollView>
      
      {/* Add Memory Button */}
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={createMemoryWithSteps}
        disabled={isLoading}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
      
      {/* Help Text */}
      <View style={styles.helpTextContainer}>
        <Text style={styles.helpText}>Long press on a memory to delete it</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    backgroundColor: '#6C84F5',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
  },
  memoryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  memoryImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  memoryInfo: {
    flex: 1,
  },
  memoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  memoryDescription: {
    fontSize: 14,
    color: 'gray',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6C84F5',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  noMemoriesText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    marginBottom: 20,
  },
  helpTextContainer: {
    position: 'absolute',
    bottom: 80, // Position above the add button
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  helpText: {
    color: '#fff',
    fontSize: 12,
  },
});