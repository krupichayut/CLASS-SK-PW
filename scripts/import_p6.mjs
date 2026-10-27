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

const p6Students = [
  {
    id: "10001",
    studentCode: "10001",
    number: 1,
    prefix: "ด.ช.",
    firstName: "ปัณณวัฒน์",
    lastName: "ชูเมือง",
    name: "ด.ช. ปัณณวัฒน์ ชูเมือง",
    room: "ป.6",
    classroomId: "ป.6",
    status: "active",
  },
  {
    id: "10002",
    studentCode: "10002",
    number: 2,
    prefix: "ด.ช.",
    firstName: "สันติสุข",
    lastName: "เสนสรสัง",
    name: "ด.ช. สันติสุข เสนสรสัง",
    room: "ป.6",
    classroomId: "ป.6",
    status: "active",
  },
  {
    id: "10003",
    studentCode: "10003",
    number: 3,
    prefix: "ด.ช.",
    firstName: "กิตตินัน",
    lastName: "นาคแก้ว",
    name: "ด.ช. กิตตินัน นาคแก้ว",
    room: "ป.6",
    classroomId: "ป.6",
    status: "active",
  },
  {
    id: "10004",
    studentCode: "10004",
    number: 4,
    prefix: "ด.ช.",
    firstName: "กฤษณพล",
    lastName: "พัฒนศิลป์",
    name: "ด.ช. กฤษณพล พัฒนศิลป์",
    room: "ป.6",
    classroomId: "ป.6",
    status: "active",
  },
  {
    id: "10005",
    studentCode: "10005",
    number: 5,
    prefix: "ด.ญ.",
    firstName: "นันทกานต์",
    lastName: "สันทวงศ์",
    name: "ด.ญ. นันทกานต์ สันทวงศ์",
    room: "ป.6",
    classroomId: "ป.6",
    status: "active",
  },
  {
    id: "10006",
    studentCode: "10006",
    number: 6,
    prefix: "ด.ญ.",
    firstName: "น้อง",
    lastName: "พม่า",
    name: "ด.ญ. น้อง พม่า",
    room: "ป.6",
    classroomId: "ป.6",
    status: "active",
  },
];

async function run() {
  console.log("Starting import/sync for Grade 6 (ป.6)...");
  for (const stu of p6Students) {
    const ref = doc(db, "students", stu.id);
    await setDoc(ref, { ...stu, updatedAt: new Date() }, { merge: true });
    console.log(`Saved: ${stu.studentCode} - ${stu.name}`);
  }

  // Update classroom studentCount for room_p6
  const roomRef = doc(db, "classrooms", "room_p6");
  await setDoc(roomRef, {
    id: "room_p6",
    name: "ป.6",
    level: "ป.6",
    roomNumber: "1",
    academicYear: "2568",
    advisorName: "นายพิชญุตม์ ประภาศิริ",
    studentCount: p6Students.length,
    updatedAt: new Date()
  }, { merge: true });
  console.log("Updated room_p6 studentCount to", p6Students.length);

  // Verify
  const q = query(collection(db, "students"), where("room", "==", "ป.6"));
  const snap = await getDocs(q);
  console.log(`Verification: Found ${snap.docs.length} students in ป.6`);
  process.exit(0);
}

run().catch(err => {
  console.error("Import failed:", err);
  process.exit(1);
});
