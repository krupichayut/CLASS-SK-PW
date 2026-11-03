/**
 * Attendance & Smart Alert Calculation Engine
 * อ้างอิงเกณฑ์เวลาเรียนขั้นต่ำ 80% ของกระทรวงศึกษาธิการ / สพฐ.
 * รองรับการคำนวณสะสมสองภาคเรียน (Term 1 Baseline + Term 2 Runway)
 */

export type AttendanceStatus = "present" | "absent" | "leave" | "late" | "activity";

export interface StudentAttendanceSummary {
  studentId: string;
  studentCode: string;
  name: string;
  number: number;
  room?: string;
  present: number;
  absent: number;
  leave: number;
  late: number;
  activity: number;
  totalPeriods: number;
  attendedPeriods: number;
  attendancePercent: number;
  isMS: boolean; // เวลาเรียนไม่ถึง 80% ตลอดรายวิชา (ผลการเรียน "ม.ส.")
  consecutiveAbsent: number; // ขาดเรียนติดต่อกันในเทอม 2
  isRisk: boolean; // กลุ่มเสี่ยง (เวลาเรียน < 80%, ติด ม.ส., หรือโควตาขาดเหลือน้อย)
  remainingAllowedAbsences: number; // โควตาขาดได้อีก (คาบ) ตลอดปี ก่อนหลุดเกณฑ์ 80%
  // รายละเอียดความต่อเนื่องระหว่างเทอม (Dual-Term Continuity)
  term1Attended?: number | null;
  term1Total?: number | null;
  term1Percent?: number | null;
  term2Attended?: number;
  term2Total?: number;
  term2Percent?: number;
  cumulativeAttended?: number;
  cumulativeTotal?: number;
  cumulativePercent?: number;
}

/**
 * คำนวณสรุปเวลาเรียนสะสมของนักเรียนแต่ละคน (รวมทุนเดิมเทอม 1 หากมี)
 * @param studentList รายชื่อนักเรียน
 * @param attendanceHistory ประวัติการเช็กชื่อในเทอม 2
 * @param courseHours จำนวนชั่วโมงเรียนรวมตลอดปี (เช่น 80 ชม. หรือ 40 ชม.)
 * @param term1Baselines ข้อมูลเวลาเรียนจากคลังคะแนนเทอม 1 (Baseline Vault)
 */
