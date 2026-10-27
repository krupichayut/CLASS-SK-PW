/**
 * Calculation Engine สำหรับ Classroom Management & ปพ.5
 * อ้างอิงเกณฑ์กระทรวงศึกษาธิการ / สพฐ.
 */

export interface ScoreEntry {
  activityId: string;
  rawScore: number | null | undefined;
}

export interface ActivityConfig {
  id: string;
  maxScore: number; // คะแนนเต็ม
  weightScore: number; // น้ำหนักคะแนน
}

export interface ScoreColumn {
  id: string;
  name: string; // เช่น "ใบงานสีน้ำ", "สอบกลางภาค"
  type: "collected" | "midterm" | "final"; // เก็บระหว่างภาค, กลางภาค, ปลายภาค
  unitName?: string;
  maxScore: number; // คะแนนเต็มดิบ เช่น 10, 20
  weight: number; // น้ำหนักคะแนน เช่น 10, 20
  term: "1" | "2" | "all"; // ภาคเรียน
}

export const GRADE_SCALE = ["4", "3.5", "3", "2.5", "2", "1.5", "1", "0"] as const;

/**
 * ปัดเศษตามกฎที่ตั้งค่าไว้
 */
export function roundScore(value: number, precision: number = 0): number {
  if (isNaN(value)) return 0;
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * แปลงคะแนนดิบเป็นคะแนนตามน้ำหนัก
 */
export function calculateWeightedScore(rawScore: number, maxScore: number, weightScore: number): number {
  if (maxScore <= 0 || rawScore <= 0) return 0;
  return (rawScore / maxScore) * weightScore;
}

/**
 * คำนวณคะแนนรวมของนักเรียนคนหนึ่งจากหลายกิจกรรม
 */
export function calculateTotalScore(
  studentScores: ScoreEntry[],
  activities: { id: string; maxScore: number; weightScore?: number; weight?: number }[],
  roundFinalResult: boolean = true
): number {
  let total = 0;

  for (const activity of activities) {
    const studentScore = studentScores.find(s => s.activityId === activity.id);
    const weight = activity.weightScore !== undefined ? activity.weightScore : (activity.weight || activity.maxScore);
    if (studentScore && studentScore.rawScore !== null && studentScore.rawScore !== undefined && studentScore.rawScore > 0) {
      total += calculateWeightedScore(studentScore.rawScore, activity.maxScore, weight);
    }
  }

  return roundFinalResult ? roundScore(total, 0) : total;
}

/**
 * ตัดเกรด (ผลการเรียน 8 ระดับ พร้อมรองรับสถานะ ร และ ม.ส.)
 * @param totalScore คะแนนรวม
 * @param options เงื่อนไขเสริม เช่น ขาดสอบ (ร) หรือ เวลาเรียนต่ำกว่า 80% (มส)
 */
export function calculateGrade(
  totalScore: number, 
  options?: { attendancePercent?: number; hasMissingWork?: boolean; isExamAbsent?: boolean }
): string {
  // 1. ตรวจสอบเงื่อนไข ม.ส. (เวลาเรียนไม่ถึง 80%)
  if (options?.attendancePercent !== undefined && options.attendancePercent < 80) {
    return "มส";
  }

  // 2. ตรวจสอบเงื่อนไข ร (ค้างส่งงานสำคัญ หรือขาดสอบ)
  if (options?.isExamAbsent || options?.hasMissingWork) {
    return "ร";
  }

  // 3. ตัดเกรดมาตรฐาน 8 ระดับ (0 - 4)
  const score = Math.round(totalScore);
  if (score >= 80) return "4";
  if (score >= 75) return "3.5";
  if (score >= 70) return "3";
  if (score >= 65) return "2.5";
  if (score >= 60) return "2";
  if (score >= 55) return "1.5";
  if (score >= 50) return "1";
  return "0";
}

/**
 * คำนวณการกระจายของเกรด (Grade Distribution Summary) สำหรับ Recharts
 */
export function calculateGradeDistribution(
  grades: string[]
): { grade: string; count: number; percentage: number }[] {
  const allPossibleGrades = ["4", "3.5", "3", "2.5", "2", "1.5", "1", "0", "ร", "ม.ส."];
  const total = grades.length;

  const counts: { [key: string]: number } = {};
  allPossibleGrades.forEach(g => counts[g] = 0);

  grades.forEach(g => {
    const normalized = g === "มส" ? "ม.ส." : g;
    if (counts[normalized] !== undefined) {
      counts[normalized]++;
    } else {
      counts[normalized] = 1;
    }
  });

  return allPossibleGrades.map(grade => ({
    grade,
    count: counts[grade] || 0,
    percentage: total > 0 ? Math.round(((counts[grade] || 0) / total) * 100) : 0,
  }));
}
