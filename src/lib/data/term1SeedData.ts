/**
 * ข้อมูลจริงเทอม 1 (Baseline Scores & Attendance Hours)
 * โรงเรียนบ้านควนเนียง ภาคเรียนที่ 1 ปีการศึกษา 2568
 * ทั้งหมด 4 ห้องเรียน (ป.3 - ป.6) รวมนักเรียนจริง 37 คน
 * คะแนนเต็ม 50 คะแนน | เวลาเรียนจริงตามโครงสร้างหลักสูตร
 */

import { Term1VaultDoc } from "@/lib/firebase/services";

export interface Term1RawStudent {
  number: number;
  studentId: string;
  studentCode: string;
  name: string;
  room: string;
  socScore: number;
  socAttended: number;
  socTotal: number;
  hisScore: number;
  hisAttended: number;
  hisTotal: number;
}

export const TERM1_STUDENTS_DATA: Term1RawStudent[] = [
  // ==========================================
  // ชั้นประถมศึกษาปีที่ 3 (8 คน)
  // สังคมศึกษา ส13101: 41 ชม. | ประวัติศาสตร์ ส13102: 21 ชม.
  // ==========================================
  {
    number: 1,
    studentId: "3101",
    studentCode: "3101",
    name: "ด.ช. สายชล จันทร์เขียว",
    room: "ป.3",
    socScore: 39,
    socAttended: 31,
    socTotal: 41, // 🚨 เสี่ยงเวลาเรียน 75.6% (< 80%)
    hisScore: 36,
    hisAttended: 16,
    hisTotal: 21  // 🚨 เสี่ยงเวลาเรียน 76.2% (< 80%)
  },
  {
    number: 2,
    studentId: "3102",
    studentCode: "3102",
    name: "ด.ช. ทู่ พม่า",
    room: "ป.3",
    socScore: 34,
    socAttended: 38,
    socTotal: 41,
    hisScore: 33,
    hisAttended: 20,
    hisTotal: 21
  },
  {
    number: 3,
    studentId: "3103",
    studentCode: "3103",
    name: "ด.ช. ติณณสิรภพ ชูศิริ",
    room: "ป.3",
    socScore: 45,
    socAttended: 39,
    socTotal: 41,
    hisScore: 47,
    hisAttended: 20,
    hisTotal: 21
  },
  {
    number: 4,
    studentId: "3104",
    studentCode: "3104",
    name: "ด.ญ. กณิศา เย็นนพคุณ",
    room: "ป.3",
    socScore: 34,
    socAttended: 41,
    socTotal: 41,
    hisScore: 35,
    hisAttended: 21,
    hisTotal: 21
  },
  {
    number: 5,
    studentId: "3105",
    studentCode: "3105",
    name: "ด.ญ. พิชญาภัค สีแดงยิ่ง",
    room: "ป.3",
    socScore: 34,
    socAttended: 41,
    socTotal: 41,
    hisScore: 35,
    hisAttended: 21,
    hisTotal: 21
  },
  {
    number: 6,
    studentId: "3106",
    studentCode: "3106",
    name: "ด.ญ. กานดา พม่า",
    room: "ป.3",
    socScore: 40,
    socAttended: 41,
    socTotal: 41,
    hisScore: 42,
    hisAttended: 21,
    hisTotal: 21
  },
  {
    number: 7,
    studentId: "3107",
    studentCode: "3107",
    name: "ด.ญ. อิโม พม่า",
    room: "ป.3",
    socScore: 42,
    socAttended: 40,
    socTotal: 41,
    hisScore: 40,
    hisAttended: 21,
    hisTotal: 21
  },
  {
    number: 8,
    studentId: "3108",
    studentCode: "3108",
    name: "ด.ญ. แป้ง",
    room: "ป.3",
    socScore: 33,
    socAttended: 38,
    socTotal: 41,
    hisScore: 34,
    hisAttended: 21,
    hisTotal: 21
  },

  // ==========================================
  // ชั้นประถมศึกษาปีที่ 4 (14 คน)
  // สังคมศึกษา ส14101: 39 ชม. | ประวัติศาสตร์ ส14102: 20 ชม.
  // ==========================================
  {
    number: 1,
    studentId: "4101",
    studentCode: "4101",
    name: "ด.ช. พิชญะ รักชาติ",
    room: "ป.4",
    socScore: 36,
    socAttended: 37,
    socTotal: 39,
    hisScore: 35,
    hisAttended: 20,
    hisTotal: 20
  },
  {
    number: 2,
    studentId: "4102",
    studentCode: "4102",
    name: "ด.ช. กฤษติพัฒน์ สุวรรณมาโจ",
    room: "ป.4",
    socScore: 35,
    socAttended: 38,
    socTotal: 39,
    hisScore: 35,
    hisAttended: 20,
    hisTotal: 20
  },
  {
    number: 3,
    studentId: "4103",
    studentCode: "4103",
    name: "ด.ช. พนัชกร ทองอ่อน",
    room: "ป.4",
    socScore: 43,
    socAttended: 37,
    socTotal: 39,
    hisScore: 39,
    hisAttended: 19,
    hisTotal: 20
  },
  {
    number: 4,
    studentId: "4104",
    studentCode: "4104",
    name: "ด.ช. ธนดล รอดคืน",
    room: "ป.4",
    socScore: 36,
    socAttended: 36,
    socTotal: 39,
    hisScore: 36,
    hisAttended: 19,
    hisTotal: 20
  },
  {
    number: 5,
    studentId: "4105",
    studentCode: "4105",
    name: "ด.ช. เอา พม่า",
    room: "ป.4",
    socScore: 34,
    socAttended: 37,
    socTotal: 39,
    hisScore: 34,
    hisAttended: 19,
    hisTotal: 20
  },
  {
    number: 6,
    studentId: "4106",
    studentCode: "4106",
    name: "ด.ช. ธนวัฒน์ ชูทับ",
    room: "ป.4",
    socScore: 35,
    socAttended: 39,
    socTotal: 39,
    hisScore: 34,
    hisAttended: 20,
    hisTotal: 20
  },
  {
    number: 7,
    studentId: "4107",
    studentCode: "4107",
    name: "ด.ช. ดนัย พม่า",
    room: "ป.4",
    socScore: 40,
    socAttended: 39,
    socTotal: 39,
    hisScore: 42,
    hisAttended: 20,
    hisTotal: 20
  },
  {
    number: 8,
    studentId: "4108",
    studentCode: "4108",
    name: "ด.ช. ซอ พม่า",
    room: "ป.4",
    socScore: 37,
    socAttended: 34,
    socTotal: 39,
    hisScore: 37,
    hisAttended: 20,
    hisTotal: 20
  },
  {
    number: 9,
    studentId: "4109",
    studentCode: "4109",
    name: "ด.ญ. ปุณยนุช หอมหวล",
    room: "ป.4",
    socScore: 42,
    socAttended: 37,
    socTotal: 39,
    hisScore: 43,
    hisAttended: 20,
    hisTotal: 20
  },
  {
    number: 10,
    studentId: "4110",
    studentCode: "4110",
    name: "ด.ญ. เมษา พม่า",
    room: "ป.4",
    socScore: 39,
    socAttended: 37,
    socTotal: 39,
    hisScore: 38,
    hisAttended: 17,
    hisTotal: 20
  },
  {
    number: 11,
    studentId: "4111",
    studentCode: "4111",
    name: "ด.ญ. ดอกแก้ว ศรีจราพร",
    room: "ป.4",
    socScore: 42,
    socAttended: 35,
    socTotal: 39,
    hisScore: 44,
    hisAttended: 20,
    hisTotal: 20
  },
  {
    number: 12,
    studentId: "4112",
    studentCode: "4112",
    name: "ด.ญ. ตอดาวาว พม่า",
    room: "ป.4",
    socScore: 45,
    socAttended: 39,
    socTotal: 39,
    hisScore: 42,
    hisAttended: 20,
    hisTotal: 20
  },
  {
    number: 13,
    studentId: "4113",
    studentCode: "4113",
    name: "ด.ญ. โนรี พม่า",
    room: "ป.4",
    socScore: 40,
    socAttended: 39,
    socTotal: 39,
    hisScore: 39,
    hisAttended: 20,
    hisTotal: 20
  },
  {
    number: 14,
    studentId: "4114",
    studentCode: "4114",
    name: "ด.ญ. ณิชาพัชร์ ทองนุ่น",
    room: "ป.4",
    socScore: 34,
    socAttended: 35,
    socTotal: 39,
    hisScore: 34,
    hisAttended: 20,
    hisTotal: 20
  },

  // ==========================================
  // ชั้นประถมศึกษาปีที่ 5 (9 คน)
  // สังคมศึกษา ส15101: 41 ชม. | ประวัติศาสตร์ ส15102: 20 ชม.
  // ==========================================
  {
    number: 1,
    studentId: "5101",
    studentCode: "5101",
    name: "ด.ช. กัญฑ์ณภัทร พิบูลย์",
    room: "ป.5",
    socScore: 36,
    socAttended: 38,
    socTotal: 41,
    hisScore: 34,
    hisAttended: 20,
    hisTotal: 20
  },
  {
    number: 2,
    studentId: "5102",
    studentCode: "5102",
    name: "ด.ช. คริษฐ (พม่า) ศรีจราพร",
    room: "ป.5",
    socScore: 35,
    socAttended: 41,
    socTotal: 41,
    hisScore: 33,
    hisAttended: 20,
    hisTotal: 20
  },
  {
    number: 3,
    studentId: "5103",
    studentCode: "5103",
    name: "ด.ช. โก (พม่า) ศรีจราพร",
    room: "ป.5",
    socScore: 34,
    socAttended: 40,
    socTotal: 41,
    hisScore: 33,
    hisAttended: 20,
    hisTotal: 20
  },
  {
    number: 4,
    studentId: "5104",
    studentCode: "5104",
    name: "ด.ช. ชาย ศรีจราพร",
    room: "ป.5",
    socScore: 46,
    socAttended: 38,
    socTotal: 41,
    hisScore: 42,
    hisAttended: 19,
    hisTotal: 20
  },
  {
    number: 5,
    studentId: "5105",
    studentCode: "5105",
    name: "ด.ญ. กัญญารัตน์ ชูทับ",
    room: "ป.5",
    socScore: 35,
    socAttended: 40,
    socTotal: 41,
    hisScore: 33,
    hisAttended: 19,
    hisTotal: 20
  },
  {
    number: 6,
    studentId: "5106",
    studentCode: "5106",
    name: "ด.ญ. ธนภรณ์ วงศ์สวัสดิ์",
    room: "ป.5",
    socScore: 43,
    socAttended: 41,
    socTotal: 41,
    hisScore: 38,
    hisAttended: 20,
    hisTotal: 20
  },
  {
    number: 7,
    studentId: "5107",
    studentCode: "5107",
    name: "ด.ญ. ปภัสรา นุ่มนวล",
    room: "ป.5",
    socScore: 41,
    socAttended: 35,
    socTotal: 41,
    hisScore: 34,
    hisAttended: 19,
    hisTotal: 20
  },
  {
    number: 8,
    studentId: "5108",
    studentCode: "5108",
    name: "ด.ญ. ดอกไม้ ศรีจราพร",
    room: "ป.5",
    socScore: 47,
    socAttended: 40,
    socTotal: 41,
    hisScore: 45,
    hisAttended: 20,
    hisTotal: 20
  },
  {
    number: 9,
    studentId: "5109",
    studentCode: "5109",
    name: "ด.ญ. อลิสา ศรีจราพร",
    room: "ป.5",
    socScore: 44,
    socAttended: 39,
    socTotal: 41,
    hisScore: 38,
    hisAttended: 19,
    hisTotal: 20
  },

  // ==========================================
  // ชั้นประถมศึกษาปีที่ 6 (6 คน)
  // สังคมศึกษา ส16101: 39 ชม. | ประวัติศาสตร์ ส16102: 20 ชม.
  // ==========================================
  {
    number: 1,
    studentId: "10001",
    studentCode: "10001",
    name: "ด.ช. ปัณณวัฒน์ ชูเมือง",
    room: "ป.6",
    socScore: 42,
    socAttended: 39,
    socTotal: 39,
    hisScore: 38,
    hisAttended: 20,
    hisTotal: 20
  },
  {
    number: 2,
    studentId: "10002",
    studentCode: "10002",
    name: "ด.ช. สันติสุข เสนสรสัง",
    room: "ป.6",
    socScore: 45,
    socAttended: 39,
    socTotal: 39,
    hisScore: 43,
    hisAttended: 20,
    hisTotal: 20
  },
  {
    number: 3,
    studentId: "10003",
    studentCode: "10003",
    name: "ด.ช. กิตตินัน นาคแก้ว",
    room: "ป.6",
    socScore: 38,
    socAttended: 35,
    socTotal: 39,
    hisScore: 35,
    hisAttended: 19,
    hisTotal: 20
  },
  {
    number: 4,
    studentId: "10004",
    studentCode: "10004",
    name: "ด.ช. กฤษณพล พัฒนศิลป์",
    room: "ป.6",
    socScore: 34,
    socAttended: 34,
    socTotal: 39,
    hisScore: 33,
    hisAttended: 20,
    hisTotal: 20
  },
  {
    number: 5,
    studentId: "10005",
    studentCode: "10005",
    name: "ด.ญ. นันทกานต์ สันทวงศ์",
    room: "ป.6",
    socScore: 39,
    socAttended: 31,
    socTotal: 39, // 🚨 เสี่ยงเวลาเรียน 79.5% (< 80%)
    hisScore: 37,
    hisAttended: 18,
    hisTotal: 20
  },
  {
    number: 6,
    studentId: "10006",
    studentCode: "10006",
    name: "ด.ญ. น้อง พม่า",
    room: "ป.6",
    socScore: 43,
    socAttended: 37,
    socTotal: 39,
    hisScore: 41,
    hisAttended: 20,
    hisTotal: 20
  }
];

