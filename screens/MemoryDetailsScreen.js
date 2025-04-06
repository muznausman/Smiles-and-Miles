// MemoryDetailsScreen.js (with journal support added)
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MemoryDetailsScreen = ({ route }) => {
    const navigation = useNavigation();
    const { memory } = route.params;
    const [images, setImages] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [journalEntry, setJournalEntry] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    // Define storage keys
    const imagesKey = `memory_${memory.id}_images`;
    const documentsKey = `memory_${memory.id}_documents`;
    const journalKey = `memory_${memory.id}_journal`;

    // Load data when screen is focused
    useFocusEffect(
      useCallback(() => {
        console.log('Loading memory data...');
        loadMemoryData();
        return () => { console.log('Screen lost focus'); };
      }, [memory.id])
    );

    useEffect(() => {
      loadMemoryData();
    }, []);

    const loadMemoryData = async () => {
      try {
        setIsLoading(true);

        const savedImages = await AsyncStorage.getItem(imagesKey);
        if (savedImages !== null) setImages(JSON.parse(savedImages));

        const savedDocs = await AsyncStorage.getItem(documentsKey);
        if (savedDocs !== null) setDocuments(JSON.parse(savedDocs));

        const savedJournal = await AsyncStorage.getItem(journalKey);
        if (savedJournal !== null) setJournalEntry(savedJournal);

      } catch (error) {
        console.error('Failed to load memory data:', error);
        Alert.alert('Error', 'Failed to load memory data: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    const saveImages = async (newImages) => {
      try {
        await AsyncStorage.setItem(imagesKey, JSON.stringify(newImages));
      } catch (error) {
        console.error('Failed to save images:', error);
        Alert.alert('Error', 'Failed to save images: ' + error.message);
      }
    };

    const saveDocuments = async (newDocs) => {
      try {
        await AsyncStorage.setItem(documentsKey, JSON.stringify(newDocs));
      } catch (error) {
        console.error('Failed to save documents:', error);
        Alert.alert('Error', 'Failed to save documents: ' + error.message);
      }
    };

    const saveJournal = async (text) => {
      try {
        await AsyncStorage.setItem(journalKey, text);
      } catch (error) {
        console.error('Failed to save journal:', error);
      }
    };

    const pickImage = async () => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'You need to allow access to your photos to add images.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const newImages = [...images, result.assets[0].uri];
          setImages(newImages);
          await saveImages(newImages);
          Alert.alert('Success', 'Image added successfully');
        }
      } catch (error) {
        console.error('Error picking image:', error);
        Alert.alert('Error', 'Failed to add image: ' + error.message);
      }
    };

    const pickDocument = async () => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true
        });
        if ((result.type === 'success') || (!result.canceled && result.assets && result.assets.length > 0)) {
          const docInfo = result.type === 'success' ? result : result.assets[0];
          const newDoc = {
            name: docInfo.name,
            uri: docInfo.uri,
            type: docInfo.mimeType || 'application/octet-stream',
            size: docInfo.size,
            dateAdded: new Date().toISOString()
          };
          const newDocs = [...documents, newDoc];
          setDocuments(newDocs);
          await saveDocuments(newDocs);
          Alert.alert('Success', `Document "${docInfo.name}" added successfully`);
        }
      } catch (error) {
        console.error('Error picking document:', error);
        Alert.alert('Error', 'Failed to add document: ' + error.message);
      }
    };

    const deleteImage = async (index) => {
      Alert.alert(
        'Delete Image',
        'Are you sure you want to delete this image?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: async () => {
              try {
                const newImages = [...images];
                newImages.splice(index, 1);
                setImages(newImages);
                await saveImages(newImages);
                Alert.alert('Success', 'Image deleted successfully');
              } catch (error) {
                console.error('Error deleting image:', error);
                Alert.alert('Error', 'Failed to delete image: ' + error.message);
              }
            }
          }
        ]
      );
    };

    const deleteDocument = async (index) => {
      Alert.alert(
        'Delete Document',
        'Are you sure you want to delete this document?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: async () => {
              try {
                const newDocs = [...documents];
                newDocs.splice(index, 1);
                setDocuments(newDocs);
                await saveDocuments(newDocs);
                Alert.alert('Success', 'Document deleted successfully');
              } catch (error) {
                console.error('Error deleting document:', error);
                Alert.alert('Error', 'Failed to delete document: ' + error.message);
              }
            }
          }
        ]
      );
    };

    if (isLoading) {
      return (
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#6C84F5" />
          <Text style={styles.loadingText}>Loading memory data...</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="white" style={styles.backButton} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{memory.location}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.memoryDescription}>{memory.description}</Text>

          <Text style={styles.sectionTitle}>Journal</Text>
          <TextInput
            style={styles.journalInput}
            multiline
            placeholder="Write your thoughts or notes here..."
            value={journalEntry}
            onChangeText={(text) => {
              setJournalEntry(text);
              saveJournal(text);
            }}
          />

          <Text style={styles.sectionTitle}>Trip Photos ({images.length})</Text>
          {images.length > 0 ? (
            <View style={styles.imagesGrid}>
              {images.map((img, index) => (
                <TouchableOpacity key={`img_${index}`} style={styles.imageContainer} onLongPress={() => deleteImage(index)}>
                  <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="trash-outline" size={16} color="white" />
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                <Ionicons name="add-circle" size={40} color="#6C84F5" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={32} color="##6C84F5" />
              <Text style={styles.addPhotoText}>Add Photos</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionTitle}>Saved Documents ({documents.length})</Text>
          <TouchableOpacity style={styles.addDocumentButton} onPress={pickDocument}>
            <Text style={styles.addDocumentText}>+ Add Document</Text>
          </TouchableOpacity>

          {documents.length > 0 ? (
            documents.map((doc, index) => (
              <TouchableOpacity key={`doc_${index}`} style={styles.documentItem} onPress={() => navigation.navigate('DocumentViewer', {
                documentUri: doc.uri,
                documentName: doc.name,
                documentType: doc.type
              })} onLongPress={() => deleteDocument(index)}>
                <Ionicons name="document-outline" size={24} color="#6C84F5" style={styles.documentIcon} />
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName} numberOfLines={1} ellipsizeMode="middle">{doc.name}</Text>
                  <Text style={styles.documentSize}>
                    {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ''}
                    {doc.dateAdded ? ` • Added ${new Date(doc.dateAdded).toLocaleDateString()}` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noDocuments}>No documents added yet</Text>
          )}

          <Text style={styles.helpText}>* Long press on any photo or document to delete it</Text>
        </ScrollView>
      </View>
    );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#888' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C84F5',
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingTop: 50
  },
  backButton: { marginRight: 10 },
  headerSpacer: { width: 28 },
  headerTitle: { fontSize: 18, color: 'white', fontWeight: 'bold' },
  content: { padding: 20, paddingBottom: 40 },
  memoryDescription: { fontSize: 16, color: '#555', marginBottom: 20, fontStyle: 'italic' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  journalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 20
  },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  imageContainer: { width: '30%', aspectRatio: 1, margin: 5, position: 'relative' },
  image: { width: '100%', height: '100%', borderRadius: 8 },
  imageOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4
  },
  addImageButton: {
    width: '30%',
    aspectRatio: 1,
    margin: 5,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addPhotoButton: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 10,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10
  },
  addPhotoText: { marginTop: 10, color: '#6C84F5', fontWeight: '500' },
  addDocumentButton: {
    backgroundColor: '#6C84F5',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10
  },
  addDocumentText: { color: 'white', fontWeight: 'bold' },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginVertical: 5
  },
  documentIcon: { marginRight: 10 },
  documentInfo: { flex: 1 },
  documentName: { fontWeight: '500' },
  documentSize: { fontSize: 12, color: '#888' },
  noDocuments: { color: '#888', textAlign: 'center', paddingVertical: 10 },
  helpText: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 20 }
});

export default MemoryDetailsScreen;
