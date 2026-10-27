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

const p5Students = [
  {
    id: "5101",
    studentCode: "5101",
    number: 1,
    prefix: "ด.ช.",
    firstName: "กัญฑ์ณภัทร",
    lastName: "พิบูลย์",
    name: "ด.ช. กัญฑ์ณภัทร พิบูลย์",
    room: "ป.5",
    classroomId: "ป.5",
    status: "active",
  },
  {
    id: "5102",
    studentCode: "5102",
    number: 2,
    prefix: "ด.ช.",
    firstName: "คริษฐ (พม่า)",
    lastName: "ศรีจราพร",
    name: "ด.ช. คริษฐ (พม่า) ศรีจราพร",
    room: "ป.5",
    classroomId: "ป.5",
    status: "active",
  },
  {
    id: "5103",
    studentCode: "5103",
    number: 3,
    prefix: "ด.ช.",
    firstName: "โก (พม่า)",
    lastName: "ศรีจราพร",
    name: "ด.ช. โก (พม่า) ศรีจราพร",
    room: "ป.5",
    classroomId: "ป.5",
    status: "active",
  },
  {
    id: "5104",
    studentCode: "5104",
    number: 4,
    prefix: "ด.ช.",
    firstName: "ชาย",
    lastName: "ศรีจราพร",
    name: "ด.ช. ชาย ศรีจราพร",
    room: "ป.5",
    classroomId: "ป.5",
    status: "active",
  },
  {
    id: "5105",
    studentCode: "5105",
    number: 5,
    prefix: "ด.ญ.",
    firstName: "กัญญารัตน์",
    lastName: "ชูทับ",
    name: "ด.ญ. กัญญารัตน์ ชูทับ",
    room: "ป.5",
    classroomId: "ป.5",
    status: "active",
  },
  {
    id: "5106",
    studentCode: "5106",
    number: 6,
    prefix: "ด.ญ.",
    firstName: "ธนภรณ์",
    lastName: "วงศ์สวัสดิ์",
    name: "ด.ญ. ธนภรณ์ วงศ์สวัสดิ์",
    room: "ป.5",
    classroomId: "ป.5",
    status: "active",
  },
  {
    id: "5107",
    studentCode: "5107",
    number: 7,
    prefix: "ด.ญ.",
    firstName: "ปภัสรา",
    lastName: "นุ่มนวล",
    name: "ด.ญ. ปภัสรา นุ่มนวล",
    room: "ป.5",
    classroomId: "ป.5",
    status: "active",
  },
  {
    id: "5108",
    studentCode: "5108",
    number: 8,
    prefix: "ด.ญ.",
    firstName: "ดอกไม้",
    lastName: "ศรีจราพร",
    name: "ด.ญ. ดอกไม้ ศรีจราพร",
    room: "ป.5",
    classroomId: "ป.5",
    status: "active",
  },
  {
    id: "5109",
    studentCode: "5109",
    number: 9,
    prefix: "ด.ญ.",
    firstName: "อลิสา",
    lastName: "ศรีจราพร",
    name: "ด.ญ. อลิสา ศรีจราพร",
    room: "ป.5",
    classroomId: "ป.5",
    status: "active",
  },
];

async function run() {
  console.log("Starting import for Grade 5 (ป.5)...");
  for (const stu of p5Students) {
    const ref = doc(db, "students", stu.id);
    await setDoc(ref, { ...stu, updatedAt: new Date() }, { merge: true });
    console.log(`Saved: ${stu.studentCode} - ${stu.name}`);
  }

  // Update classroom studentCount for room_p5
  const roomRef = doc(db, "classrooms", "room_p5");
  await setDoc(roomRef, {
    id: "room_p5",
    name: "ป.5",
    level: "ป.5",
    roomNumber: "1",
    academicYear: "2568",
    studentCount: p5Students.length,
    updatedAt: new Date()
  }, { merge: true });
  console.log("Updated room_p5 studentCount to", p5Students.length);

  // Verify
  const q = query(collection(db, "students"), where("room", "==", "ป.5"));
  const snap = await getDocs(q);
  console.log(`Verification: Found ${snap.docs.length} students in ป.5`);
  process.exit(0);
}

run().catch(err => {
  console.error("Import failed:", err);
  process.exit(1);
});
