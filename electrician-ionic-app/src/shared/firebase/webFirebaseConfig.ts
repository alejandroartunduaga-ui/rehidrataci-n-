import { getAuth } from 'firebase/auth';
import { getRemoteConfig } from 'firebase/remote-config';
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABSE_URL,
};

// Inicializa la app de Firebase
export const firebase = initializeApp(firebaseConfig);

// Inicializar Firebase Authentication
export const authFirebase = getAuth(firebase);

// Inicializar Firebase Remote Config
export const remoteConfig = getRemoteConfig(firebase);

// Inicializar Firebase Notifications
export const messagingFirebase = getMessaging(firebase);
