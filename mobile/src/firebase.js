import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBdg_pBzw__p_j7ihVw9Uzb4Rrfe163HGs",
  authDomain: "beetsma-crm-companion.firebaseapp.com",
  projectId: "beetsma-crm-companion",
  storageBucket: "beetsma-crm-companion.firebasestorage.app",
  messagingSenderId: "848205142114",
  appId: "1:848205142114:android:1c2e33cc6e1a714a19993b"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { app, db };
