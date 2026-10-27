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

const p4Students = [
  {
    id: "4101",
    studentCode: "4101",
    number: 1,
    prefix: "ด.ช.",
    firstName: "พิชญะ",
    lastName: "รักชาติ",
    name: "ด.ช. พิชญะ รักชาติ",
    room: "ป.4",
    classroomId: "ป.4",
    status: "active",
  },
  {
    id: "4102",
    studentCode: "4102",
    number: 2,
    prefix: "ด.ช.",
    firstName: "กฤษติพัฒน์",
    lastName: "สุวรรณมาโจ",
    name: "ด.ช. กฤษติพัฒน์ สุวรรณมาโจ",
    room: "ป.4",
    classroomId: "ป.4",
    status: "active",
  },
  {
    id: "4103",
    studentCode: "4103",
    number: 3,
    prefix: "ด.ช.",
    firstName: "พนัชกร",
    lastName: "ทองอ่อน",
    name: "ด.ช. พนัชกร ทองอ่อน",
    room: "ป.4",
    classroomId: "ป.4",
    status: "active",
  },
  {
    id: "4104",
    studentCode: "4104",
    number: 4,
    prefix: "ด.ช.",
    firstName: "ธนดล",
    lastName: "รอดคืน",
    name: "ด.ช. ธนดล รอดคืน",
    room: "ป.4",
    classroomId: "ป.4",
    status: "active",
  },
  {
    id: "4105",
    studentCode: "4105",
    number: 5,
    prefix: "ด.ช.",
    firstName: "เอา",
    lastName: "พม่า",
    name: "ด.ช. เอา พม่า",
    room: "ป.4",
    classroomId: "ป.4",
    status: "active",
  },
  {
    id: "4106",
    studentCode: "4106",
    number: 6,
    prefix: "ด.ช.",
    firstName: "ธนวัฒน์",
    lastName: "ชูทับ",
    name: "ด.ช. ธนวัฒน์ ชูทับ",
    room: "ป.4",
    classroomId: "ป.4",
    status: "active",
  },
  {
    id: "4107",
    studentCode: "4107",
    number: 7,
    prefix: "ด.ช.",
    firstName: "ดนัย",
    lastName: "พม่า",
    name: "ด.ช. ดนัย พม่า",
    room: "ป.4",
    classroomId: "ป.4",
    status: "active",
  },
  {
    id: "4108",
    studentCode: "4108",
    number: 8,
    prefix: "ด.ช.",
    firstName: "ซอ",
    lastName: "พม่า",
    name: "ด.ช. ซอ พม่า",
    room: "ป.4",
    classroomId: "ป.4",
    status: "active",
  },
  {
    id: "4109",
    studentCode: "4109",
    number: 9,
    prefix: "ด.ญ.",
    firstName: "ปุณยนุช",
    lastName: "หอมหวล",
    name: "ด.ญ. ปุณยนุช หอมหวล",
    room: "ป.4",
    classroomId: "ป.4",
    status: "active",
  },
  {
    id: "4110",
    studentCode: "4110",
    number: 10,
    prefix: "ด.ญ.",
    firstName: "เมษา",
    lastName: "พม่า",
    name: "ด.ญ. เมษา พม่า",
    room: "ป.4",
    classroomId: "ป.4",
    status: "active",
  },
  {
    id: "4111",
    studentCode: "4111",
    number: 11,
    prefix: "ด.ญ.",
    firstName: "ดอกแก้ว",
    lastName: "ศรีจราพร",
    name: "ด.ญ. ดอกแก้ว ศรีจราพร",
    room: "ป.4",
    classroomId: "ป.4",
    status: "active",
  },
  {
    id: "4112",
    studentCode: "4112",
    number: 12,
    prefix: "ด.ญ.",
    firstName: "ตอดาวาว",
    lastName: "พม่า",
    name: "ด.ญ. ตอดาวาว พม่า",
    room: "ป.4",
    classroomId: "ป.4",
    status: "active",
  },
  {
    id: "4113",
    studentCode: "4113",
    number: 13,
    prefix: "ด.ญ.",
    firstName: "โนรี",
    lastName: "พม่า",
    name: "ด.ญ. โนรี พม่า",
    room: "ป.4",
    classroomId: "ป.4",
    status: "active",
  },
  {
    id: "4114",
    studentCode: "4114",
    number: 14,
    prefix: "ด.ญ.",
    firstName: "ณิชาพัชร์",
    lastName: "ทองนุ่น",
    name: "ด.ญ. ณิชาพัชร์ ทองนุ่น",
    room: "ป.4",
    classroomId: "ป.4",
    status: "active",
  },
];

async function run() {
  console.log("Starting import for Grade 4 (ป.4)...");
  for (const stu of p4Students) {
    const ref = doc(db, "students", stu.id);
    await setDoc(ref, { ...stu, updatedAt: new Date() }, { merge: true });
    console.log(`Saved: ${stu.studentCode} - ${stu.name}`);
  }

  // Update classroom studentCount for room_p4
  const roomRef = doc(db, "classrooms", "room_p4");
  await setDoc(roomRef, {
    id: "room_p4",
    name: "ป.4",
    level: "ป.4",
    roomNumber: "1",
    academicYear: "2568",
    studentCount: p4Students.length,
    updatedAt: new Date()
  }, { merge: true });
  console.log("Updated room_p4 studentCount to", p4Students.length);

  // Verify
  const q = query(collection(db, "students"), where("room", "==", "ป.4"));
  const snap = await getDocs(q);
  console.log(`Verification: Found ${snap.docs.length} students in ป.4`);
  process.exit(0);
}

run().catch(err => {
  console.error("Import failed:", err);
  process.exit(1);
});
