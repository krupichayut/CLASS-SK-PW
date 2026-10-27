import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

// 1. Read .env.local
const envPath = path.resolve(".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const k = trimmed.substring(0, idx).trim();
      const v = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, "");
      env[k] = v;
    }
  }
});

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Read curriculum_master.json
const dataPath = path.resolve("src/lib/data/curriculum_master.json");
const rawData = fs.readFileSync(dataPath, "utf-8");
const subjects = JSON.parse(rawData);

async function syncAll() {
  console.log(`Starting Firestore sync for ${subjects.length} subjects...`);
  
  for (const sub of subjects) {
    const docRef = doc(db, "subjects", sub.id);
    await setDoc(docRef, {
      ...sub,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`✅ Synced [${sub.code}] ${sub.name} (${sub.units.length} units)`);
  }
  
  console.log("\nAll 8 subjects successfully synced to Firestore!");
  process.exit(0);
}

syncAll().catch(err => {
  console.error("Sync failed:", err);
  process.exit(1);
});
