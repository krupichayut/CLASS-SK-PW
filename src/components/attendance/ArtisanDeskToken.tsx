"use client";

import React from "react";
import { StudentRecord } from "@/lib/firebase/services";
import { AttendanceStatus, StudentAttendanceSummary } from "@/lib/calculations/attendance";
import { ShieldAlert, AlertTriangle, ChevronRight, User } from "lucide-react";

interface ArtisanDeskTokenProps {
  student: StudentRecord;
  currentStatus: AttendanceStatus;
  summary?: StudentAttendanceSummary;
  onStatusChange: (status: AttendanceStatus) => void;
  onOpenInspector: () => void;
}

interface StatusConfig {
  id: AttendanceStatus;
  label: string;
  shortLabel: string;
  activeBg: string;
  glowClass: string;
  dotColor: string;
}

const STATUS_CONFIGS: StatusConfig[] = [
  {
    id: "present",
    label: "มา",
    shortLabel: "มา",
    activeBg: "bg-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.5)] border-emerald-400",
    glowClass: "hover:border-emerald-500/40",
    dotColor: "bg-emerald-400"
  },
  {
    id: "absent",
    label: "ขาด",
    shortLabel: "ขาด",
    activeBg: "bg-rose-500 text-white shadow-[0_0_16px_rgba(244,63,94,0.55)] border-rose-400",
    glowClass: "hover:border-rose-500/40",
    dotColor: "bg-rose-400"
  },
  {
    id: "leave",
    label: "ลา",
    shortLabel: "ลา",
    activeBg: "bg-amber-500 text-slate-950 font-bold shadow-[0_0_16px_rgba(245,158,11,0.5)] border-amber-300",
    glowClass: "hover:border-amber-500/40",
    dotColor: "bg-amber-400"
  },
  {
    id: "late",
    label: "สาย",
    shortLabel: "สาย",
    activeBg: "bg-orange-500 text-white shadow-[0_0_16px_rgba(251,146,60,0.5)] border-orange-400",
    glowClass: "hover:border-orange-500/40",
    dotColor: "bg-orange-400"
  },
  {
    id: "activity",
    label: "กิจ",
    shortLabel: "กิจ",
    activeBg: "bg-purple-500 text-white shadow-[0_0_16px_rgba(168,85,247,0.5)] border-purple-400",
    glowClass: "hover:border-purple-500/40",
    dotColor: "bg-purple-400"
  }
];

export function ArtisanDeskToken({
  student,
  currentStatus = "present",
  summary,
  onStatusChange,
  onOpenInspector
}: ArtisanDeskTokenProps) {
  const attendanceRate = summary ? summary.attendancePercent : 100;
  const isCriticalRisk = summary ? summary.isMS : attendanceRate < 80;
  const isWarningRisk = summary ? (summary.isRisk && !summary.isMS) : (attendanceRate >= 80 && attendanceRate < 85);

  // Mini Bar color based on accumulated percentage
  const barColor = isCriticalRisk 
    ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]" 
    : isWarningRisk 
    ? "bg-amber-400 shadow-[0_0_8px_#f59e0b]" 
    : "bg-emerald-400 shadow-[0_0_8px_#10b981]";

  return (
    <div 
      className={`group relative rounded-2xl bg-slate-900/60 backdrop-blur-xl border transition-all duration-300 p-3.5 flex flex-col justify-between gap-3 shadow-[0_8px_24px_rgba(0,0,0,0.4)] ${
        isCriticalRisk
          ? "border-rose-500/40 shadow-[0_0_24px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/30"
          : isWarningRisk
          ? "border-amber-500/30"
          : "border-white/10 hover:border-indigo-500/40"
      }`}
    >
      {/* Top Header: Desk Number + Smart Risk Radar Badge + Inspector Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Desk Number Pill */}
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-400/30 text-indigo-300">
            #{String(student.number).padStart(2, "0")}
          </span>

          {/* Smart Risk Radar Badge */}
          {isCriticalRisk && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[10px] font-bold animate-pulse">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>เสี่ยง ม.ส. ({attendanceRate}%)</span>
            </span>
          )}

          {isWarningRisk && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>เฝ้าระวัง ({attendanceRate}%)</span>
            </span>
          )}
        </div>

        {/* 360° Inspector Trigger Button */}
        <button
          type="button"
          onClick={onOpenInspector}
          className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-colors"
          title="ดูประวัติ 360° รายบุคคล"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Middle: Student Identity & Mini Attendance Bar */}
      <div>
        <div 
          onClick={onOpenInspector}
          className="cursor-pointer group/name"
        >
          <h3 className="text-sm sm:text-base font-bold text-slate-100 group-hover/name:text-cyan-300 transition-colors line-clamp-1">
            {student.name}
          </h3>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
            รหัส {student.studentCode || student.id}
          </p>
        </div>

        {/* Mini Attendance Progress Bar */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
            <span className="text-slate-400">เวลาเรียนสะสม</span>
            <span className={`font-bold ${isCriticalRisk ? "text-rose-400" : isWarningRisk ? "text-amber-400" : "text-emerald-400"}`}>
              {attendanceRate}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.min(100, Math.max(0, attendanceRate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom: Touch-Friendly Direct Select Segmented Pills (1-Click for iPad) */}
      <div className="pt-2 border-t border-white/5">
        <div className="grid grid-cols-5 gap-1.5 p-1 rounded-xl bg-slate-950/70 border border-white/5">
          {STATUS_CONFIGS.map((config) => {
            const isSelected = currentStatus === config.id;

            return (
              <button
                key={config.id}
                type="button"
                onClick={() => onStatusChange(config.id)}
                className={`min-h-[38px] sm:min-h-[40px] flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all active:scale-95 touch-manipulation border ${
                  isSelected
                    ? config.activeBg
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
                title={`บันทึกเป็น: ${config.label}`}
              >
                <div className="flex items-center gap-1">
                  {isSelected && (
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} animate-pulse`} />
                  )}
                  <span className="text-[11px] sm:text-xs">{config.shortLabel}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
