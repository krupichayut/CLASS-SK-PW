"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Check, 
  X, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  Lock, 
  Unlock, 
  ChevronRight,
  User,
  Share2,
  TrendingUp,
  Award
} from "lucide-react";
import { StudentRecord } from "@/lib/firebase/services";
import { AttendanceStatus, StudentAttendanceSummary } from "@/lib/calculations/attendance";
import { calculateContinuityMetrics } from "@/lib/calculations/continuity";

export type CockpitLens = "checkin" | "continuity" | "profile";

interface DualEpochStudentNodeProps {
  index: number;
  student: StudentRecord;
  activeLens: CockpitLens;
  
  // Lens 1: Check-in props
  currentStatus?: AttendanceStatus;
  attendanceSummary?: StudentAttendanceSummary | null;
  onStatusChange?: (studentId: string, status: AttendanceStatus) => void;
  
  // Lens 2: 50:50 Continuity props
  term1Score: number | null;
  term2Score?: number | null;
  isVaultLocked?: boolean;
  onUpdateTerm1Score?: (studentId: string, studentCode: string, score: number | null) => void;
  
  // Lens 3 & Inspector
  onOpenInspector?: (studentId: string) => void;
  onShareLineAlert?: (student: StudentRecord) => void;
}

const STATUS_PILLS: { 
  id: AttendanceStatus; 
  label: string; 
  activeBg: string; 
  glowDot: string;
}[] = [
  { 
    id: "present", 
    label: "มา", 
    activeBg: "bg-emerald-500 text-slate-950 font-black shadow-[0_0_16px_rgba(16,185,129,0.5)] border-emerald-400",
    glowDot: "bg-emerald-400"
  },
  { 
    id: "absent", 
    label: "ขาด", 
    activeBg: "bg-rose-500 text-white font-black shadow-[0_0_16px_rgba(244,63,94,0.5)] border-rose-400",
    glowDot: "bg-rose-400"
  },
  { 
    id: "leave", 
    label: "ลา", 
    activeBg: "bg-amber-500 text-slate-950 font-black shadow-[0_0_16px_rgba(245,158,11,0.5)] border-amber-400",
    glowDot: "bg-amber-400"
  },
  { 
    id: "late", 
    label: "สาย", 
    activeBg: "bg-orange-500 text-slate-950 font-black shadow-[0_0_16px_rgba(251,146,60,0.5)] border-orange-400",
    glowDot: "bg-orange-400"
  },
  { 
    id: "activity", 
    label: "กิจ", 
    activeBg: "bg-cyan-500 text-slate-950 font-black shadow-[0_0_16px_rgba(6,182,212,0.5)] border-cyan-400",
    glowDot: "bg-cyan-400"
  }
];

