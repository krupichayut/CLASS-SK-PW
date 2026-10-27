import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import fs from "fs";
import path from "path";

// Read .env.local
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

const p3Students = [
  {
    id: "3101",
    studentCode: "3101",
    number: 1,
    prefix: "ด.ช.",
    firstName: "สายชล",
    lastName: "จันทร์เขียว",
    name: "ด.ช. สายชล จันทร์เขียว",
    room: "ป.3",
    classroomId: "ป.3",
    status: "active",
  },
  {
    id: "3102",
    studentCode: "3102",
    number: 2,
    prefix: "ด.ช.",
    firstName: "ทู่",
    lastName: "พม่า",
    name: "ด.ช. ทู่ พม่า",
    room: "ป.3",
    classroomId: "ป.3",
    status: "active",
  },
  {
    id: "3103",
    studentCode: "3103",
    number: 3,
    prefix: "ด.ช.",
    firstName: "ติณณสิรภพ",
    lastName: "ชูศิริ",
    name: "ด.ช. ติณณสิรภพ ชูศิริ",
    room: "ป.3",
    classroomId: "ป.3",
    status: "active",
  },
  {
    id: "3104",
    studentCode: "3104",
    number: 4,
    prefix: "ด.ญ.",
    firstName: "กณิศา",
    lastName: "เย็นนพคุณ",
    name: "ด.ญ. กณิศา เย็นนพคุณ",
    room: "ป.3",
    classroomId: "ป.3",
    status: "active",
  },
  {
    id: "3105",
    studentCode: "3105",
    number: 5,
    prefix: "ด.ญ.",
    firstName: "พิชญาภัค",
    lastName: "สีแดงยิ่ง",
    name: "ด.ญ. พิชญาภัค สีแดงยิ่ง",
    room: "ป.3",
    classroomId: "ป.3",
    status: "active",
  },
  {
    id: "3106",
    studentCode: "3106",
    number: 6,
    prefix: "ด.ญ.",
    firstName: "กานดา",
    lastName: "พม่า",
    name: "ด.ญ. กานดา พม่า",
    room: "ป.3",
    classroomId: "ป.3",
    status: "active",
  },
  {
    id: "3107",
    studentCode: "3107",
    number: 7,
    prefix: "ด.ญ.",
    firstName: "อิโม",
    lastName: "พม่า",
    name: "ด.ญ. อิโม พม่า",
    room: "ป.3",
    classroomId: "ป.3",
    status: "active",
  },
  {
    id: "3108",
    studentCode: "3108",
    number: 8,
    prefix: "ด.ญ.",
    firstName: "แป้ง",
    lastName: "",
    name: "ด.ญ. แป้ง",
    room: "ป.3",
    classroomId: "ป.3",
    status: "active",
  },
];

async function run() {
  console.log("Starting import for Grade 3 (ป.3)...");
  for (const stu of p3Students) {
    const ref = doc(db, "students", stu.id);
    await setDoc(ref, { ...stu, updatedAt: new Date() }, { merge: true });
    console.log(`Saved: ${stu.studentCode} - ${stu.name}`);
  }

  // Update classroom studentCount for room_p3
  const roomRef = doc(db, "classrooms", "room_p3");
  await setDoc(roomRef, {
    id: "room_p3",
    name: "ป.3",
    level: "ป.3",
    roomNumber: "1",
    academicYear: "2568",
    studentCount: p3Students.length,
    updatedAt: new Date()
  }, { merge: true });
  console.log("Updated room_p3 studentCount to", p3Students.length);

  // Verify
  const q = query(collection(db, "students"), where("room", "==", "ป.3"));
  const snap = await getDocs(q);
  console.log(`Verification: Found ${snap.docs.length} students in ป.3`);
  process.exit(0);
}

run().catch(err => {
  console.error("Import failed:", err);
  process.exit(1);
});
