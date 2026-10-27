import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  writeBatch,
  orderBy
} from "firebase/firestore";
import { db, auth } from "./client";

export function getActor(actorEmail?: string): string {
  return actorEmail || auth.currentUser?.email || "teacher@school.ac.th";
}

// Types
export interface StudentRecord {
  id: string;
  studentCode: string;
  number: number;
  prefix: string;
  firstName: string;
  lastName: string;
  name: string;
  nickname?: string;
  room: string;
  classroomId: string;
  status: "active" | "transferred" | "dropped";
}

export interface ScoreRecord {
  id: string; // studentId_activityId
  studentId: string;
  activityId: string;
  rawScore: number;
  subjectId?: string;
  updatedAt?: any;
}

// 1. Fetch Students
export async function getAllStudents(): Promise<StudentRecord[]> {
  try {
    const q = query(collection(db, "students"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentRecord))
      .sort((a, b) => a.number - b.number);
  } catch (err) {
    console.error("Error fetching all students:", err);
    return [];
  }
}

export async function getStudentsByClassroom(classroomId: string): Promise<StudentRecord[]> {
  try {
    const q = query(collection(db, "students"), where("classroomId", "==", classroomId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentRecord))
      .sort((a, b) => a.number - b.number);
  } catch (err) {
    console.error("Error fetching students by classroom:", err);
    return [];
  }
}

export async function getStudentsByRoom(room: string): Promise<StudentRecord[]> {
  try {
    const q = query(collection(db, "students"), where("room", "==", room));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentRecord))
      .sort((a, b) => a.number - b.number);
  } catch (err) {
    console.error("Error fetching students by room:", err);
    return [];
  }
}

// 2. Save Single Student
export async function saveStudent(student: StudentRecord, actorEmail?: string): Promise<void> {
  const docRef = doc(db, "students", student.id);
  await setDoc(docRef, { ...student, updatedAt: new Date() }, { merge: true });
  await logAuditEvent("save_student", getActor(actorEmail), "student", `บันทึก/แก้ไขข้อมูลนักเรียน "${student.name}" (รหัส ${student.studentCode})`);
}

// 3. Delete Student
export async function deleteStudent(id: string, actorEmail?: string): Promise<void> {
  const docRef = doc(db, "students", id);
  await deleteDoc(docRef);
  await logAuditEvent("delete_student", getActor(actorEmail), "student", `ลบข้อมูลนักเรียน รหัส "${id}"`);
}