export function DualEpochStudentNode({
  index,
  student,
  activeLens = "checkin",
  currentStatus = "present",
  attendanceSummary,
  onStatusChange,
  term1Score,
  term2Score = null,
  isVaultLocked = false,
  onUpdateTerm1Score,
  onOpenInspector,
  onShareLineAlert
}: DualEpochStudentNodeProps) {
  // Input editing state for Fast Keyboard Entry
  const [localTerm1Input, setLocalTerm1Input] = useState<string>(
    term1Score !== null && term1Score !== undefined ? String(term1Score) : ""
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync prop updates if not actively editing
  useEffect(() => {
    setLocalTerm1Input(term1Score !== null && term1Score !== undefined ? String(term1Score) : "");
  }, [term1Score]);

  // Attendance metrics
  const attendanceRate = attendanceSummary ? attendanceSummary.attendancePercent : 100;
  const isCriticalRisk = attendanceSummary ? attendanceSummary.isMS : attendanceRate < 80;
  const isWarningRisk = attendanceSummary ? (attendanceSummary.isRisk && !attendanceSummary.isMS) : (attendanceRate >= 80 && attendanceRate < 85);

  // 50:50 Continuity metrics
  const continuity = calculateContinuityMetrics(
    term1Score,
    term2Score,
    50,
    50,
    { attendancePercent: attendanceRate }
  );

  // Fast Keyboard Navigation handler (Enter / Tab / ArrowDown / ArrowUp)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab" || e.key === "ArrowDown") {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
      }
      // Commit value
      commitTerm1Score();

      // Shift focus to next student's input
      const nextInput = document.querySelector(
        `input[data-index="${index + 1}"][data-field="term1"]`
      ) as HTMLInputElement | null;

      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      commitTerm1Score();
      const prevInput = document.querySelector(
        `input[data-index="${index - 1}"][data-field="term1"]`
      ) as HTMLInputElement | null;

      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  const commitTerm1Score = () => {
    if (isVaultLocked || !onUpdateTerm1Score) return;
    const trimmed = localTerm1Input.trim();
    if (trimmed === "" || trimmed === "-") {
      onUpdateTerm1Score(student.id, student.studentCode, null);
    } else {
      const num = Number(trimmed);
      if (!isNaN(num)) {
        const clamped = Math.max(0, Math.min(50, num));
        onUpdateTerm1Score(student.id, student.studentCode, clamped);
        setLocalTerm1Input(String(clamped));
      }
    }
  };

  return (
    <div 
      className={`group relative rounded-2xl bg-slate-900/70 backdrop-blur-xl border transition-all duration-300 p-3.5 flex flex-col justify-between shadow-[0_8px_24px_rgba(0,0,0,0.4)] min-h-[225px] ${
        isCriticalRisk
          ? "border-rose-500/40 shadow-[0_0_24px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/30"
          : isWarningRisk
          ? "border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
          : "border-white/10 hover:border-cyan-500/40"
      }`}
    >
      {/* 1. Universal Top Header: Stable geometry across all lenses */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {/* Student Number Capsule */}
          <div className="w-9 h-9 rounded-xl bg-slate-800 text-cyan-300 font-mono font-black text-sm flex items-center justify-center border border-white/10 shadow-inner shrink-0 group-hover:border-cyan-400/40 group-hover:shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all">
            {String(student.number).padStart(2, "0")}
          </div>

          {/* Student Name & Code */}
          <div className="min-w-0">
            <h4 
              onClick={() => onOpenInspector?.(student.id)}
              className="text-sm font-bold text-slate-100 truncate cursor-pointer hover:text-cyan-300 transition-colors"
              title={student.name}
            >
              {student.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-slate-400">
                #{student.studentCode}
              </span>
              <span className="text-[10px] text-slate-500">
                {student.room || "ป.6"}
              </span>
            </div>
          </div>
        </div>

        {/* Top-Right Badge: Contextual to Risk or Status */}
        <div>
          {isCriticalRisk ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold animate-pulse">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              ม.ส.
            </span>
          ) : isWarningRisk ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
              เฝ้าระวัง
            </span>
          ) : (
            <span className="text-[10px] font-mono text-emerald-400/80 font-semibold">
              {attendanceRate}%
            </span>
          )}
        </div>
      </div>

      {/* 2. Middle Content Body (3 Lens Modes with Stable Height) */}
      <div className="my-2.5 flex-1 flex flex-col justify-center">

        {/* 🔍 LENS 1: Check-in & Live Class */}
        {activeLens === "checkin" && (
          <div className="space-y-2.5 animate-in fade-in duration-200">
            {/* 5 Segmented Quick-Select Pills (Min 38px touch hit area for iPad) */}
            <div className="grid grid-cols-5 gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/5">
              {STATUS_PILLS.map((pill) => {
                const isActive = currentStatus === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => onStatusChange?.(student.id, pill.id)}
                    className={`min-h-[38px] rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center relative active:scale-95 ${
                      isActive
                        ? pill.activeBg
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <span>{pill.label}</span>
                    {isActive && (
                      <span className={`w-1 h-1 rounded-full ${pill.glowDot} mt-0.5 animate-ping`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mini Attendance Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <span>เวลาเรียนสะสม</span>
                  {attendanceSummary?.term1Attended !== null && attendanceSummary?.term1Attended !== undefined && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-sans">
                      T1: {attendanceSummary.term1Attended}/{attendanceSummary.term1Total} ชม.
                    </span>
                  )}
                </span>
                <span className={`font-bold font-mono ${isCriticalRisk ? "text-rose-400" : isWarningRisk ? "text-amber-400" : "text-slate-200"}`}>
                  {attendanceSummary ? `${attendanceSummary.attendedPeriods}/${attendanceSummary.totalPeriods} ชม. (${attendanceRate}%)` : "ปกติ"}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCriticalRisk 
                      ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]" 
                      : isWarningRisk 
                      ? "bg-amber-400 shadow-[0_0_8px_#f59e0b]" 
                      : "bg-emerald-400 shadow-[0_0_8px_#10b981]"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, attendanceRate))}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 🔍 LENS 2: 50:50 Continuity & Scoring */}
        {activeLens === "continuity" && (
          <div className="space-y-2.5 animate-in fade-in duration-200">
            {/* 50:50 Split-Core Meter */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-2 rounded-xl border border-white/5">
              
              {/* Left Hemisphere: Term 1 Baseline Vault (จากครูเดิม) */}
              <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-slate-900/80 border border-white/5 relative group/vault">
                <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <span>ทุนเทอม 1</span>
                  {isVaultLocked ? (
                    <span title="ล็อกคะแนนเทอม 1 แล้ว"><Lock className="w-2.5 h-2.5 text-amber-400" /></span>
                  ) : (
                    <span title="ปลดล็อก: กรอกคะแนนได้"><Unlock className="w-2.5 h-2.5 text-cyan-400" /></span>
                  )}
                </div>

                <div className="flex items-center justify-center mt-1">
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    data-index={index}
                    data-field="term1"
                    disabled={isVaultLocked}
                    value={localTerm1Input}
                    placeholder="-"
                    onChange={(e) => setLocalTerm1Input(e.target.value)}
                    onBlur={commitTerm1Score}
                    onKeyDown={handleKeyDown}
                    className="w-12 text-center text-base font-black font-mono bg-transparent border-b border-cyan-500/40 text-cyan-300 outline-none focus:border-cyan-400 focus:bg-cyan-500/10 rounded transition-colors disabled:opacity-80 disabled:border-transparent cursor-text"
                    title={isVaultLocked ? "คลังคะแนนถูกล็อก คลิกปลดล็อกที่แถบด้านบนเพื่อแก้ไข" : "พิมพ์คะแนนแล้วกด Enter หรือ Tab เพื่อเลื่อนไปคนถัดไป"}
                  />
                  <span className="text-[10px] font-mono text-slate-500 ml-0.5">/50</span>
                </div>
              </div>

              {/* Right Hemisphere: Term 2 Runway (รันเวย์สอนจริง) */}
              <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-slate-900/80 border border-white/5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300">
                  เก็บเทอม 2
                </span>
                <div className="flex items-center justify-center mt-1">
                  <span className="text-base font-black font-mono text-indigo-200">
                    {continuity.term2Score !== null ? continuity.term2Score : "-"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 ml-0.5">/50</span>
                </div>
              </div>
            </div>

            {/* Target Gap & Projected Grade Telemetry */}
            <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-slate-950/60 border border-white/5 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-[10px] font-medium text-slate-300 truncate max-w-[130px]" title={continuity.statusLabel}>
                  {continuity.statusLabel}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {continuity.term1Score !== null && (
                  <span 
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                    title={`เป้าหมายเทอม 2: ต้องการอีก ${continuity.targetGapGrade3} แต้มเพื่อแตะเกรด 3 / อีก ${continuity.targetGapGrade4} แต้มเพื่อแตะเกรด 4`}
                  >
                    G3:-{continuity.targetGapGrade3} | G4:-{continuity.targetGapGrade4}
                  </span>
                )}
                <span className={`font-mono font-black text-xs px-1.5 py-0.5 rounded-md ${
                  continuity.hasGrade4
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : continuity.isPassing
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-slate-800 text-slate-400 border border-white/10"
                }`}>
                  {continuity.projectedGrade !== "-" ? `เกรด ${continuity.projectedGrade}` : "-"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 🔍 LENS 3: Student Profile & History */}
        {activeLens === "profile" && (
          <div className="space-y-2.5 animate-in fade-in duration-200">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">ทุนเทอม 1:</span>
                <span className="font-bold text-cyan-300">{continuity.term1Score !== null ? `${continuity.term1Score}/50` : "-"}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">เก็บเทอม 2:</span>
                <span className="font-bold text-indigo-300">{continuity.term2Score !== null ? `${continuity.term2Score}/50` : "-"}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono border-t border-white/5 pt-1">
                <span className="text-slate-300 font-bold">รวมสะสม:</span>
                <span className="font-black text-white">{continuity.totalScore !== null ? `${continuity.totalScore}/100` : "-"}</span>
              </div>
              {continuity.term1Score !== null && (
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
                  <span>เป้าหมาย T2:</span>
                  <span className="text-indigo-300 font-bold">
                    เกรด 3 (-{continuity.targetGapGrade3}) • เกรด 4 (-{continuity.targetGapGrade4})
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onShareLineAlert?.(student)}
                className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 border border-white/5 transition-all"
                title="คัดลอกข้อความสรุปรายบุคคลเพื่อแจ้งทาง LINE"
              >
                <Share2 className="w-3 h-3 text-cyan-400" />
                <span>แจ้ง LINE</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenInspector?.(student.id)}
                className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-[11px] font-bold flex items-center justify-center gap-1 border border-indigo-500/30 transition-all"
              >
                <User className="w-3 h-3" />
                <span>ประวัติเต็ม</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 3. Universal Bottom Ribbon: Footer Info with Inspector Trigger */}
      <div 
        onClick={() => onOpenInspector?.(student.id)}
        className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer transition-colors"
      >
        <span className="truncate">
          {activeLens === "checkin" ? (
            <span>สถานะ: <strong className="text-slate-300">{currentStatus === "present" ? "มาเรียน" : currentStatus === "absent" ? "ขาดเรียน" : currentStatus === "leave" ? "ลากิจ/ป่วย" : currentStatus === "late" ? "มาสาย" : "กิจกรรม"}</strong></span>
          ) : activeLens === "continuity" ? (
            <span>รวมปัจจุบัน: <strong className="text-cyan-300">{continuity.totalScore !== null ? `${continuity.totalScore} แต้ม` : "-"}</strong></span>
          ) : (
            <span>คลิกดู Dossier รายบุคคล</span>
          )}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}
