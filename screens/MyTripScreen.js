//working 
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
  Linking,
  Platform,
  Dimensions
} from 'react-native';
import { TripContext } from '../TripContext';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { 
  saveUserData, 
  loadUserData, 
  isUserLoggedIn,
  getUserDisplayName 
} from '../utils/storage';
import { auth, db } from '../firebase/firebaseConfig';
import { fetchPOIsFromMapbox } from '../utils/mapboxService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getCurrentLocation } from '../utils/GetCurrentLocation';

const { height } = Dimensions.get('window');

// Base keys for user-specific storage
const TRAVEL_DOCS_KEY = '@travelDocuments';
const HOTEL_DOCS_KEY = '@hotelBookings';
const TOUR_DOCS_KEY = '@tourTickets';
const ACTIVITIES_KEY = '@tripActivities';

const MyTripScreen = ({ navigation }) => {
  const { addActivity, activities, userId } = useContext(TripContext);
  const [activity, setActivity] = useState('');
  const [time, setTime] = useState('');
  const [activeTab, setActiveTab] = useState('activity');
  
  // State for documents
  const [travelDocuments, setTravelDocuments] = useState([]);
  const [hotelBookings, setHotelBookings] = useState([]);
  const [tourTickets, setTourTickets] = useState([]);
  
  // User info
  const [userName, setUserName] = useState('');
  
  // Modal states
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentType, setDocumentType] = useState('travel');
  const [documentUri, setDocumentUri] = useState('');
  const [documentLink, setDocumentLink] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  
  // Activity suggestions states
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Food suggestions states
  const [foodSuggestions, setFoodSuggestions] = useState([]);
  const [loadingFood, setLoadingFood] = useState(false);
  const [foodError, setFoodError] = useState(null);
  
  // Time entry modal
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [tempTime, setTempTime] = useState('');
  const [tempActivity, setTempActivity] = useState(null);
  
  // Time picker states
  const [date, setDate] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showModalTimePicker, setShowModalTimePicker] = useState(false);

  // Load documents on mount
  useEffect(() => {
    const loadInitialData = async () => {
      // Check if user is logged in
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in');
        return;
      }

      // Set user name
      setUserName(getUserDisplayName());

      try {
        // Load travel documents
        const savedTravelDocs = await loadUserData(TRAVEL_DOCS_KEY);
        if (savedTravelDocs) setTravelDocuments(savedTravelDocs);
        
        // Load hotel bookings
        const savedHotelBookings = await loadUserData(HOTEL_DOCS_KEY);
        if (savedHotelBookings) setHotelBookings(savedHotelBookings);
        
        // Load tour tickets
        const savedTourTickets = await loadUserData(TOUR_DOCS_KEY);
        if (savedTourTickets) setTourTickets(savedTourTickets);
      } catch (error) {
        console.error('Error loading documents:', error);
      }
    };

    loadInitialData();
  }, []);

  // Save documents with user-specific storage
  const saveDocuments = async (type, documents) => {
    try {
      let key;
      switch(type) {
        case 'travel':
          key = TRAVEL_DOCS_KEY;
          break;
        case 'hotel':
          key = HOTEL_DOCS_KEY;
          break;
        case 'tour':
          key = TOUR_DOCS_KEY;
          break;
        default:
          throw new Error('Invalid document type');
      }
      
      await saveUserData(key, documents);
    } catch (error) {
      console.error(`Error saving ${type} documents:`, error);
      Alert.alert('Error', `Failed to save ${type} documents`);
    }
  };

  // Copy document to app's directory for persistence
  const copyDocumentToAppDirectory = async (uri) => {
    try {
      const fileName = `document_${Date.now()}.${uri.split('.').pop()}`;
      const destinationUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri
      });
      
      return destinationUri;
    } catch (error) {
      console.error('Error copying document:', error);
      throw error;
    }
  };

  // Add new document
  const addNewDocument = async () => {
    // Validate inputs
    if (!documentTitle) {
      Alert.alert('Error', 'Please enter a document title');
      return;
    }

    try {
      // For file documents
      let finalUri = null;
      if (!isAddingLink) {
        if (!documentUri) {
          Alert.alert('Error', 'Please select a document');
          return;
        }
        finalUri = await copyDocumentToAppDirectory(documentUri);
      }

      // Prepare document object
      const newDoc = {
        id: Date.now().toString(),
        title: documentTitle,
        date: new Date().toLocaleDateString(),
        ...(isAddingLink 
          ? { link: documentLink, isLink: true } 
          : { uri: finalUri, isLink: false })
      };

      // Update documents based on type
      let updatedDocs = [];
      switch(documentType) {
        case 'travel':
          updatedDocs = [...travelDocuments, newDoc];
          setTravelDocuments(updatedDocs);
          await saveDocuments('travel', updatedDocs);
          break;
        case 'hotel':
          updatedDocs = [...hotelBookings, newDoc];
          setHotelBookings(updatedDocs);
          await saveDocuments('hotel', updatedDocs);
          break;
        case 'tour':
          updatedDocs = [...tourTickets, newDoc];
          setTourTickets(updatedDocs);
          await saveDocuments('tour', updatedDocs);
          break;
      }

      // Reset form
      setDocumentTitle('');
      setDocumentUri('');
      setDocumentLink('');
      setShowAddDocumentModal(false);
      setIsAddingLink(false);
      
      Alert.alert('Success', 'Document added successfully');
    } catch (error) {
      console.error('Error adding document:', error);
      Alert.alert('Error', 'Failed to add document');
    }
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
      // Open document viewer
      navigation.navigate('DocumentViewer', {
        documentUri: doc.uri,
        documentName: doc.title,
        documentType: doc.uri.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'
      });
    }
  };

  // Delete document
  const deleteDocument = async (type, id) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              let updatedDocs = [];
              
              switch(type) {
                case 'travel':
                  updatedDocs = travelDocuments.filter(doc => doc.id !== id);
                  setTravelDocuments(updatedDocs);
                  await saveDocuments('travel', updatedDocs);
                  break;
                case 'hotel':
                  updatedDocs = hotelBookings.filter(doc => doc.id !== id);
                  setHotelBookings(updatedDocs);
                  await saveDocuments('hotel', updatedDocs);
                  break;
                case 'tour':
                  updatedDocs = tourTickets.filter(doc => doc.id !== id);
                  setTourTickets(updatedDocs);
                  await saveDocuments('tour', updatedDocs);
                  break;
              }
              
              Alert.alert('Success', 'Document deleted successfully');
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document');
            }
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
            color="#6C84F5" 
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

  // Add Document Modal
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
              <TouchableOpacity onPress={() => {
                setShowAddDocumentModal(false);
                setDocumentTitle('');
                setDocumentUri('');
                setDocumentLink('');
                setIsAddingLink(false);
              }}>
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
            
            {!isAddingLink ? (
  <TouchableOpacity 
    style={styles.filePicker}
    onPress={async () => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true
        });
        
        console.log('Document picker result:', result); // Add this line for debugging
        
        if (result.type === 'success' || (!result.canceled && result.assets && result.assets.length > 0)) {
          // Handle both DocumentPicker and ImagePicker results
          const uri = result.type === 'success' ? result.uri : result.assets[0].uri;
          const name = result.type === 'success' ? result.name : result.assets[0].fileName;
          
          // Set the document URI
          setDocumentUri(uri);
          
          // If no title is set, use the filename
          if (!documentTitle) {
            setDocumentTitle(name || 'Uploaded Document');
          }
        }
      } catch (error) {
        console.error('Document selection error:', error);
        Alert.alert('Error', 'Failed to select document: ' + error.message);
      }
    }}
  >
    <Ionicons name="cloud-upload-outline" size={30} color="#6C84F5" />
    <Text style={styles.filePickerText}>
      {documentUri ? 'File Selected' : 'Tap to Select File'}
    </Text>
  </TouchableOpacity>
)
: (
  <TextInput
    placeholder="Enter URL (e.g., https://booking.com/reservation)"
    style={styles.modalInput}
    value={documentLink}
    onChangeText={setDocumentLink}
    autoCapitalize="none"
    keyboardType="url"
  />
)}
            
            <TouchableOpacity 
              style={[
                styles.addButton,
                // Disable button if no title or no document/link
                (!documentTitle || (!isAddingLink && !documentUri) || 
                 (isAddingLink && !documentLink)) && styles.disabledButton
              ]}
              disabled={
                !documentTitle || 
                (!isAddingLink && !documentUri) || 
                (isAddingLink && !documentLink)
              }
              onPress={addNewDocument}
            >
              <Text style={styles.addButtonText}>Add Document</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render Time Entry Modal
  const renderTimeEntryModal = () => {
    return (
      <Modal
        visible={showTimeModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => setShowTimeModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
                When would you like to visit {tempActivity?.text}?
              </Text>
              
              <TouchableOpacity 
                style={styles.timePickerButton}
                onPress={() => setShowModalTimePicker(true)}
              >
                <Text style={tempTime ? styles.timeText : styles.timePlaceholder}>
                  {tempTime || "Tap to select time"}
                </Text>
                <Ionicons name="time-outline" size={24} color="#6C84F5" />
              </TouchableOpacity>
              
              {showModalTimePicker && (
                <DateTimePicker
                  value={date}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowModalTimePicker(false);
                    if (selectedDate) {
                      setDate(selectedDate);
                      const hours = selectedDate.getHours();
                      const minutes = selectedDate.getMinutes();
                      const ampm = hours >= 12 ? 'PM' : 'AM';
                      const formattedHours = hours % 12 || 12;
                      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
                      setTempTime(`${formattedHours}:${formattedMinutes} ${ampm}`);
                    }
                  }}
                />
              )}
              
              <TouchableOpacity 
                style={[
                  styles.addButton,
                  !tempTime && styles.disabledButton
                ]}
                disabled={!tempTime}
                onPress={() => {
                  if (tempActivity && tempTime) {
                    // Ensure the current user is logged in
                    const currentUser = auth.currentUser;
                    if (!currentUser) {
                      Alert.alert('Error', 'You must be logged in to add activities');
                      return;
                    }
                    
                    // Add the activity with the current user's ID
                    addActivity({ 
                      id: Date.now().toString(), 
                      title: tempActivity.text, 
                      time: tempTime,
                      userId: currentUser.uid // Add this line to associate with current user
                    });
                    
                    setShowTimeModal(false);
                    setTempActivity(null);
                    setTempTime('');
                    Alert.alert('Success', 'Activity added successfully');
                  }
                }}
              >
                <Text style={styles.addButtonText}>Add to Activities</Text>
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
              
              <TouchableOpacity 
                style={styles.timeInput}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={time ? styles.timeText : styles.timePlaceholder}>
                  {time || "Select Time"}
                </Text>
                <Ionicons name="time-outline" size={24} color="#6C84F5" />
              </TouchableOpacity>
              
              {showTimePicker && (
                <DateTimePicker
                  value={date}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowTimePicker(false);
                    if (selectedDate) {
                      setDate(selectedDate);
                      const hours = selectedDate.getHours();
                      const minutes = selectedDate.getMinutes();
                      const ampm = hours >= 12 ? 'PM' : 'AM';
                      const formattedHours = hours % 12 || 12;
                      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
                      setTime(`${formattedHours}:${formattedMinutes} ${ampm}`);
                    }
                  }}
                />
              )}
              
              <TouchableOpacity 
                style={[
                  styles.button,
                  !(activity && time) && styles.disabledButton
                ]} 
                disabled={!(activity && time)}
                onPress={() => {
                  // Ensure the current user is logged in
                  const currentUser = auth.currentUser;
                  if (!currentUser) {
                    Alert.alert('Error', 'You must be logged in to add activities');
                    return;
                  }
                  
                  addActivity({ 
                    id: Date.now().toString(), 
                    title: activity, 
                    time,
                    userId: currentUser.uid // Add this line to associate with current user
                  });
                  setActivity('');
                  setTime('');
                  Alert.alert('Success', 'Activity added successfully');
                }}
              >
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
          <View style={styles.tabContentWithScrollable}>
            <Text style={styles.title}>Activity Suggestions</Text>
            <Text style={styles.subtitle}>Find fun things to do nearby</Text>
            
            <TouchableOpacity style={styles.button} onPress={async () => {
              setLoading(true);
              setError(null);
              try {
                const coords = await getCurrentLocation();
                const activityTypes = ['park', 'museum', 'landmark', 'theater', 'mall', 'entertainment'];
                const promiseArray = activityTypes.map(type => 
                  fetchPOIsFromMapbox(coords.latitude, coords.longitude, type)
                );
                
                const resultsArray = await Promise.all(promiseArray);
                
                const uniquePlaces = new Map();
                resultsArray.flat().forEach(item => {
                  if (item && item.place_name && !uniquePlaces.has(item.place_name)) {
                    uniquePlaces.set(item.place_name, item);
                  }
                });
                
                const combinedResults = Array.from(uniquePlaces.values()).slice(0, 15);
                setSuggestions(combinedResults);
              } catch (err) {
                setError(err.message);
                setSuggestions([]);
              } finally {
                setLoading(false);
              }
            }}>
              <Text style={styles.buttonText}>Get Activity Suggestions</Text>
            </TouchableOpacity>
            
            {loading && <Text style={styles.loadingText}>Loading suggestions...</Text>}
            {error && <Text style={styles.error}>{error}</Text>}
            
            {!loading && !error && suggestions.length === 0 && (
              <Text style={styles.emptyText}>
                No suggestions available yet. Press the button to get suggestions.
              </Text>
            )}
            
            {!loading && !error && suggestions.length > 0 && (
              <View style={styles.suggestionsWrapper}>
                <Text style={styles.tipText}>Tip: Tap the "+" icon to add as an activity</Text>
                <ScrollView 
                  style={styles.suggestionsInnerScroll}
                  nestedScrollEnabled={true}
                  contentContainerStyle={styles.suggestionsContentContainer}
                >
                  {suggestions.map(item => (
                    <View key={item.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.place}>{item.text}</Text>
                        <TouchableOpacity 
                          style={styles.addToActivityButton}
                          onPress={() => {
                            setTempActivity(item);
                            setShowTimeModal(true);
                          }}
                        >
                          <Ionicons name="add-circle-outline" size={24} color="#6C84F5" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.details}>{item.place_name}</Text>
                      <TouchableOpacity 
                        style={styles.directionsButton}
                        onPress={() => {
                          const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.place_name)}`;
                          Linking.openURL(url);
                        }}
                      >
                        <Text style={styles.directionsText}>Get Directions</Text>
                        <Ionicons name="navigate-outline" size={16} color="#6C84F5" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        );
        
      case 'food-suggestions':
        return (
          <View style={styles.tabContentWithScrollable}>
            <Text style={styles.title}>Food Suggestions</Text>
            <Text style={styles.subtitle}>Discover restaurants and cafes nearby</Text>
            
            <TouchableOpacity style={styles.button} onPress={async () => {
              setLoadingFood(true);
              setFoodError(null);
              try{
                const coords = await getCurrentLocation();
                const foodTypes = ['restaurant', 'cafe', 'bakery', 'bar', 'food'];
                const promiseArray = foodTypes.map(type => 
                  fetchPOIsFromMapbox(coords.latitude, coords.longitude, type)
                );
                
                const resultsArray = await Promise.all(promiseArray);
                
                const uniquePlaces = new Map();
                resultsArray.flat().forEach(item => {
                  if (item && item.place_name && !uniquePlaces.has(item.place_name)) {
                    uniquePlaces.set(item.place_name, item);
                  }
                });
                
                const combinedResults = Array.from(uniquePlaces.values()).slice(0, 15);
                setFoodSuggestions(combinedResults);
              } catch (err) {
                setFoodError(err.message);
                setFoodSuggestions([]);
              } finally {
                setLoadingFood(false);
              }
            }}>
              <Text style={styles.buttonText}>Get Food Suggestions</Text>
            </TouchableOpacity>
            
            {loadingFood && <Text style={styles.loadingText}>Loading food suggestions...</Text>}
            {foodError && <Text style={styles.error}>{foodError}</Text>}
            
            {!loadingFood && !foodError && foodSuggestions.length === 0 && (
              <Text style={styles.emptyText}>
                No food suggestions available yet. Press the button to get restaurants nearby.
              </Text>
            )}
            
            {!loadingFood && !foodError && foodSuggestions.length > 0 && (
              <View style={styles.suggestionsWrapper}>
                <ScrollView 
                  style={styles.suggestionsInnerScroll}
                  nestedScrollEnabled={true}
                  contentContainerStyle={styles.suggestionsContentContainer}
                >
                  {foodSuggestions.map(item => (
                    <View key={item.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.place}>{item.text}</Text>
                      </View>
                      <Text style={styles.details}>{item.place_name}</Text>
                      <TouchableOpacity 
                        style={styles.directionsButton}
                        onPress={() => {
                          const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.place_name)}`;
                          Linking.openURL(url);
                        }}
                      >
                        <Text style={styles.directionsText}>Get Directions</Text>
                        <Ionicons name="navigate-outline" size={16} color="#6C84F5" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
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
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
      >
        {/* Category Tabs */}
        <View style={styles.categoriesContainer}>
          <TouchableOpacity 
            style={[
              styles.categoryButton, 
              activeTab === 'travel' && styles.categoryButtonActive
            ]}
            onPress={() => setActiveTab('travel')}
          >
            <Text style={styles.categoryText}>Travel Documents</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.categoryButton, 
              activeTab === 'hotel' && styles.categoryButtonActive
            ]}
            onPress={() => setActiveTab('hotel')}
          >
            <Text style={styles.categoryText}>Hotel Booking</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.categoryButton, 
              activeTab === 'tour' && styles.categoryButtonActive
            ]}
            onPress={() => setActiveTab('tour')}
          >
            <Text style={styles.categoryText}>Bus Tour Tickets{'\n'}+ Dinner Reservations</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.categoryButton, 
              activeTab === 'activity-suggestions' && styles.categoryButtonActive
            ]}
            onPress={() => setActiveTab('activity-suggestions')}
          >
            <Text style={styles.categoryText}>Activity Suggestions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.categoryButton, 
              activeTab === 'food-suggestions' && styles.categoryButtonActive
            ]}
            onPress={() => setActiveTab('food-suggestions')}
          >
            <Text style={styles.categoryText}>Food Suggestions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.categoryButton, 
              activeTab === 'activity' && styles.categoryButtonActive
            ]}
            onPress={() => setActiveTab('activity')}
          >
            <Text style={styles.categoryText}>Add Activity</Text>
          </TouchableOpacity>
        </View>
        
        {/* Tab Content */}
        {renderContent()}
        
        {/* Debug marker */}
        <View style={styles.debugMarker}>
          <Text>You've scrolled to the bottom!</Text>
        </View>
      </ScrollView>
      
      {/* Help text */}
      <View style={styles.helpTextContainer}>
        <Text style={styles.helpText}>Long press on a document to delete it</Text>
      </View>
      
      {/* Add Document Modal */}
      {renderAddDocumentModal()}
      
      {/* Time Entry Modal */}
      {renderTimeEntryModal()}
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
  scrollContentContainer: {
    paddingBottom: 50,
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
  categoryButtonActive: {
    backgroundColor: '#E6EBFF',
    borderColor: '#6C84F5',
    borderWidth: 1,
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
  tabContentWithScrollable: {
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
    height: height * 0.6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    height: 44,
  },
  timeText: {
    color: '#000',
    fontSize: 16,
  },
  timePlaceholder: {
    color: '#999',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#6C84F5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
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
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
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
  suggestionsWrapper: {
    marginTop: 10,
    flex: 1,
  },
  suggestionsInnerScroll: {
    flex: 1,
  },
  suggestionsContentContainer: {
    paddingBottom: 20,
  },
  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: 'white',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  place: {
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
  },
  details: {
    color: '#666',
    marginTop: 4,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  loadingText: {
    textAlign: 'center',
    marginVertical: 10,
  },
  addToActivityButton: {
    padding: 5,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  directionsText: {
    color: '#6C84F5',
    marginRight: 5,
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 20,
  },
  debugMarker: {
    padding: 10,
    backgroundColor: '#ffff99',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 5,
    alignItems: 'center',
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
  addDocumentButton: {
    backgroundColor: '#E6EBFF',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  addDocumentText: {
    color: '#6C84F5',
    fontWeight: '500',
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    height: 44,
  },
  tipText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  activityContainer: {
    marginBottom: 10,
  },
});

export default MyTripScreen;