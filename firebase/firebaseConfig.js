// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBdAGXws2_j4UdlMYq0MWsXw-QQ5pAmWmM",
  authDomain: "smiles-and-miles.firebaseapp.com",
  projectId: "smiles-and-miles",
  storageBucket: "smiles-and-miles.appspot.com", // ⚠️ You had 'firebasestorage.app' — this should be 'appspot.com'
  messagingSenderId: "1023384083781",
  appId: "1:1023384083781:web:3dee99603d6af5fbc9b22c",
  measurementId: "G-3S85RVK9DN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // ✅ Ensure this is exported

export { auth, db };