export function calculateAttendanceSummaries(
  studentList: { id: string; studentCode?: string; name: string; number: number; room?: string }[],
  attendanceHistory: {
    date: string;
    records: { [studentId: string]: AttendanceStatus };
  }[],
  courseHours: number = 80,
  term1Baselines?: {
    [studentId: string]: {
      attendedPeriods?: number | null;
      totalPeriods?: number | null;
    };
  }
): StudentAttendanceSummary[] {
  // เกณฑ์ สพฐ.: ขาดได้ไม่เกินร้อยละ 20 ของเวลาเรียนรวมตลอดหลักสูตร
  const maxAllowedAbsence = Math.max(1, Math.floor(courseHours * 0.20));

  return studentList.map(student => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let late = 0;
    let activity = 0;
    let consecutiveAbsent = 0;
    let currentStreak = 0;

    // เรียงตามวันที่เพื่อคำนวณการขาดติดต่อกัน
    const sortedHistory = [...attendanceHistory].sort((a, b) => a.date.localeCompare(b.date));

    sortedHistory.forEach(day => {
      const status = day.records[student.id];
      if (!status) return;

      if (status === "present") {
        present++;
        currentStreak = 0;
      } else if (status === "absent") {
        absent++;
        currentStreak++;
        if (currentStreak > consecutiveAbsent) consecutiveAbsent = currentStreak;
      } else if (status === "leave") {
        leave++;
        currentStreak = 0;
      } else if (status === "late") {
        late++;
        currentStreak = 0;
      } else if (status === "activity") {
        activity++;
        currentStreak = 0;
      }
    });

    const term2Attended = present + leave + activity + late;
    const term2Total = present + absent + leave + late + activity;
    const term2Percent = term2Total > 0 ? Math.round((term2Attended / term2Total) * 100) : 100;

    // ตรวจสอบและดึงข้อมูลเวลาเรียนทุนเดิมเทอม 1
    const t1Baseline = term1Baselines?.[student.id];
    const hasT1 = t1Baseline && typeof t1Baseline.attendedPeriods === "number" && !isNaN(t1Baseline.attendedPeriods);
    const t1Attended = hasT1 ? Number(t1Baseline.attendedPeriods) : null;
    const t1Total = hasT1 ? Number(t1Baseline.totalPeriods || Math.floor(courseHours / 2)) : null;
    const t1Percent = (hasT1 && t1Total && t1Total > 0) ? Math.round((t1Attended! / t1Total) * 100) : null;

    // คำนวณสะสมรวม 2 เทอม
    const cumulativeAttended = (t1Attended || 0) + term2Attended;
    const cumulativeTotal = (t1Total || 0) + term2Total;

    // คำนวณเปอร์เซ็นต์เวลาเรียนสะสม
    let attendancePercent = 100;
    if (cumulativeTotal > 0) {
      attendancePercent = Math.round((cumulativeAttended / cumulativeTotal) * 100);
    } else if (term2Total > 0) {
      attendancePercent = Math.round((term2Attended / term2Total) * 100);
    }

    // คำนวณจำนวนคาบที่ขาดสะสมตลอดปี
    const t1Absent = (hasT1 && t1Total && t1Attended !== null) ? Math.max(0, t1Total - t1Attended) : 0;
    const totalAbsentAcrossYear = t1Absent + absent;

    // เกณฑ์ สพฐ.: ม.ส. คือขาดเรียนเกินโควตาร้อยละ 20 ของเวลาเรียนรวมตลอดรายวิชา
    const isMS = totalAbsentAcrossYear > maxAllowedAbsence;

    // กลุ่มเสี่ยง (Risk Radar):
    // 1. ติด ม.ส. แล้ว
    // 2. สถิติเทอม 1 หลุดต่ำกว่า 80% (เช่น สายชล 75.6%, นันทกานต์ 79.5%)
    // 3. เวลาเรียนสะสมต่ำกว่า 80% หรืออยู่ในช่วงเฝ้าระวัง 80-84%
    // 4. ขาดเรียนต่อเนื่องในเทอม 2 ตั้งแต่ 2 คาบขึ้นไป
    // 5. โควตาขาดที่เหลือตลอดปีเหลือไม่เกิน 2 คาบ
    const isTerm1Under80 = t1Percent !== null && t1Percent < 80;
    const isRisk = isMS || 
      isTerm1Under80 || 
      attendancePercent < 80 || 
      currentStreak >= 2 || 
      (totalAbsentAcrossYear >= maxAllowedAbsence - 2 && totalAbsentAcrossYear > 0) ||
      (attendancePercent >= 80 && attendancePercent <= 84);

    const remainingAllowedAbsences = Math.max(0, maxAllowedAbsence - totalAbsentAcrossYear);

    return {
      studentId: student.id,
      studentCode: student.studentCode || student.id,
      name: student.name,
      number: student.number,
      room: student.room,
      present,
      absent,
      leave,
      late,
      activity,
      totalPeriods: cumulativeTotal > 0 ? cumulativeTotal : term2Total,
      attendedPeriods: cumulativeTotal > 0 ? cumulativeAttended : term2Attended,
      attendancePercent,
      isMS,
      consecutiveAbsent: currentStreak,
      isRisk,
      remainingAllowedAbsences,
      term1Attended: t1Attended,
      term1Total: t1Total,
      term1Percent: t1Percent,
      term2Attended,
      term2Total,
      term2Percent,
      cumulativeAttended,
      cumulativeTotal,
      cumulativePercent: attendancePercent
    };
  });
}