// 4. Batch Import Students (Defensive chunking up to 500 per batch)
export async function saveStudentsBatch(students: StudentRecord[], actorEmail?: string): Promise<number> {
  const CHUNK_SIZE = 400; // Safe threshold for Firestore 500 ops limit
  let totalSaved = 0;

  for (let i = 0; i < students.length; i += CHUNK_SIZE) {
    const chunk = students.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    chunk.forEach(student => {
      const docRef = doc(db, "students", student.id);
      batch.set(docRef, { ...student, updatedAt: new Date() }, { merge: true });
    });

    await batch.commit();
    totalSaved += chunk.length;
    if (i + CHUNK_SIZE < students.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  await logAuditEvent("import_students", getActor(actorEmail), "student", `นำเข้า/อัปเดตข้อมูลนักเรียน ${totalSaved} คน ผ่านระบบ Excel`);
  return totalSaved;
}

// 5. Fetch Scores for a Classroom's Subject
export async function getScoresBySubject(subjectId: string): Promise<ScoreRecord[]> {
  try {
    const q = query(collection(db, "scores"), where("subjectId", "==", subjectId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScoreRecord));
  } catch (err) {
    console.error("Error fetching scores:", err);
    return [];
  }
}

// 6. Save Multiple Scores (Batch)
export async function saveScoresBatch(subjectId: string, scores: Omit<ScoreRecord, 'id'>[], actorEmail?: string): Promise<void> {
  const batch = writeBatch(db);
  
  scores.forEach(score => {
    const scoreId = `${score.studentId}_${score.activityId}`;
    const docRef = doc(db, "scores", scoreId);
    batch.set(docRef, { ...score, subjectId, updatedAt: new Date() }, { merge: true });
  });

  await batch.commit();
  await logAuditEvent("update_scores", getActor(actorEmail), "score", `บันทึกคะแนนรวม ${scores.length} รายการ (วิชา ${subjectId})`);
}

// 7. Score Columns Configuration
export interface ScoreColumnRecord {
  id: string;
  name: string;
  type: "collected" | "midterm" | "final";
  unitName?: string;
  maxScore: number;
  weight: number;
  term: "1" | "2" | "all";
  subjectId?: string;
  order?: number;
}

export async function getScoreColumnsBySubject(subjectId: string): Promise<ScoreColumnRecord[]> {
  try {
    const q = query(collection(db, "scoreColumns"), where("subjectId", "==", subjectId));
    const snapshot = await getDocs(q);
    const cols = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScoreColumnRecord));
    return cols.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (err) {
    console.error("Error fetching score columns:", err);
    return [];
  }
}

export async function saveScoreColumn(subjectId: string, col: ScoreColumnRecord): Promise<void> {
  const docRef = doc(db, "scoreColumns", col.id);
  await setDoc(docRef, { ...col, subjectId, updatedAt: new Date() }, { merge: true });
}

export async function deleteScoreColumn(columnId: string): Promise<void> {
  const docRef = doc(db, "scoreColumns", columnId);
  await deleteDoc(docRef);
}

// 8. Attendance Operations
export interface AttendanceHistoryDoc {
  id: string; // `${classId}_${date}_${period}`
  classId: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  period: string; // "1", "2", "all-day", etc.
  records: { [studentId: string]: "present" | "absent" | "leave" | "late" | "activity" };
  updatedAt?: any;
}

export async function saveAttendanceRecord(
  classId: string,
  subjectId: string,
  date: string,
  period: string,
  records: { [studentId: string]: any },
  actorEmail?: string
): Promise<void> {
  const docId = `${classId}_${subjectId}_${date}_${period}`.replace(/[\/\s]/g, "_");
  const docRef = doc(db, "attendance", docId);
  await setDoc(docRef, {
    classId,
    subjectId,
    date,
    period,
    records,
    updatedAt: new Date()
  }, { merge: true });
  await logAuditEvent("update_attendance", getActor(actorEmail), "attendance", `เช็กชื่อเวลาเรียน ชั้น ${classId} วิชา ${subjectId} วันที่ ${date} (${period})`);
}

export async function getAttendanceRecord(
  classId: string,
  subjectId: string,
  date: string,
  period: string
): Promise<{ [studentId: string]: string } | null> {
  try {
    const docId = `${classId}_${subjectId}_${date}_${period}`.replace(/[\/\s]/g, "_");
    const docRef = doc(db, "attendance", docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return (snap.data() as AttendanceHistoryDoc).records || null;
    }
    return null;
  } catch (err) {
    console.error("Error fetching single attendance record:", err);
    return null;
  }
}

export async function getAttendanceHistory(
  classId: string,
  subjectId: string
): Promise<AttendanceHistoryDoc[]> {
  try {
    const q = query(
      collection(db, "attendance"), 
      where("classId", "==", classId),
      where("subjectId", "==", subjectId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceHistoryDoc));
  } catch (err) {
    console.error("Error fetching attendance history:", err);
    return [];
  }
}

// 9. Assessment Records (Section 4, 5, 6)
export interface AssessmentDoc {
  id: string; // `${classId}_${subjectId}_${type}`
  classId: string;
  subjectId: string;
  type: "attributes" | "literacy" | "competencies";
  scores: {
    [studentId: string]: { [criteriaId: string]: number };
  };
  updatedAt?: any;
}

export async function saveAssessmentRecord(
  classId: string,
  subjectId: string,
  type: "attributes" | "literacy" | "competencies",
  scores: { [studentId: string]: { [criteriaId: string]: number } },
  actorEmail?: string
): Promise<void> {
  const docId = `${classId}_${subjectId}_${type}`.replace(/[\/\s]/g, "_");
  const docRef = doc(db, "assessments", docId);
  await setDoc(docRef, {
    classId,
    subjectId,
    type,
    scores,
    updatedAt: new Date()
  }, { merge: true });
  const typeLabel = type === "attributes" ? "คุณลักษณะ 8 ประการ" : type === "literacy" ? "อ่านคิดวิเคราะห์เขียน" : "สมรรถนะ 5 ด้าน";
  await logAuditEvent("update_assessment", getActor(actorEmail), "assessment", `บันทึกการประเมิน "${typeLabel}" ชั้น ${classId}`);
}

export async function getAssessmentRecord(
  classId: string,
  subjectId: string,
  type: "attributes" | "literacy" | "competencies"
): Promise<{ [studentId: string]: { [criteriaId: string]: number } } | null> {
  try {
    const docId = `${classId}_${subjectId}_${type}`.replace(/[\/\s]/g, "_");
    const docRef = doc(db, "assessments", docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return (snap.data() as AssessmentDoc).scores || null;
    }
    return null;
  } catch (err) {
    console.error("Error fetching assessment record:", err);
    return null;
  }
}

// 10. Audit Log Operations (PDPA Compliance)
export interface AuditLogDoc {
  id: string;
  action: string;
  actorEmail: string;
  targetType: string;
  details: string;
  timestamp: string; // ISO String
}

export async function logAuditEvent(
  action: string,
  actorEmail: string,
  targetType: string,
  details: string
): Promise<void> {
  try {
    const docId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const docRef = doc(db, "auditLogs", docId);
    await setDoc(docRef, {
      action,
      actorEmail: actorEmail || "teacher@school.ac.th",
      targetType,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Failed to write audit log:", err);
  }
}

export async function getAuditLogs(): Promise<AuditLogDoc[]> {
  try {
    const q = query(collection(db, "auditLogs"));
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogDoc));
    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch (err) {
    console.error("Failed to read audit logs:", err);
    return [];
  }
}

// 11. Subjects & Curriculum Management
export interface CurriculumIndicator {
  code: string;           // e.g. "ส 4.1 ป.3/1"
  description: string;    // คำอธิบายตัวชี้วัด
}

export interface CurriculumUnit {
  unitNumber: number;     // ลำดับหน่วย (1, 2, 3...)
  title: string;          // ชื่อหน่วยการเรียนรู้
  strand: string;         // สาระ (ศาสนา, หน้าที่พลเมือง, เศรษฐศาสตร์, ภูมิศาสตร์, ประวัติศาสตร์)
  term: number;           // ภาคเรียนที่ 1 หรือ 2
  hours: number;          // จำนวนชั่วโมง
  scoreWeight: number;    // น้ำหนักคะแนน
  indicatorsBetween: CurriculumIndicator[]; // ตัวชี้วัดระหว่างทาง
  indicatorsEnd: CurriculumIndicator[];     // ตัวชี้วัดปลายทาง
  learningTopics: string[]; // หัวข้อสาระการเรียนรู้ย่อย
}

export interface SubjectDoc {
  id: string;
  code: string; // e.g. "ส13101"
  name: string; // e.g. "สังคมศึกษา ศาสนา และวัฒนธรรม 3"
  learningArea: string; // e.g. "สังคมศึกษา ศาสนาและวัฒนธรรม"
  level: string; // e.g. "ป.3"
  type: "basic" | "additional";
  credits: number;
  hours: number;
  assignedRooms: string[]; // e.g. ["ป.3"]
  units?: CurriculumUnit[]; // หน่วยการเรียนรู้และตัวชี้วัดจริง
  updatedAt?: any;
}

export async function getAllSubjects(): Promise<SubjectDoc[]> {
  try {
    const q = query(collection(db, "subjects"));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubjectDoc));
    return list.sort((a, b) => a.code.localeCompare(b.code));
  } catch (err) {
    console.error("Error fetching subjects:", err);
    return [];
  }
}

