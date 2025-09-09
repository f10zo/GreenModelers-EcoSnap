// src/firebase.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDCPMOz4NlMB_QkQXGEHWkOllTIBYSy1tU",
  authDomain: "ecosnap-c15f6.firebaseapp.com",
  projectId: "ecosnap-c15f6",
  storageBucket: "ecosnap-c15f6.firebasestorage.app",
  messagingSenderId: "191630001716",
  appId: "1:191630001716:web:48e3bf0a6e799728a72c61"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const storage = getStorage(app);
export const db = getFirestore(app);
