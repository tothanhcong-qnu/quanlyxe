// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCL3yftef2bXl0UTRzIuUkSEitvInxjndo",
  authDomain: "quanlyxetaplai.firebaseapp.com",
  projectId: "quanlyxetaplai",
  storageBucket: "quanlyxetaplai.firebasestorage.app",
  messagingSenderId: "182358206167",
  appId: "1:182358206167:web:33a621287be35255af7292",
  measurementId: "G-QMNSXW5GQJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
