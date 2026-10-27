import { NextResponse } from "next/server";
import { getTerm1Vault, getAllStudents } from "@/lib/firebase/services";
import { calculateAttendanceSummaries } from "@/lib/calculations/attendance";
import { calculateContinuityMetrics } from "@/lib/calculations/continuity";

export async function GET() {
  try {
    const results: Record<string, any> = {};

    const classrooms = [
      { room: "ป.3", socSub: "sub_soc_13101", hisSub: "sub_his_13102", expectedCount: 8 },
      { room: "ป.4", socSub: "sub_soc_14101", hisSub: "sub_his_14102", expectedCount: 14 },
      { room: "ป.5", socSub: "sub_soc_15101", hisSub: "sub_his_15102", expectedCount: 9 },
      { room: "ป.6", socSub: "sub_soc_16101", hisSub: "sub_his_16102", expectedCount: 6 },
    ];

    const allStudents = await getAllStudents();

    for (const c of classrooms) {
      const roomStudents = allStudents.filter(s => s.room === c.room);
      const socVault = await getTerm1Vault(c.room, c.socSub);
      const hisVault = await getTerm1Vault(c.room, c.hisSub);

      const socSummaries = calculateAttendanceSummaries(
        roomStudents,
        [],
        80,
        socVault?.students
      );

      const continuitySamples = roomStudents.map(st => {
        const t1Score = socVault?.students?.[st.id]?.score ?? null;
        const metrics = calculateContinuityMetrics(t1Score, null, 50, 50);
        return {
          studentId: st.id,
          number: st.number,
          name: st.name,
          socScoreT1: t1Score,
          socAttendedT1: socVault?.students?.[st.id]?.attendedPeriods,
          socTotalT1: socVault?.students?.[st.id]?.totalPeriods,
          targetGapGrade3: metrics.targetGapGrade3,
          targetGapGrade4: metrics.targetGapGrade4,
          statusLabel: metrics.statusLabel
        };
      });

      const atRiskStudents = socSummaries.filter(s => s.isRisk || s.isMS).map(s => ({
        id: s.studentId,
        name: s.name,
        attendancePercent: s.attendancePercent,
        term1Attended: s.term1Attended,
        term1Total: s.term1Total,
        isRisk: s.isRisk
      }));

      results[c.room] = {
        studentCount: roomStudents.length,
        socVaultLocked: socVault?.isLocked,
        hisVaultLocked: hisVault?.isLocked,
        socStudentKeysInVault: Object.keys(socVault?.students || {}).length,
        hisStudentKeysInVault: Object.keys(hisVault?.students || {}).length,
        atRiskCount: atRiskStudents.length,
        atRiskStudents,
        continuitySamples
      };
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
