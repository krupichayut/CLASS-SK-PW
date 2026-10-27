import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
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

const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

const snap = await getDoc(doc(db, "subjects", "sub_soc_13101"));
console.log("Firestore doc sub_soc_13101:");
console.log("code:", snap.data()?.code);
console.log("name:", snap.data()?.name);
console.log("units count:", snap.data()?.units?.length);
process.exit(0);
