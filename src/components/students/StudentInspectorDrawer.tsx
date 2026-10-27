"use client";

import { useState } from "react";
import { 
  X, 
  Copy, 
  Check, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  AlertTriangle, 
  UserCheck, 
  Share2,
  Sparkles,
  Compass
} from "lucide-react";
import { StudentAttendanceSummary, AttendanceStatus } from "@/lib/calculations/attendance";
import { AttendanceHistoryDoc } from "@/lib/firebase/services";
import { OrbitalAttendanceGauge } from "@/components/ui/OrbitalAttendanceGauge";

interface StudentInspectorDrawerProps {
  isOpen?: boolean;
  onClose: () => void;
  studentSummary: StudentAttendanceSummary | null;
  history: AttendanceHistoryDoc[];
  currentAttendance?: AttendanceStatus;
  onStatusChange?: (studentId: string, status: AttendanceStatus) => void;
  courseHours?: number; // total periods in academic year
}

export function StudentInspectorDrawer({
  isOpen = true,
  onClose,
  studentSummary,
  history,
  currentAttendance,
  onStatusChange,
  courseHours = 80
}: StudentInspectorDrawerProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen || !studentSummary) return null;

  // Filter history for this student
  const studentHistory = history.filter(h => h.records && h.records[studentSummary.studentId]);

  // Generate LINE Parent Notification Message
  const handleCopyParentAlert = () => {
    const text = [
      `📢 [แจ้งเตือนเวลาเรียน] โรงเรียน`,
      `เรียน ผู้ปกครองของ ${studentSummary.name} (เลขที่ ${studentSummary.number})`,
      `ประจำชั้นประถมศึกษาปีที่ ${studentSummary.room || "ป.6"}`,
      `------------------------`,
      `📊 สถิติเวลาเรียนสะสมปัจจุบัน:`,
      `• เวลาเรียนรวม 2 ภาคเรียน: ${studentSummary.attendancePercent}% (${studentSummary.attendedPeriods}/${studentSummary.totalPeriods} ชม.)`,
      studentSummary.term1Attended !== null && studentSummary.term1Attended !== undefined
        ? `• ทุนเวลาเรียนเทอม 1: ${studentSummary.term1Attended}/${studentSummary.term1Total} ชม. (${studentSummary.term1Percent}%)`
        : "",
      `• สถิติขาดเรียน (เทอม 2): ${studentSummary.absent} คาบ`,
      `• สถิติลากิจ/ป่วย: ${studentSummary.leave} คาบ`,
      `• สถิติมาสาย: ${studentSummary.late} คาบ`,
      studentSummary.isMS 
        ? `⚠️ แจ้งเตือนด่วน: นักเรียนมีเวลาเรียนต่ำกว่าเกณฑ์ 80% (เข้าข่าย ม.ส.) ขอความกรุณาติดต่อครูประจำชั้นโดยด่วน`
        : studentSummary.isRisk 
        ? `⚠️ เฝ้าระวัง: เวลาเรียนเริ่มใกล้เกณฑ์ขั้นต่ำ 80% (สามารถขาดได้อีกไม่เกิน ${studentSummary.remainingAllowedAbsences} คาบ)`
        : `✅ เวลาเรียนอยู่ในเกณฑ์ปกติเรียบร้อยดี`,
      `------------------------`,
      `บันทึกโดย: ระบบบริหารจัดการชั้นเรียน (Atelier OS)`
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-md animate-in fade-in duration-200 flex justify-end">
      <div 
        className="w-full max-w-md bg-slate-900/95 backdrop-blur-2xl h-full shadow-2xl border-l border-white/10 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Drawer */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-800 text-cyan-300 flex items-center justify-center font-mono font-black text-base border border-white/10 shadow-lg shadow-cyan-500/10">
                {String(studentSummary.number).padStart(2, "0")}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-100 leading-tight">
                  {studentSummary.name}
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  รหัส #{studentSummary.studentCode} • ชั้น {studentSummary.room || "ป.6"}
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Today's Status Selector */}
          {onStatusChange && (
            <div className="mb-5 p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block font-bold">
                TACTILE SWITCH • สลับสถานะคาบนี้
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(["present", "absent", "leave", "late"] as AttendanceStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => onStatusChange(studentSummary.studentId, st)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                      currentAttendance === st
                        ? st === "present"
                          ? "bg-emerald-500 text-slate-950 shadow-[0_0_14px_rgba(16,185,129,0.5)] font-black scale-[1.02]"
                          : st === "absent"
                          ? "bg-rose-500 text-white shadow-[0_0_14px_rgba(244,63,94,0.5)] font-black scale-[1.02]"
                          : st === "leave"
                          ? "bg-amber-500 text-slate-950 shadow-[0_0_14px_rgba(245,158,11,0.5)] font-black scale-[1.02]"
                          : "bg-orange-500 text-slate-950 shadow-[0_0_14px_rgba(251,146,60,0.5)] font-black scale-[1.02]"
                        : "bg-white/5 text-slate-300 border border-white/5 hover:bg-white/10"
                    }`}
                  >
                    {st === "present" ? "มาเรียน" : st === "absent" ? "ขาด" : st === "leave" ? "ลา" : "สาย"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Concentric Orbital Attendance Gauge */}
          <div className="p-5 rounded-3xl bg-slate-950/70 border border-white/10 shadow-sm mb-5 flex flex-col items-center justify-center">
            <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-400/80 mb-3">
              CONCENTRIC HORIZON GAUGE (เกณฑ์ 80%)
            </span>

            <OrbitalAttendanceGauge
              percent={studentSummary.attendancePercent}
              size={130}
              strokeWidth={9}
              isMS={studentSummary.isMS}
              isRisk={studentSummary.isRisk}
              remainingQuota={studentSummary.remainingAllowedAbsences}
            />

            <div className="mt-4 pt-3 w-full border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>เข้าเรียนสะสมรวม 2 เทอม:</span>
              <span className="font-bold text-slate-100">
                {studentSummary.attendedPeriods} / {studentSummary.totalPeriods} ชม.
              </span>
            </div>

            {studentSummary.term1Attended !== null && studentSummary.term1Attended !== undefined && (
              <div className="mt-2 pt-2 w-full border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-indigo-300">
                <span>ทุนเดิมเทอม 1:</span>
                <span className="font-bold">
                  {studentSummary.term1Attended} / {studentSummary.term1Total} ชม. ({studentSummary.term1Percent}%)
                </span>
              </div>
            )}
          </div>

          {/* Breakdown Stats Grid */}
          <div className="grid grid-cols-4 gap-2 text-center mb-5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] text-emerald-400/80 font-bold block">มาเรียน</span>
              <span className="text-sm font-mono font-black text-emerald-400">{studentSummary.present}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] text-rose-400/80 font-bold block">ขาด</span>
              <span className="text-sm font-mono font-black text-rose-400">{studentSummary.absent}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] text-amber-400/80 font-bold block">ลา</span>
              <span className="text-sm font-mono font-black text-amber-400">{studentSummary.leave}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20">
              <span className="text-[10px] text-orange-400/80 font-bold block">สาย</span>
              <span className="text-sm font-mono font-black text-orange-400">{studentSummary.late}</span>
            </div>
          </div>

          {/* Past History Timeline */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                TIMELINE ARCHIVE ({studentHistory.length} คาบ)
              </span>
            </h4>

            {studentHistory.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center font-mono">ยังไม่มีประวัติในคลัง Cloud</p>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {studentHistory.map((h) => {
                  const st = h.records[studentSummary.studentId];
                  return (
                    <div 
                      key={h.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 text-xs border border-white/5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 font-mono text-[11px]">{h.date}</span>
                        <span className="text-slate-500 text-[10px]">
                          ({h.period === "period-1" ? "คาบ 1" : h.period === "period-2" ? "คาบ 2" : h.period === "period-3" ? "คาบ 3" : "โฮมรูม"})
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        st === "present" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                        st === "absent" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                        st === "leave" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                        "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                      }`}>
                        {st === "present" ? "มาเรียน" : st === "absent" ? "ขาด" : st === "leave" ? "ลา" : "สาย"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/10 mt-6 space-y-2">
          <button
            type="button"
            onClick={handleCopyParentAlert}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {copySuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4 text-cyan-200" />}
            <span>{copySuccess ? "คัดลอกข้อความสำเร็จแล้ว!" : "คัดลอกข้อความแจ้งผู้ปกครองทาง LINE"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 rounded-2xl text-slate-400 hover:text-white font-bold text-xs transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
