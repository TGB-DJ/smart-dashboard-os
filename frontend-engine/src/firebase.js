import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-fake-api-key", // The user should provide a real API key or I can look for it
  authDomain: "i-matrix-496521-a1.firebaseapp.com",
  projectId: "i-matrix-496521-a1",
  storageBucket: "i-matrix-496521-a1.appspot.com",
  messagingSenderId: "110930829234",
  appId: "1:110930829234:web:fake-app-id"
};

// Note: In a production app, these should be environment variables.
// For now, we will use the project ID from the credentials.

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
