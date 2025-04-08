// firebase/firebaseConfig.js

// Import the functions you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration (from your Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyBdAGXws2_j4UdlMYq0MWsXw-QQ5pAmWmM",
  authDomain: "smiles-and-miles.firebaseapp.com",
  projectId: "smiles-and-miles",
  storageBucket: "smiles-and-miles.appspot.com",
  messagingSenderId: "1023384083781",
  appId: "1:1023384083781:web:3dee99603d6af5fbc9b22c",
  measurementId: "G-3S85RVK9DN"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore, Auth, and Storage
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Export for use in other files
export { db, auth, storage };