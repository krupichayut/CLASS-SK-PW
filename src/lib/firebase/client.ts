import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  memoryLocalCache,
  connectFirestoreEmulator,
  setLogLevel
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "dummy-messaging-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "dummy-app-id",
};

// In development/browser, intercept Firestore's harmless offline-mode warning so it doesn't trigger Next.js dev overlay modal
if (typeof window !== "undefined") {
  try {
    setLogLevel("error");
  } catch {
    // Ignore if already set
  }
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const msg = typeof args[0] === "string" ? args[0] : "";
    if (
      msg.includes("Could not reach Cloud Firestore backend") ||
      msg.includes("operate in offline mode") ||
      msg.includes("BloomFilter")
    ) {
      console.warn("[Firestore Network/Offline Mode]", ...args);
      return;
    }
    originalError.apply(console, args);
  };
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Initialize Firestore with Force Long Polling and robust multi-tab persistent cache
// This prevents 10s WebChannel stream timeouts on restricted firewalls / proxy / school networks
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    localCache: typeof window !== "undefined"
      ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      : memoryLocalCache(),
  });
} catch {
  dbInstance = getFirestore(app);
}

export const db = dbInstance;

// Use emulators only if explicitly enabled
if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
  if (!(auth as any)._emulator) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }
  if (!(db as any)._settings?.host?.includes("localhost")) {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }
}