export async function getSubjectById(id: string): Promise<SubjectDoc | null> {
  try {
    const docRef = doc(db, "subjects", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as SubjectDoc;
    }
    return null;
  } catch (err) {
    console.error("Error fetching subject by id:", err);
    return null;
  }
}

export async function saveSubject(subject: SubjectDoc, actorEmail?: string): Promise<void> {
  const docRef = doc(db, "subjects", subject.id);
  await setDoc(docRef, { ...subject, updatedAt: new Date() }, { merge: true });
  await logAuditEvent("save_subject", actorEmail || "teacher@school.ac.th", "subject", `บันทึก/แก้ไขรายวิชา ${subject.code} ${subject.name}`);
}

export async function deleteSubject(id: string, actorEmail?: string): Promise<void> {
  const docRef = doc(db, "subjects", id);
  await deleteDoc(docRef);
  await logAuditEvent("delete_subject", actorEmail || "teacher@school.ac.th", "subject", `ลบรายวิชา รหัส "${id}"`);
}

// 12. Classrooms Management
export interface ClassroomDoc {
  id: string; // e.g. "room_p6"
  name: string; // e.g. "ป.6"
  level: string; // e.g. "ป.6"
  roomNumber: string; // e.g. "1"
  academicYear: string; // e.g. "2568"
  advisorName?: string;
  studentCount?: number;
  updatedAt?: any;
}

