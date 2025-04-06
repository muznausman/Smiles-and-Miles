import React, { useContext, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert,
  SafeAreaView,
  Modal,
  Linking
} from 'react-native';
import { TripContext } from '../TripContext';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MyTripScreen = ({ navigation }) => {
  const { addActivity } = useContext(TripContext);
  const [activity, setActivity] = useState('');
  const [time, setTime] = useState('');
  const [activeTab, setActiveTab] = useState('activity');
  
  // State for documents
  const [travelDocuments, setTravelDocuments] = useState([]);
  const [hotelBookings, setHotelBookings] = useState([]);
  const [tourTickets, setTourTickets] = useState([]);
  
  // Modal states
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentType, setDocumentType] = useState('travel');
  const [documentUri, setDocumentUri] = useState('');
  const [documentLink, setDocumentLink] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);

  // Load saved documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // Load documents from AsyncStorage
  const loadDocuments = async () => {
    try {
      const savedTravelDocs = await AsyncStorage.getItem('travelDocuments');
      if (savedTravelDocs) setTravelDocuments(JSON.parse(savedTravelDocs));
      
      const savedHotelBookings = await AsyncStorage.getItem('hotelBookings');
      if (savedHotelBookings) setHotelBookings(JSON.parse(savedHotelBookings));
      
      const savedTourTickets = await AsyncStorage.getItem('tourTickets');
      if (savedTourTickets) setTourTickets(JSON.parse(savedTourTickets));
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  // Save documents to AsyncStorage
  const saveDocuments = async (type, documents) => {
    try {
      await AsyncStorage.setItem(type, JSON.stringify(documents));
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
    }
  };

  // Handle adding activity
  const handleAddActivity = () => {
    if (activity && time) {
      addActivity({ id: Date.now().toString(), title: activity, time });
      setActivity('');
      setTime('');
      Alert.alert('Success', 'Activity added successfully!');
    } else {
      Alert.alert('Error', 'Please enter both activity title and time');
    }
  };

  // Pick a document
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      
      if (result.type === 'success' || (!result.canceled && result.assets && result.assets.length > 0)) {
        const docInfo = result.type === 'success' ? result : result.assets[0];
        setDocumentUri(docInfo.uri);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
      return false;
    }
  };

  // Add new document
  const addNewDocument = async () => {
    if (!documentTitle) {
      Alert.alert('Error', 'Please enter a title for your document');
      return;
    }

    // For file documents
    if (!isAddingLink) {
      if (!documentUri) {
        const picked = await pickDocument();
        if (!picked) return;
      }
    } 
    // For link documents
    else if (!documentLink) {
      Alert.alert('Error', 'Please enter a valid link');
      return;
    }

    const newDoc = {
      id: Date.now().toString(),
      title: documentTitle,
      date: new Date().toLocaleDateString(),
      ...(isAddingLink 
        ? { link: documentLink, isLink: true } 
        : { uri: documentUri, isLink: false })
    };

    let updatedDocs = [];
    
    // Add to appropriate list based on type
    if (documentType === 'travel') {
      updatedDocs = [...travelDocuments, newDoc];
      setTravelDocuments(updatedDocs);
      saveDocuments('travelDocuments', updatedDocs);
    } else if (documentType === 'hotel') {
      updatedDocs = [...hotelBookings, newDoc];
      setHotelBookings(updatedDocs);
      saveDocuments('hotelBookings', updatedDocs);
    } else if (documentType === 'tour') {
      updatedDocs = [...tourTickets, newDoc];
      setTourTickets(updatedDocs);
      saveDocuments('tourTickets', updatedDocs);
    }

    // Reset form
    setDocumentTitle('');
    setDocumentUri('');
    setDocumentLink('');
    setShowAddDocumentModal(false);
    setIsAddingLink(false);
    
    Alert.alert('Success', 'Document added successfully!');
  };

  // Open document
  const openDocument = (doc) => {
    if (doc.isLink) {
      // Open URL
      Linking.canOpenURL(doc.link).then(supported => {
        if (supported) {
          Linking.openURL(doc.link);
        } else {
          Alert.alert('Error', `Cannot open URL: ${doc.link}`);
        }
      });
    } else {
      // Open document viewer with correct parameters
      console.log('Opening document in viewer:', doc.uri);
      navigation.navigate('DocumentViewer', {
        documentUri: doc.uri,
        documentName: doc.title,
        documentType: doc.uri.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'
      });
    }
  };

  // Delete document
  const deleteDocument = (type, id) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            let updatedDocs = [];
            
            if (type === 'travel') {
              updatedDocs = travelDocuments.filter(doc => doc.id !== id);
              setTravelDocuments(updatedDocs);
              saveDocuments('travelDocuments', updatedDocs);
            } else if (type === 'hotel') {
              updatedDocs = hotelBookings.filter(doc => doc.id !== id);
              setHotelBookings(updatedDocs);
              saveDocuments('hotelBookings', updatedDocs);
            } else if (type === 'tour') {
              updatedDocs = tourTickets.filter(doc => doc.id !== id);
              setTourTickets(updatedDocs);
              saveDocuments('tourTickets', updatedDocs);
            }
            
            Alert.alert('Success', 'Document deleted successfully!');
          }
        }
      ]
    );
  };

  // Render document item
  const renderDocumentItem = (doc, type) => {
    return (
      <TouchableOpacity 
        key={doc.id} 
        style={styles.documentItem}
        onPress={() => openDocument(doc)}
        onLongPress={() => deleteDocument(type, doc.id)}
      >
        <View style={styles.documentIcon}>
          <Ionicons 
            name={doc.isLink ? "link-outline" : "document-text-outline"} 
            size={24} 
            color="##6C84F5" 
          />
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentTitle}>{doc.title}</Text>
          <Text style={styles.documentDate}>{doc.date}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#888" />
      </TouchableOpacity>
    );
  };

  // Render Add Document Modal
  const renderAddDocumentModal = () => {
    return (
      <Modal
        visible={showAddDocumentModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Document</Text>
              <TouchableOpacity onPress={() => setShowAddDocumentModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              placeholder="Document Title"
              style={styles.modalInput}
              value={documentTitle}
              onChangeText={setDocumentTitle}
            />
            
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[
                  styles.toggleButton, 
                  !isAddingLink && styles.toggleButtonActive
                ]}
                onPress={() => setIsAddingLink(false)}
              >
                <Text style={!isAddingLink ? styles.toggleTextActive : styles.toggleText}>
                  Upload File
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.toggleButton, 
                  isAddingLink && styles.toggleButtonActive
                ]}
                onPress={() => setIsAddingLink(true)}
              >
                <Text style={isAddingLink ? styles.toggleTextActive : styles.toggleText}>
                  Add Link
                </Text>
              </TouchableOpacity>
            </View>
            
            {isAddingLink ? (
              <TextInput
                placeholder="Enter URL (e.g., https://booking.com/reservation)"
                style={styles.modalInput}
                value={documentLink}
                onChangeText={setDocumentLink}
                autoCapitalize="none"
                keyboardType="url"
              />
            ) : (
              <TouchableOpacity 
                style={styles.filePicker}
                onPress={pickDocument}
              >
                <Ionicons name="cloud-upload-outline" size={30} color="#6C84F5" />
                <Text style={styles.filePickerText}>
                  {documentUri ? 'File Selected' : 'Tap to Select File'}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={addNewDocument}
            >
              <Text style={styles.addButtonText}>Add Document</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'activity':
        return (
          <View style={styles.tabContent}>
            <View style={styles.activityContainer}>
              <Text style={styles.title}>Add Activity</Text>
              <TextInput 
                placeholder="Activity Title" 
                style={styles.input} 
                value={activity} 
                onChangeText={setActivity} 
              />
              <TextInput 
                placeholder="Time" 
                style={styles.input} 
                value={time} 
                onChangeText={setTime} 
              />
              <TouchableOpacity style={styles.button} onPress={handleAddActivity}>
                <Text style={styles.buttonText}>Add Activity</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
        
      case 'travel':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.title}>Travel Documents</Text>
            
            {travelDocuments.length > 0 ? (
              travelDocuments.map(doc => renderDocumentItem(doc, 'travel'))
            ) : (
              <Text style={styles.emptyText}>
                No travel documents yet. Add your first document.
              </Text>
            )}
            
            <TouchableOpacity 
              style={styles.addDocumentButton}
              onPress={() => {
                setDocumentType('travel');
                setShowAddDocumentModal(true);
              }}
            >
              <Text style={styles.addDocumentText}>+ Add Document</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 'hotel':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.title}>Hotel Booking</Text>
            
            {hotelBookings.length > 0 ? (
              hotelBookings.map(doc => renderDocumentItem(doc, 'hotel'))
            ) : (
              <Text style={styles.emptyText}>
                No hotel bookings yet. Add your booking.
              </Text>
            )}
            
            <TouchableOpacity 
              style={styles.addDocumentButton}
              onPress={() => {
                setDocumentType('hotel');
                setShowAddDocumentModal(true);
              }}
            >
              <Text style={styles.addDocumentText}>+ Add Booking</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 'tour':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.title}>Bus Tour Tickets + Dinner Reservations</Text>
            
            {tourTickets.length > 0 ? (
              tourTickets.map(doc => renderDocumentItem(doc, 'tour'))
            ) : (
              <Text style={styles.emptyText}>
                No tickets or reservations yet. Add your first one.
              </Text>
            )}
            
            <TouchableOpacity 
              style={styles.addDocumentButton}
              onPress={() => {
                setDocumentType('tour');
                setShowAddDocumentModal(true);
              }}
            >
              <Text style={styles.addDocumentText}>+ Add Ticket/Reservation</Text>
            </TouchableOpacity>
          </View>
        );
        
      case 'activity-suggestions':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.title}>Activity Suggestions</Text>
            <Text style={styles.comingSoonText}>Coming soon!</Text>
          </View>
        );
        
      case 'food-suggestions':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.title}>Food Suggestions</Text>
            <Text style={styles.comingSoonText}>Coming soon!</Text>
          </View>
        );
        
      default:
        return <View />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Trip</Text>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        {/* Category Tabs */}
        <View style={styles.categoriesContainer}>
          <TouchableOpacity 
            style={styles.categoryButton}
            onPress={() => setActiveTab('travel')}
          >
            <Text style={styles.categoryText}>Travel Documents</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.categoryButton}
            onPress={() => setActiveTab('hotel')}
          >
            <Text style={styles.categoryText}>Hotel Booking</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.categoryButton}
            onPress={() => setActiveTab('tour')}
          >
            <Text style={styles.categoryText}>Bus Tour Tickets{'\n'}+ Dinner Reservations</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.categoryButton}
            onPress={() => setActiveTab('activity-suggestions')}
          >
            <Text style={styles.categoryText}>Activity Suggestions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.categoryButton}
            onPress={() => setActiveTab('food-suggestions')}
          >
            <Text style={styles.categoryText}>Food Suggestions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.categoryButton}
            onPress={() => setActiveTab('activity')}
          >
            <Text style={styles.categoryText}>Add Activity</Text>
          </TouchableOpacity>
        </View>
        
        {/* Tab Content */}
        {renderContent()}
      </ScrollView>
      
      {/* Help text */}
      <View style={styles.helpTextContainer}>
        <Text style={styles.helpText}>Long press on a document to delete it</Text>
      </View>
      
      {/* Add Document Modal */}
      {renderAddDocumentModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#6C84F5',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  categoriesContainer: {
    padding: 15,
  },
  categoryButton: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabContent: {
    padding: 20,
    backgroundColor: '#FFF',
    margin: 15,
    marginTop: 0,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#6C84F5',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
  activityContainer: {
    marginBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 20,
  },
  addDocumentButton: {
    backgroundColor: '#6C84F5',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  addDocumentText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
  },
  documentIcon: {
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  documentDate: {
    fontSize: 12,
    color: '#888',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  filePicker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 5,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  filePickerText: {
    marginTop: 10,
    color: '#4A90E2',
  },
  addButton: {
    backgroundColor: '#6C84F5',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  toggleButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  toggleButtonActive: {
    backgroundColor: '#6C84F5',
  },
  toggleText: {
    color: '#555',
  },
  toggleTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  comingSoonText: {
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
    marginTop: 20,
  },
  helpTextContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    alignSelf: 'center',
    marginBottom: 10,
  },
  helpText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default MyTripScreen;
