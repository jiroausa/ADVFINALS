// firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyAjOjfChR66pnnIyh0J0uGDNjIICl3BUuk",
  authDomain: "adv102-82510.firebaseapp.com",
  projectId: "adv102-82510",
  storageBucket: "adv102-82510.firebasestorage.app",
  messagingSenderId: "491050076341",
  appId: "1:491050076341:web:8a26c647fac63b3dbad6fc",
  measurementId: "G-4RY08YTXPE",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Use browserLocalPersistence on web, default on native
let auth;
if (Platform.OS === "web") {
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
  });
} else {
  auth = getAuth(app);
}
export { auth };

export const storage = getStorage(app);