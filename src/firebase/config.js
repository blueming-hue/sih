import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCYeD_Wfjw-wKEk4nCcPjwRrHY4jEsjYus",
  authDomain: "mindly-default.firebaseapp.com",
  projectId: "mindly-default",
  storageBucket: "mindly-default.firebasestorage.app",
  messagingSenderId: "592151748743",
  appId: "1:592151748743:web:f6193734d7b22b3a3a5822"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
