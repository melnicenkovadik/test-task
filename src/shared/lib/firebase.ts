import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { logError, logWarn } from "./logger";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "") {
  logWarn(
    "Firebase configuration is missing. Please create .env.local file with Firebase credentials.",
  );
  logWarn("See FIREBASE_SETUP.md for instructions.");
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    logWarn("Firebase API key is missing. Authentication will not work.");
  }
} catch (error) {
  logError("Firebase initialization error", error);
  logError(
    "Please check your .env.local file and ensure all Firebase config values are set.",
  );
}

export { auth, db };
