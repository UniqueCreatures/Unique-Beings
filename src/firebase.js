import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// 1. Add 'export' before 'const firebaseConfig'
export const firebaseConfig = {
  apiKey: "AIzaSyA-Rg7H2fV1XACurDoXCMm2kAkBRShus6o",
  authDomain: "unique-beings-15a5b.firebaseapp.com",
  projectId: "unique-beings-15a5b",
  storageBucket: "unique-beings-15a5b.firebasestorage.app",
  messagingSenderId: "954432871196",
  appId: "1:954432871196:web:d3d0796dd34b70f434b8d9",
  measurementId: "G-XPSY1JPJ8L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };