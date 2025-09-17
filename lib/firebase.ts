// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';


const firebaseConfig = {
  apiKey: "AIzaSyBKiaT_NV3HniLVYQ0bFHmLjwGOX1ibJ98",
  authDomain: "ai-support-dashboard-a2f99.firebaseapp.com",
  projectId: "ai-support-dashboard-a2f99",
  storageBucket: "ai-support-dashboard-a2f99.firebasestorage.app",
  messagingSenderId: "249819961603",
  appId: "1:249819961603:web:71e76fe9c96647faa4f136"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);