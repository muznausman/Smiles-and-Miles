// LanguageEssentials.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase/firebaseConfig';

const LanguageEssentials = ({ navigation }) => {
  const [phrase, setPhrase] = useState('');
  const [phrases, setPhrases] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'phrases'), orderBy('createdAt'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPhrases(fetched);
    }, (error) => {
      console.error('Error loading phrases:', error);
      Alert.alert('Error', 'Failed to load phrases');
    });

    return () => unsubscribe();
  }, []);

  const handleAddPhrase = async () => {
    if (!phrase.trim()) return;
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in');

      await addDoc(collection(db, 'users', user.uid, 'phrases'), {
        text: phrase,
        createdAt: new Date()
      });
      setPhrase('');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Error', error.message);
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

      <TextInput
        placeholder="Enter phrase"
        value={phrase}
        onChangeText={setPhrase}
        style={styles.input}
      />
      <TouchableOpacity onPress={handleAddPhrase}>
        <Text style={styles.addText}>Add Phrase</Text>
      </TouchableOpacity>

      {phrases.length === 0 ? (
        <Text style={styles.emptyText}>No phrases yet. Add one!</Text>
      ) : (
        <FlatList
          data={phrases}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.phraseItem}>
              <Text>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
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
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  addText: {
    color: '#4A90E2',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  phraseItem: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
  },
});

export default LanguageEssentials;
