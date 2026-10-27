import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDocs, collection, query, where, deleteDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

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

async function checkP6() {
  const snap = await getDocs(query(collection(db, "students"), where("room", "==", "ป.6")));
  console.log("Current P.6 docs count:", snap.docs.length);
  snap.docs.forEach(d => console.log(d.id, d.data().studentCode, d.data().name));
  process.exit(0);
}

checkP6().catch(err => {
  console.error(err);
  process.exit(1);
});
