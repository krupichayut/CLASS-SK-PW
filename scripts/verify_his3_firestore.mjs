import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

const envPath = path.resolve("./classroom-app/.env.local");
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

async function verify() {
  const snap = await getDoc(doc(db, "subjects", "sub_his_13102"));
  if (!snap.exists()) {
    console.error("Document subjects/sub_his_13102 does not exist!");
    process.exit(1);
  }
  const data = snap.data();
  console.log(`✅ Subject Verified: [${data.code}] ${data.name}`);
  console.log(`   Total Units: ${data.units.length}`);
  const t2Units = data.units.filter(u => u.term === 2);
  console.log(`   Term 2 Units: ${t2Units.length}`);
  t2Units.forEach(u => {
    console.log(`   - Unit ${u.unitNumber}: ${u.title} | ${u.hours} hrs | ${u.scoreWeight} pts | ${u.learningTopics.length} topics`);
  });
  process.exit(0);
}

verify().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