export async function getAllClassrooms(): Promise<ClassroomDoc[]> {
  try {
    const q = query(collection(db, "classrooms"));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomDoc));
    return list.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error("Error fetching classrooms:", err);
    return [];
  }
}

export async function saveClassroom(classroom: ClassroomDoc, actorEmail?: string): Promise<void> {
  const docRef = doc(db, "classrooms", classroom.id);
  await setDoc(docRef, { ...classroom, updatedAt: new Date() }, { merge: true });
  await logAuditEvent("save_classroom", actorEmail || "teacher@school.ac.th", "classroom", `บันทึก/แก้ไขห้องเรียน ${classroom.name}`);
}

export async function deleteClassroom(id: string, actorEmail?: string): Promise<void> {
  const docRef = doc(db, "classrooms", id);
  await deleteDoc(docRef);
  await logAuditEvent("delete_classroom", actorEmail || "teacher@school.ac.th", "classroom", `ลบห้องเรียน รหัส "${id}"`);
}

// 13. Learning Units & Indicators
export interface LearningUnitDoc {
  id: string;
  subjectId: string;
  unitNumber: number;
  name: string;
  hours: number;
  score: number;
  indicators: { code: string; desc: string }[];
  updatedAt?: any;
}

export async function getLearningUnitsBySubject(subjectId: string): Promise<LearningUnitDoc[]> {
  try {
    const q = query(collection(db, "learningUnits"), where("subjectId", "==", subjectId));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LearningUnitDoc));
    return list.sort((a, b) => a.unitNumber - b.unitNumber);
  } catch (err) {
    console.error("Error fetching learning units:", err);
    return [];
  }
}

export async function saveLearningUnit(unit: LearningUnitDoc): Promise<void> {
  const docRef = doc(db, "learningUnits", unit.id);
  await setDoc(docRef, { ...unit, updatedAt: new Date() }, { merge: true });
}

export async function deleteLearningUnit(unitId: string): Promise<void> {
  const docRef = doc(db, "learningUnits", unitId);
  await deleteDoc(docRef);
}

// 14. School Information Management
export interface SchoolInfoDoc {
  schoolNameTh: string;
  schoolNameEn: string;
  schoolCode: string;
  affiliation: string;
  address: string;
  directorName: string;
  headOfAcademicName: string;
  updatedAt?: any;
}

export async function getSchoolInfo(): Promise<SchoolInfoDoc | null> {
  try {
    const docRef = doc(db, "settings", "school_info");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SchoolInfoDoc;
    }
    return null;
  } catch (err) {
    console.error("Error fetching school info:", err);
    return null;
  }
}

