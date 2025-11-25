// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD7KAczlKKl_e1QQxqhxpNXWeXegIyQEiE",
  authDomain: "infobank-b4b9f.firebaseapp.com",
  projectId: "infobank-b4b9f",
  storageBucket: "infobank-b4b9f.firebasestorage.app",
  messagingSenderId: "653449714663",
  appId: "1:653449714663:web:a0076a4f2865528f55bb42",
  measurementId: "G-FP6VP0NZGX"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 👉 Inicializamos y exportamos Auth y Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
