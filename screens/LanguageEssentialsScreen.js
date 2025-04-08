// LanguageEssentials.js - User-Specific Version
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert, 
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebase/firebaseConfig'; // Import Firebase auth
import { loadUserData, saveUserData, getUserDisplayName } from '../utils/storage'; // Import storage utilities

// Base key for storing phrases
const PHRASES_KEY = '@language_phrases';

const LanguageEssentials = ({ navigation }) => {
  const [phrase, setPhrase] = useState('');
  const [phrases, setPhrases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  // Load phrases from user-specific storage on component mount
  useEffect(() => {
    // Check if user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      Alert.alert('Error', 'You must be logged in to use this feature');
      navigation.goBack();
      return;
    }
    
    setUserName(getUserDisplayName());
    loadPhrases();
    
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // User logged out, navigate back
        navigation.goBack();
      } else {
        setUserName(getUserDisplayName());
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Load phrases from user-specific storage
  const loadPhrases = async () => {
    setLoading(true);
    try {
      const userData = await loadUserData(PHRASES_KEY);
      if (userData) {
        setPhrases(userData);
      } else {
        setPhrases([]);
      }
    } catch (error) {
      console.error('Error loading phrases:', error);
      Alert.alert('Error', 'Failed to load phrases');
    } finally {
      setLoading(false);
    }
  };

  // Add a new phrase
  const handleAddPhrase = async () => {
    if (!phrase.trim()) return;
    
    try {
      // Create new phrase object
      const newPhrase = {
        id: Date.now().toString(),
        text: phrase,
        createdAt: new Date().toISOString()
      };
      
      // Update state and storage
      const updatedPhrases = [...phrases, newPhrase];
      setPhrases(updatedPhrases);
      await saveUserData(PHRASES_KEY, updatedPhrases);
      
      // Clear input
      setPhrase('');
      
      console.log('Phrase added successfully!');
    } catch (error) {
      console.error('Add phrase error:', error);
      Alert.alert('Error', 'Failed to add phrase');
    }
  };

  // Delete a phrase
  const handleDeletePhrase = async (id) => {
    try {
      const updatedPhrases = phrases.filter(item => item.id !== id);
      setPhrases(updatedPhrases);
      await saveUserData(PHRASES_KEY, updatedPhrases);
    } catch (error) {
      console.error('Delete phrase error:', error);
      Alert.alert('Error', 'Failed to delete phrase');
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <Text style={styles.title}>Language Essentials</Text>
      </View>
      
      {/* Show user info to confirm which account is active */}
      <View style={styles.userInfo}>
        <Ionicons name="person-circle-outline" size={16} color="#666" />
        <Text style={styles.userText}>{userName}</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Enter phrase"
          value={phrase}
          onChangeText={setPhrase}
          style={styles.input}
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddPhrase}
          disabled={!phrase.trim()}
        >
          <Text style={[styles.addText, !phrase.trim() && styles.disabledText]}>
            Add Phrase
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading phrases...</Text>
        </View>
      ) : phrases.length === 0 ? (
        <Text style={styles.emptyText}>No phrases yet. Add one!</Text>
      ) : (
        <FlatList
          data={phrases}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.phraseItem}>
              <Text style={styles.phraseText}>{item.text}</Text>
              <TouchableOpacity 
                onPress={() => handleDeletePhrase(item.id)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  userText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#E6EBFF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: '#A0A0A0',
  },
  phraseItem: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phraseText: {
    fontSize: 16,
    flex: 1,
  },
  deleteButton: {
    padding: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  listContainer: {
    paddingBottom: 100,
  },
});

export default LanguageEssentials;