export async function saveSchoolInfo(info: SchoolInfoDoc, actorEmail?: string): Promise<void> {
  const docRef = doc(db, "settings", "school_info");
  await setDoc(docRef, { ...info, updatedAt: new Date() }, { merge: true });
  await logAuditEvent("update_school_info", actorEmail || "teacher@school.ac.th", "school", `แก้ไขข้อมูลพื้นฐานสถานศึกษา (${info.schoolNameTh})`);
}

// 15. Academic Years Management
export interface AcademicYearDoc {
  id: string; // e.g. "2568"
  year: number;
  isActive: boolean;
  terms: { num: number; active: boolean; startDate: string; endDate: string }[];
  updatedAt?: any;
}

export async function getAcademicYears(): Promise<AcademicYearDoc[]> {
  try {
    const q = query(collection(db, "academicYears"));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AcademicYearDoc));
    return list.sort((a, b) => b.year - a.year);
  } catch (err) {
    console.error("Error fetching academic years:", err);
    return [];
  }
}

export async function saveAcademicYear(item: AcademicYearDoc, actorEmail?: string): Promise<void> {
  const docRef = doc(db, "academicYears", item.id);
  await setDoc(docRef, { ...item, updatedAt: new Date() }, { merge: true });
  await logAuditEvent("save_academic_year", actorEmail || "teacher@school.ac.th", "academic_year", `บันทึกข้อมูลปีการศึกษา ${item.year}`);
}

export async function setActiveAcademicYear(yearId: string, actorEmail?: string): Promise<void> {
  const years = await getAcademicYears();
  const batch = writeBatch(db);
  for (const y of years) {
    const docRef = doc(db, "academicYears", y.id);
    batch.update(docRef, { isActive: y.id === yearId, updatedAt: new Date() });
  }
  await batch.commit();
  await logAuditEvent("set_active_academic_year", actorEmail || "teacher@school.ac.th", "academic_year", `ตั้งค่าปีการศึกษา ${yearId} เป็นปีปัจจุบัน`);
}

export async function deleteAcademicYear(yearId: string, actorEmail?: string): Promise<void> {
  const docRef = doc(db, "academicYears", yearId);
  await deleteDoc(docRef);
  await logAuditEvent("delete_academic_year", getActor(actorEmail), "academic_year", `ลบปีการศึกษา ${yearId}`);
}

export async function getActiveAcademicYear(): Promise<AcademicYearDoc | null> {
  try {
    const years = await getAcademicYears();
    return years.find(y => y.isActive) || years[0] || null;
  } catch (err) {
    console.error("Error fetching active academic year:", err);
    return null;
  }
}

export async function deleteAttendanceRecord(
  classId: string,
  subjectId: string,
  date: string,
  period: string,
  actorEmail?: string
): Promise<void> {
  const docId = `${classId}_${subjectId}_${date}_${period}`.replace(/[\/\s]/g, "_");
  const docRef = doc(db, "attendance", docId);
  await deleteDoc(docRef);
  await logAuditEvent("delete_attendance", getActor(actorEmail), "attendance", `ลบบันทึกเวลาเรียน ชั้น ${classId} วิชา ${subjectId} วันที่ ${date} (${period})`);
}

export async function deleteScoresByColumn(
  columnId: string,
  studentIds: string[],
  actorEmail?: string
): Promise<void> {
  const batch = writeBatch(db);
  for (const stuId of studentIds) {
    const docId = `${stuId}_${columnId}`;
    const docRef = doc(db, "scores", docId);
    batch.delete(docRef);
  }
  const colRef = doc(db, "scoreColumns", columnId);
  batch.delete(colRef);
  await batch.commit();
  await logAuditEvent("delete_score_column", getActor(actorEmail), "score", `ลบคอลัมน์คะแนน ${columnId}`);
}

// 16. Term 1 Baseline Vault (50:50 Dual-Term Continuity)
export interface Term1StudentBaseline {
  studentId: string;
  studentCode: string;
  score: number | null; // null if unrecorded ("-")
  maxScore: number;     // default 50
  attendedPeriods: number | null; // null if unrecorded ("-")
  totalPeriods: number; // default 40 (for 80hr course) or 20 (for 40hr course)
  note?: string;
  updatedAt?: string;
}

