import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const DocumentViewerScreen = ({ route }) => {
  const { documentUri, documentName } = route.params;
  const navigation = useNavigation();
  const [documentPath, setDocumentPath] = useState(null);

  useEffect(() => {
    const prepareDocument = async () => {
      try {
        // For web files, use direct URI
        if (documentUri.startsWith('http')) {
          setDocumentPath(documentUri);
          return;
        }

        // For local files, copy to cache directory
        const filename = documentUri.split('/').pop();
        const destPath = `${FileSystem.cacheDirectory}${filename}`;

        // Check if file already exists in cache
        const fileInfo = await FileSystem.getInfoAsync(destPath);
        if (!fileInfo.exists) {
          // Copy file to cache if not exists
          await FileSystem.copyAsync({
            from: documentUri,
            to: destPath
          });
        }

        setDocumentPath(destPath);
      } catch (err) {
        console.error('Error preparing document:', err);
        Alert.alert('Error', 'Could not prepare the document for viewing.');
      }
    };

    prepareDocument();
  }, [documentUri]);

  const shareDocument = async () => {
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare && documentPath) {
        await Sharing.shareAsync(documentPath);
      } else {
        Alert.alert('Not Supported', 'Sharing is not available on this device.');
      }
    } catch (err) {
      console.error('Sharing error:', err);
      Alert.alert('Error', 'Could not share the document.');
    }
  };

  const openExternally = async () => {
    try {
      if (Platform.OS === 'android') {
        // For Android, use Intent Launcher
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: documentPath,
          type: 'application/pdf',
          flags: 1, // FLAG_ACTIVITY_NEW_TASK
        });
      } else if (Platform.OS === 'ios') {
        // For iOS, use Sharing
        await Sharing.shareAsync(documentPath);
      }
    } catch (err) {
      console.error('Open externally error:', err);
      Alert.alert('Error', 'Could not open the document.');
    }
  };

  if (!documentPath) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{documentName || 'Document'}</Text>
        </View>
        <Text style={styles.message}>Loading document...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{documentName || 'Document'}</Text>
        <TouchableOpacity onPress={shareDocument} style={styles.headerActionButton}>
          <Ionicons name="share-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      {documentPath.toLowerCase().endsWith('.pdf') ? (
        <WebView
          source={{ uri: Platform.OS === 'ios' 
            ? `file://${documentPath}` 
            : `file:///${documentPath}` }}
          style={styles.webview}
          originWhitelist={['*']}
        />
      ) : (
        <Text style={styles.message}>Unsupported file type</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 15,
    paddingBottom: 10,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerActionButton: {
    marginLeft: 10,
  },
  message: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
    color: '#888',
  },
  webview: {
    flex: 1,
  },
});

export default DocumentViewerScreen;