/**
 * สร้างโครงสร้าง Term1VaultDoc สำหรับทั้ง 8 วิชา
 */
export function generateAllTerm1VaultDocs(): Record<string, Term1VaultDoc> {
  const vaults: Record<string, Term1VaultDoc> = {};

  const subjectConfigs: { room: string; subjectId: string; type: "soc" | "his" }[] = [
    { room: "ป.3", subjectId: "sub_soc_13101", type: "soc" },
    { room: "ป.3", subjectId: "sub_his_13102", type: "his" },
    { room: "ป.4", subjectId: "sub_soc_14101", type: "soc" },
    { room: "ป.4", subjectId: "sub_his_14102", type: "his" },
    { room: "ป.5", subjectId: "sub_soc_15101", type: "soc" },
    { room: "ป.5", subjectId: "sub_his_15102", type: "his" },
    { room: "ป.6", subjectId: "sub_soc_16101", type: "soc" },
    { room: "ป.6", subjectId: "sub_his_16102", type: "his" },
  ];

  subjectConfigs.forEach(({ room, subjectId, type }) => {
    const docId = `${room}_${subjectId}`.replace(/[\/\s]/g, "_");
    const roomStudents = TERM1_STUDENTS_DATA.filter(s => s.room === room);

    const studentsMap: Term1VaultDoc["students"] = {};
    roomStudents.forEach(st => {
      const score = type === "soc" ? st.socScore : st.hisScore;
      const attended = type === "soc" ? st.socAttended : st.hisAttended;
      const total = type === "soc" ? st.socTotal : st.hisTotal;

      studentsMap[st.studentId] = {
        studentId: st.studentId,
        studentCode: st.studentCode,
        score,
        maxScore: 50,
        attendedPeriods: attended,
        totalPeriods: total,
        note: "ต้นทุนเดิมเทอม 1 (โรงเรียนบ้านควนเนียง)",
        updatedAt: "2026-10-26T00:00:00.000Z"
      };
    });

    vaults[docId] = {
      id: docId,
      classroomId: room,
      subjectId,
      isLocked: true, // Term 1 Locked Vault by default
      lockedAt: "2026-10-26T00:00:00.000Z",
      lockedBy: "ระบบคลังคะแนนต้นทาง (โรงเรียนบ้านควนเนียง)",
      maxScore: 50,
      students: studentsMap
    };
  });

  return vaults;
}

/**
 * ดึงข้อมูล Vault เทอม 1 Fallback สำหรับห้องและวิชาที่ระบุ
 */
export function getLocalTerm1VaultFallback(classroomId: string, subjectId: string): Term1VaultDoc | null {
  const allVaults = generateAllTerm1VaultDocs();
  const docId = `${classroomId}_${subjectId}`.replace(/[\/\s]/g, "_");
  return allVaults[docId] || null;
}
