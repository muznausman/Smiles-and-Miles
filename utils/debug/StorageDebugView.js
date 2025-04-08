// utils/debug/StorageDebugTrigger.js
import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import StorageDebugView from './StorageDebugView';

const StorageDebugTrigger = () => {
  const [taps, setTaps] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [debugVisible, setDebugVisible] = useState(false);

  const handleTap = () => {
    const now = Date.now();
    
    // Reset counter if last tap was more than 1.5 seconds ago
    if (now - lastTapTime > 1500) {
      setTaps(1);
    } else {
      setTaps(prev => prev + 1);
    }
    
    setLastTapTime(now);
    
    // Show debug view after 3 quick taps
    if (taps === 2) {
      setDebugVisible(true);
      setTaps(0);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={handleTap}
        activeOpacity={1}
      />
      
      <StorageDebugView 
        visible={debugVisible} 
        onClose={() => setDebugVisible(false)} 
      />
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    position: 'absolute',
    top: 100,         // Moved down to be below the welcome header
    right: 20,
    width: 80,        // Made wider
    height: 80,       // Made taller
    zIndex: 9999,
    backgroundColor: 'rgba(255,0,0,0.5)', // Made more visible
  },
});

export default StorageDebugTrigger;