export interface Term1VaultDoc {
  id: string; // `${classroomId}_${subjectId}`
  classroomId: string;
  subjectId: string;
  isLocked: boolean;
  lockedAt?: string | null;
  lockedBy?: string | null;
  maxScore: number; // default 50
  students: {
    [studentId: string]: Term1StudentBaseline;
  };
  updatedAt?: any;
}

import { getLocalTerm1VaultFallback } from "@/lib/data/term1SeedData";

export async function getTerm1Vault(classroomId: string, subjectId: string): Promise<Term1VaultDoc | null> {
  try {
    const docId = `${classroomId}_${subjectId}`.replace(/[\/\s]/g, "_");
    const docRef = doc(db, "term1Baselines", docId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Term1VaultDoc;
    }
    return getLocalTerm1VaultFallback(classroomId, subjectId);
  } catch (err) {
    console.error("Error fetching Term 1 Vault:", err);
    return getLocalTerm1VaultFallback(classroomId, subjectId);
  }
}

export async function saveTerm1Vault(vault: Term1VaultDoc, actorEmail?: string): Promise<void> {
  const docId = `${vault.classroomId}_${vault.subjectId}`.replace(/[\/\s]/g, "_");
  const docRef = doc(db, "term1Baselines", docId);
  await setDoc(docRef, { ...vault, updatedAt: new Date() }, { merge: true });
  await logAuditEvent(
    "save_term1_vault",
    getActor(actorEmail),
    "term1_vault",
    `บันทึกคลังคะแนนเทอม 1 (Baseline Vault) ชั้น ${vault.classroomId} วิชา ${vault.subjectId}`
  );
}

export async function saveTerm1StudentScore(
  classroomId: string,
  subjectId: string,
  studentId: string,
  studentCode: string,
  score: number | null,
  attendedPeriods?: number | null,
  maxScore: number = 50,
  actorEmail?: string
): Promise<void> {
  const docId = `${classroomId}_${subjectId}`.replace(/[\/\s]/g, "_");
  const docRef = doc(db, "term1Baselines", docId);
  const snap = await getDoc(docRef);
  let currentVault: Term1VaultDoc;
  if (snap.exists()) {
    currentVault = snap.data() as Term1VaultDoc;
  } else {
    currentVault = {
      id: docId,
      classroomId,
      subjectId,
      isLocked: false,
      maxScore,
      students: {}
    };
  }

  currentVault.students = currentVault.students || {};
  currentVault.students[studentId] = {
    studentId,
    studentCode,
    score,
    maxScore,
    attendedPeriods: attendedPeriods !== undefined ? attendedPeriods : (currentVault.students[studentId]?.attendedPeriods ?? null),
    totalPeriods: currentVault.students[studentId]?.totalPeriods || 40,
    updatedAt: new Date().toISOString()
  };

  await setDoc(docRef, { ...currentVault, updatedAt: new Date() }, { merge: true });
}

export async function toggleTerm1VaultLock(
  classroomId: string,
  subjectId: string,
  isLocked: boolean,
  actorEmail?: string
): Promise<void> {
  const docId = `${classroomId}_${subjectId}`.replace(/[\/\s]/g, "_");
  const docRef = doc(db, "term1Baselines", docId);
  const actor = getActor(actorEmail);
  await setDoc(docRef, {
    isLocked,
    lockedAt: isLocked ? new Date().toISOString() : null,
    lockedBy: isLocked ? actor : null,
    updatedAt: new Date()
  }, { merge: true });
  await logAuditEvent(
    isLocked ? "lock_term1_vault" : "unlock_term1_vault",
    actor,
    "term1_vault",
    `${isLocked ? "ล็อก" : "ปลดล็อก"}คลังคะแนนเทอม 1 ชั้น ${classroomId} วิชา ${subjectId}`
  );
}






