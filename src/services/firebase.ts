import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAGqrkspIPK0PCpp0lNpKOi6TreASzrAWg",
  authDomain: "cloutscore-fb225.firebaseapp.com",
  projectId: "cloutscore-fb225",
  storageBucket: "cloutscore-fb225.firebasestorage.app",
  messagingSenderId: "791486190583",
  appId: "1:791486190583:web:d3e28380f23caf5683d4f2",
  measurementId: "G-NSGZNJHLWB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore, Auth, and Storage
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };