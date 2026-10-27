/**
 * 50:50 Dual-Term Continuity & Target Gap Calculation Engine
 * สำหรับภารกิจการรับช่วงต่อ (Mid-Year Relay) ของครูในเทอม 2
 * อ้างอิงเกณฑ์กระทรวงศึกษาธิการ / สพฐ.
 */

import { calculateGrade } from "./engine";

export interface ContinuityMetrics {
  term1Score: number | null;
  term2Score: number | null;
  totalScore: number | null;
  maxTotal: number;
  projectedGrade: string; // "4", "3.5", ... "0", or "-"
  targetGapPass: number;  // คะแนนที่ยังขาดเพื่อผ่านเกณฑ์ 50
  targetGapGrade3: number;// คะแนนที่ยังขาดเพื่อได้เกรด 3 (70)
  targetGapGrade4: number;// คะแนนที่ยังขาดเพื่อได้เกรด 4 (80)
  isPassing: boolean;
  hasGrade3: boolean;
  hasGrade4: boolean;
  statusLabel: string;
}

export function calculateContinuityMetrics(
  term1Score: number | null | undefined,
  term2Score: number | null | undefined,
  maxTerm1: number = 50,
  maxTerm2: number = 50,
  options?: { attendancePercent?: number }
): ContinuityMetrics {
  const t1 = typeof term1Score === "number" && !isNaN(term1Score) ? term1Score : null;
  const t2 = typeof term2Score === "number" && !isNaN(term2Score) ? term2Score : null;
  const maxTotal = maxTerm1 + maxTerm2;

  // Zero-Mock Rule: When neither term has a score recorded, display "-"
  if (t1 === null && t2 === null) {
    return {
      term1Score: null,
      term2Score: null,
      totalScore: null,
      maxTotal,
      projectedGrade: "-",
      targetGapPass: 50,
      targetGapGrade3: 70,
      targetGapGrade4: 80,
      isPassing: false,
      hasGrade3: false,
      hasGrade4: false,
      statusLabel: "ยังไม่มีคะแนนสะสม (-)"
    };
  }

  const currentTotal = (t1 || 0) + (t2 || 0);
  const targetGapPass = Math.max(0, 50 - currentTotal);
  const targetGapGrade3 = Math.max(0, 70 - currentTotal);
  const targetGapGrade4 = Math.max(0, 80 - currentTotal);
  const isPassing = currentTotal >= 50;
  const hasGrade3 = currentTotal >= 70;
  const hasGrade4 = currentTotal >= 80;

  // Grade projection using standard OBEC scale
  const grade = calculateGrade(currentTotal, options);

  let statusLabel = "";
  if (hasGrade4) {
    statusLabel = "การันตีเกรด 4 แล้ว 🎉";
  } else if (hasGrade3) {
    statusLabel = `แตะเกรด 3 แล้ว (ต้องการอีก ${targetGapGrade4} แต้มสู่เกรด 4)`;
  } else if (t2 === null) {
    // Term 2 is not yet scored (Relay stage with Term 1 capital)
    statusLabel = `เป้าหมาย: อีก ${targetGapGrade3} แต้ม (เกรด 3) / ${targetGapGrade4} แต้ม (เกรด 4)`;
  } else if (isPassing) {
    statusLabel = `ผ่านเกณฑ์แล้ว (อีก ${targetGapGrade3} แต้มเกรด 3 / ${targetGapGrade4} แต้มเกรด 4)`;
  } else {
    statusLabel = `ต้องการอีก ${targetGapPass} แต้มเพื่อผ่าน (เกรด 3 ขาด ${targetGapGrade3} แต้ม)`;
  }

  return {
    term1Score: t1,
    term2Score: t2,
    totalScore: currentTotal,
    maxTotal,
    projectedGrade: grade,
    targetGapPass,
    targetGapGrade3,
    targetGapGrade4,
    isPassing,
    hasGrade3,
    hasGrade4,
    statusLabel
  };
}
