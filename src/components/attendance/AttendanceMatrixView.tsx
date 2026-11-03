"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, 
  CalendarCheck, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Download, 
  Search, 
  Filter,
  ArrowUpDown,
  Clock,
  Sparkles,
  ChevronRight,
  BookOpen,
  CalendarDays
} from "lucide-react";
import { StudentRecord, AttendanceHistoryDoc, SubjectDoc, ClassroomDoc } from "@/lib/firebase/services";
import { StudentAttendanceSummary, AttendanceStatus } from "@/lib/calculations/attendance";

export type AttendanceTermMode = "term2" | "term1" | "annual";

interface AttendanceMatrixViewProps {
  students: StudentRecord[];
  history: AttendanceHistoryDoc[];
  summaries: StudentAttendanceSummary[];
  courseHours: number;
  selectedRoom: string;
  selectedSubject: SubjectDoc | null;
  onSelectSession?: (date: string, period: string) => void;
  subjects?: SubjectDoc[];
  classrooms?: ClassroomDoc[];
  selectedSubjectId?: string;
  onSubjectChange?: (subId: string) => void;
  onRoomChange?: (room: string) => void;
}

export function AttendanceMatrixView({
  students,
  history,
  summaries,
  courseHours,
  selectedRoom,
  selectedSubject,
  onSelectSession,
  subjects = [],
  classrooms = [],
  selectedSubjectId,
  onSubjectChange,
  onRoomChange
}: AttendanceMatrixViewProps) {
  // 1. Term Mode: "term2" (Default) | "term1" | "annual"
  const [termMode, setTermMode] = useState<AttendanceTermMode>("term2");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "risk">("all");

  const termHours = Math.max(1, Math.floor(courseHours / 2));

  // Sort sessions chronologically (oldest to newest)
  const sortedSessions = useMemo(() => {
    return [...history].sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return (a.period || "").localeCompare(b.period || "");
    });
  }, [history]);

  // Format short Thai date for table column headers (e.g. "1 พ.ย.")
  const formatColumnDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const parts = dateStr.split("-").map(Number);
      if (parts.length !== 3) return dateStr;
      const [, m, d] = parts;
      const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      return `${d} ${months[m - 1]}`;
    } catch {
      return dateStr;
    }
  };

  // Format period label (e.g. "period-1" -> "ค.1")
  const formatPeriodLabel = (p: string) => {
    if (!p) return "";
    const match = p.match(/\d+/);
    return match ? `ค.${match[0]}` : p;
  };

  // KPI Calculations according to termMode
  const stats = useMemo(() => {
    const studentCount = students.length;

    // --- Term 2 Stats ---
    const totalSessionsT2 = sortedSessions.length;
    let t2Present = 0;
    let t2Absent = 0;
    let t2Leave = 0;
    let t2Late = 0;
    let t2Activity = 0;

    sortedSessions.forEach(session => {
      Object.values(session.records || {}).forEach(status => {
        if (status === "present") t2Present++;
        else if (status === "absent") t2Absent++;
        else if (status === "leave") t2Leave++;
        else if (status === "late") t2Late++;
        else if (status === "activity") t2Activity++;
      });
    });

    const totalRecordedT2 = t2Present + t2Absent + t2Leave + t2Late + t2Activity;
    const effectiveAttendedT2 = t2Present + t2Late + t2Activity;
    const avgPercentT2 = totalRecordedT2 > 0 
      ? Math.round((effectiveAttendedT2 / totalRecordedT2) * 1000) / 10 
      : 100;
    const t2RiskCount = summaries.filter(s => (s.term2Percent ?? 100) < 80).length;

    // --- Term 1 Stats (from Baseline Vault) ---
    let t1TotalAttended = 0;
    let t1TotalSessions = 0;
    let t1StudentsWithData = 0;
    let t1Under80Count = 0;

    summaries.forEach(s => {
      if (typeof s.term1Attended === "number" && s.term1Total && s.term1Total > 0) {
        t1TotalAttended += s.term1Attended;
        t1TotalSessions += s.term1Total;
        t1StudentsWithData++;
        if ((s.term1Percent ?? 100) < 80) t1Under80Count++;
      }
    });

    const avgPercentT1 = t1TotalSessions > 0
      ? Math.round((t1TotalAttended / t1TotalSessions) * 1000) / 10
      : null;

    // --- Annual Stats ---
    let annualTotalAttended = 0;
    let annualTotalSessions = 0;
    summaries.forEach(s => {
      annualTotalAttended += s.attendedPeriods || 0;
      annualTotalSessions += s.totalPeriods || 0;
    });

    const avgPercentAnnual = annualTotalSessions > 0
      ? Math.round((annualTotalAttended / annualTotalSessions) * 1000) / 10
      : 100;

    const msCount = summaries.filter(s => s.isMS).length;
    const annualRiskCount = summaries.filter(s => s.isRisk || s.isMS).length;

    return {
      studentCount,
      // Term 2
      totalSessionsT2,
      t2Present,
      t2Absent,
      t2Leave,
      t2Late,
      t2Activity,
      avgPercentT2,
      t2RiskCount,
      percentOfPlanT2: termHours > 0 ? Math.round((totalSessionsT2 / termHours) * 100) : 0,
      // Term 1
      avgPercentT1: avgPercentT1 ?? 95,
      t1Under80Count,
      t1StudentsWithData,
      // Annual
      avgPercentAnnual,
      msCount,
      annualRiskCount,
      percentOfPlanAnnual: courseHours > 0 ? Math.round(((totalSessionsT2 + (t1StudentsWithData > 0 ? termHours : 0)) / courseHours) * 100) : 0
    };
  }, [sortedSessions, students, summaries, courseHours, termHours]);

  // Filter students based on search and risk filter
  const displayedStudents = useMemo(() => {
    return students
      .filter(s => {
        const summary = summaries.find(sm => sm.studentId === s.id);
        if (filterMode === "risk") {
          if (termMode === "term2") {
            if ((summary?.term2Percent ?? 100) >= 80) return false;
          } else if (termMode === "term1") {
            if ((summary?.term1Percent ?? 100) >= 80) return false;
          } else {
            if (!summary?.isRisk && !summary?.isMS) return false;
          }
        }
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          s.name.toLowerCase().includes(q) ||
          String(s.number).includes(q) ||
          (s.studentCode && s.studentCode.includes(q))
        );
      })
      .sort((a, b) => a.number - b.number);
  }, [students, summaries, filterMode, searchQuery, termMode]);

  // Export Matrix Data to CSV (with UTF-8 BOM for Excel Thai support)
  const handleExportCSV = () => {
    if (students.length === 0) {
      alert("ยังไม่มีข้อมูลนักเรียนที่สามารถส่งออกได้ครับ");
      return;
    }

    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    const statusMapThai: { [key: string]: string } = {
      present: "ม",
      absent: "ข",
      leave: "ล",
      late: "ส",
      activity: "ก"
    };

    if (termMode === "term2") {
      headers = [
        "เลขที่",
        "รหัสนักเรียน",
        "ชื่อ-นามสกุล",
        ...sortedSessions.map(s => `${s.date} (${formatPeriodLabel(s.period)})`),
        "รวมมา (คาบ)",
        "ขาด (คาบ)",
        "ลา/สาย (คาบ)",
        "กิจกรรม (คาบ)",
        "ร้อยละเวลาเรียน เทอม 2 (%)",
        "สถานะเทอม 2"
      ];

      rows = displayedStudents.map(student => {
        const summary = summaries.find(sm => sm.studentId === student.id);
        const sessionValues = sortedSessions.map(session => {
          const rawStatus = session.records?.[student.id];
          return rawStatus ? statusMapThai[rawStatus] || rawStatus : "-";
        });
        const statusText = (summary?.term2Percent ?? 100) < 80 ? "เสี่ยง (< 80%)" : "ปกติ";

        return [
          student.number,
          `"${student.studentCode || ""}"`,
          `"${student.name}"`,
          ...sessionValues,
          summary?.present || 0,
          summary?.absent || 0,
          (summary?.leave || 0) + (summary?.late || 0),
          summary?.activity || 0,
          `${summary?.term2Percent ?? 100}%`,
          statusText
        ];
      });
    } else if (termMode === "term1") {
      headers = [
        "เลขที่",
        "รหัสนักเรียน",
        "ชื่อ-นามสกุล",
        "เวลาเรียนที่มา เทอม 1 (คาบ)",
        "ขาดเรียน เทอม 1 (คาบ)",
        "คาบเต็ม เทอม 1 (คาบ)",
        "ร้อยละเวลาเรียน เทอม 1 (%)",
        "สถานะเทอม 1",
        "หมายเหตุ"
      ];

      rows = displayedStudents.map(student => {
        const summary = summaries.find(sm => sm.studentId === student.id);
        const t1Attended = summary?.term1Attended ?? "-";
        const t1Total = summary?.term1Total ?? "-";
        const t1Absent = (typeof summary?.term1Total === "number" && typeof summary?.term1Attended === "number") 
          ? Math.max(0, summary.term1Total - summary.term1Attended) 
          : "-";
        const t1Percent = summary?.term1Percent !== null ? `${summary?.term1Percent}%` : "-";
        const statusText = (summary?.term1Percent ?? 100) < 80 ? "เสี่ยง (< 80%)" : "ปกติ";

        return [
          student.number,
          `"${student.studentCode || ""}"`,
          `"${student.name}"`,
          t1Attended,
          t1Absent,
          t1Total,
          t1Percent,
          statusText,
          "ข้อมูลทุนเดิมเทอม 1"
        ];
      });
    } else {
      // Annual Summary
      headers = [
        "เลขที่",
        "รหัสนักเรียน",
        "ชื่อ-นามสกุล",
        "เทอม 1: มา (คาบ)",
        "เทอม 1: เต็ม (คาบ)",
        "เทอม 1: ร้อยละ (%)",
        "เทอม 2: มา (คาบ)",
        "เทอม 2: เต็ม (คาบ)",
        "เทอม 2: ร้อยละ (%)",
        "รวมทั้งปี: มาสะสม (คาบ)",
        "รวมทั้งปี: เต็มทั้งปี (คาบ)",
        "รวมทั้งปี: ร้อยละสะสม (%)",
        "โควตาขาดได้ตลอดปี",
        "สถานะ ม.ส. ประจำปี"
      ];

      rows = displayedStudents.map(student => {
        const summary = summaries.find(sm => sm.studentId === student.id);
        const statusText = summary?.isMS ? "ติด ม.ส." : summary?.isRisk ? "เฝ้าระวัง" : "ปกติ";

        return [
          student.number,
          `"${student.studentCode || ""}"`,
          `"${student.name}"`,
          summary?.term1Attended ?? "-",
          summary?.term1Total ?? "-",
          summary?.term1Percent !== null ? `${summary?.term1Percent}%` : "-",
          summary?.term2Attended ?? 0,
          summary?.term2Total ?? 0,
          `${summary?.term2Percent ?? 100}%`,
          summary?.attendedPeriods ?? 0,
          summary?.totalPeriods ?? 0,
          `${summary?.attendancePercent ?? 100}%`,
          summary?.remainingAllowedAbsences ?? Math.floor(courseHours * 0.2),
          statusText
        ];
      });
    }

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const modeLabel = termMode === "term2" ? "เทอม2" : termMode === "term1" ? "เทอม1" : "สรุปตลอดปี";
    const filename = `ตารางเวลาเรียน_${modeLabel}_${selectedRoom}_${selectedSubject?.code || "วิชา"}_${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 0. Top Ribbon: Room & Subject Switcher + 3-Mode Term Switcher */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-lg">
        {/* Left: Subject & Room Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subject Dropdown */}
          {subjects.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-slate-200 shadow-xs">
              <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400 font-medium">วิชา:</span>
              <select
                value={selectedSubjectId || selectedSubject?.id}
                onChange={(e) => onSubjectChange?.(e.target.value)}
                className="bg-transparent outline-none cursor-pointer pr-1 text-slate-100 font-semibold"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {s.code} {s.name} ({s.level})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Classroom Dropdown */}
          {classrooms.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-slate-200 shadow-xs">
              <Users className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-slate-400 font-medium">ห้อง:</span>
              <select
                value={selectedRoom}
                onChange={(e) => onRoomChange?.(e.target.value)}
                className="bg-transparent outline-none cursor-pointer pr-1 text-slate-100 font-semibold"
              >
                {classrooms.map((c) => (
                  <option key={c.id || c.name} value={c.name} className="bg-slate-900 text-slate-200">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: 3-Mode Term Switcher (เทอม 2 / เทอม 1 / สรุปรายปี) */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950/90 border border-white/10 text-xs font-mono self-start lg:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setTermMode("term2")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              termMode === "term2"
                ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold shadow-md shadow-indigo-500/20 scale-[1.02]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-300" />
            <span>ภาคเรียนที่ 2 (ปัจจุบัน)</span>
          </button>

          <button
            type="button"
            onClick={() => setTermMode("term1")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              termMode === "term1"
                ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold shadow-md shadow-indigo-500/20 scale-[1.02]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 text-indigo-300" />
            <span>ภาคเรียนที่ 1</span>
          </button>

          <button
            type="button"
            onClick={() => setTermMode("annual")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              termMode === "annual"
                ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold shadow-md shadow-indigo-500/20 scale-[1.02]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
            <span>สรุปตลอดปีการศึกษา (ปพ.5)</span>
          </button>
        </div>
      </div>

      {/* 1. Spatial Telemetry & Analytics Dashboard (Dynamic per Term) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Sessions Recorded */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">
              {termMode === "term2" ? "สอนแล้วในเทอม 2" : termMode === "term1" ? "ชั่วโมงเรียนเทอม 1" : "รวมชั่วโมงสอนทั้งปี"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100">
              {termMode === "term2" ? stats.totalSessionsT2 : termMode === "term1" ? termHours : (stats.totalSessionsT2 + (stats.t1StudentsWithData > 0 ? termHours : 0))}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {termMode === "annual" ? courseHours : termHours} คาบ
            </span>
          </div>
          <div className="mt-2 text-[11px] text-cyan-300 font-medium">
            {termMode === "term2" 
              ? `คืบหน้า ${stats.percentOfPlanT2}% ของแผนเทอม 2`
              : termMode === "term1"
              ? "บันทึกในคลังเทอม 1 เรียบร้อย"
              : `คืบหน้า ${stats.percentOfPlanAnnual}% ตลอดปีการศึกษา`}
          </div>
        </div>

        {/* Card 2: Average Attendance Rate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">
              {termMode === "term2" ? "มาเรียนเฉลี่ย เทอม 2" : termMode === "term1" ? "มาเรียนเฉลี่ย เทอม 1" : "มาเรียนเฉลี่ย ตลอดปี"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
              {termMode === "term2" ? stats.avgPercentT2 : termMode === "term1" ? stats.avgPercentT1 : stats.avgPercentAnnual}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-300 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>เกณฑ์มาตรฐาน สพฐ. 80%</span>
          </div>
        </div>

        {/* Card 3: At-Risk & MS Students */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">
              {termMode === "term2" ? "กลุ่มเสี่ยงเทอม 2" : termMode === "term1" ? "กลุ่มเสี่ยงเทอม 1" : "เฝ้าระวัง ม.ส. ทั้งปี"}
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              (termMode === "term2" ? stats.t2RiskCount : termMode === "term1" ? stats.t1Under80Count : stats.annualRiskCount) > 0 
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40" 
                : "bg-slate-800 text-slate-400 border border-white/10"
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${
              (termMode === "term2" ? stats.t2RiskCount : termMode === "term1" ? stats.t1Under80Count : stats.annualRiskCount) > 0 
                ? "text-rose-400" 
                : "text-slate-100"
            }`}>
              {termMode === "term2" ? stats.t2RiskCount : termMode === "term1" ? stats.t1Under80Count : stats.annualRiskCount}
            </span>
            <span className="text-xs text-slate-400">คน</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            {termMode === "annual" && stats.msCount > 0 ? (
              <span className="text-rose-400 font-bold">ติด ม.ส. แล้ว {stats.msCount} คน</span>
            ) : (
              <span className="text-emerald-400 font-semibold">ทุกคนอยู่ในเกณฑ์ปกติ</span>
            )}
          </div>
        </div>

        {/* Card 4: Breakdown Counts */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">
              {termMode === "term2" ? "สถิติเช็กชื่อเทอม 2" : termMode === "term1" ? "สรุปทุนเดิมเทอม 1" : "สรุปสะสมตลอดปี"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          {termMode === "term2" ? (
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs font-mono mt-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">มา:</span>
                <span className="font-bold text-emerald-400">{stats.t2Present}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ขาด:</span>
                <span className="font-bold text-rose-400">{stats.t2Absent}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ลา/สาย:</span>
                <span className="font-bold text-amber-400">{stats.t2Leave + stats.t2Late}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">กิจ:</span>
                <span className="font-bold text-cyan-400">{stats.t2Activity}</span>
              </div>
            </div>
          ) : termMode === "term1" ? (
            <div className="text-xs font-mono mt-1 space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">เด็กมีข้อมูล:</span>
                <span className="font-bold text-cyan-300">{stats.t1StudentsWithData} / {stats.studentCount} คน</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ขาดในเทอม 1:</span>
                <span className="font-bold text-rose-400">{stats.t1Under80Count} คนหลุดเกณฑ์</span>
              </div>
            </div>
          ) : (
            <div className="text-xs font-mono mt-1 space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">โควตาขาดได้ทั้งปี:</span>
                <span className="font-bold text-amber-300">{Math.floor(courseHours * 0.2)} คาบ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">สถานะหลัก:</span>
                <span className="font-bold text-emerald-400">ครบสมบูรณ์ ปพ.5</span>
              </div>
            </div>
          )}
          <div className="mt-2 text-[10px] text-slate-400 font-mono text-right">
            รวมนักเรียน {stats.studentCount} คน
          </div>
        </div>
      </div>

      {/* 2. Control Ribbon: Search, Filter, Legend & CSV Export */}
      <div className="p-4 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Search & Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ หรือเลขที่..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterMode === "all"
                  ? "bg-slate-800 text-cyan-300 font-bold border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ทั้งหมด ({students.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("risk")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterMode === "risk"
                  ? "bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)] font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              กลุ่มเสี่ยง ({termMode === "term2" ? stats.t2RiskCount : termMode === "term1" ? stats.t1Under80Count : stats.annualRiskCount})
            </button>
          </div>
        </div>

        {/* Right: Legend & Export Button */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {termMode === "term2" && (
            <div className="flex items-center gap-2 text-[11px] font-mono px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10">
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-[10px]">ม</span>
                <span className="text-slate-400">มา</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-md bg-rose-500/25 text-rose-300 border border-rose-500/40 flex items-center justify-center font-bold text-[10px]">ข</span>
                <span className="text-slate-400">ขาด</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-[10px]">ล</span>
                <span className="text-slate-400">ลา</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center justify-center font-bold text-[10px]">ส</span>
                <span className="text-slate-400">สาย</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-[10px]">ก</span>
                <span className="text-slate-400">กิจ</span>
              </span>
            </div>
          )}

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-400/40 text-indigo-200 text-xs font-bold transition-all hover:scale-105 active:scale-95"
            title="ส่งออกตารางของมุมมองนี้เป็นไฟล์ Excel (.csv)"
          >
            <Download className="w-3.5 h-3.5 text-indigo-300" />
            <span>ส่งออก Excel ({termMode === "term2" ? "เทอม 2" : termMode === "term1" ? "เทอม 1" : "สรุปตลอดปี"})</span>
          </button>
        </div>
      </div>

      {/* 3. The Grand Matrix Sheet */}
      <div className="rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
        {students.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-sm">ไม่พบรายชื่อนักเรียนในห้อง {selectedRoom}</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full border-collapse text-left text-xs">
              {/* ========================================================= */}
              {/* MODE 1: TERM 2 TABLE (Current Live Matrix)                 */}
              {/* ========================================================= */}
              {termMode === "term2" && (
                <>
                  <thead className="sticky top-0 z-30 bg-slate-950 border-b border-white/10 shadow-md">
                    <tr className="text-slate-300 font-extrabold text-[11px] uppercase tracking-wider">
                      <th className="sticky left-0 bg-slate-950 z-40 px-3 py-3 w-[55px] text-center shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                        เลขที่
                      </th>
                      <th className="sticky left-[55px] bg-slate-950 z-40 px-4 py-3 min-w-[200px] shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                        ชื่อ-นามสกุล
                      </th>

                      {/* Dynamic Date Columns for Term 2 */}
                      {sortedSessions.map((session, idx) => (
                        <th 
                          key={session.id || `${session.date}_${session.period}_${idx}`}
                          onClick={() => onSelectSession?.(session.date, session.period)}
                          className="px-2 py-2 text-center min-w-[58px] border-r border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                          title={`คลิกเพื่อดู/แก้ไขการเช็กชื่อ: วันที่ ${session.date} (${session.period})`}
                        >
                          <div className="flex flex-col items-center">
                            <span className="font-mono text-slate-200 group-hover:text-cyan-300 font-bold whitespace-nowrap">
                              {formatColumnDate(session.date)}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {formatPeriodLabel(session.period)}
                            </span>
                          </div>
                        </th>
                      ))}

                      {/* Summary Columns for Term 2 Only */}
                      <th className="px-3 py-3 text-center min-w-[65px] bg-emerald-950/40 text-emerald-300 border-l border-white/10">
                        รวมมา
                      </th>
                      <th className="px-3 py-3 text-center min-w-[60px] bg-rose-950/40 text-rose-300">
                        ขาด
                      </th>
                      <th className="px-3 py-3 text-center min-w-[65px] bg-amber-950/40 text-amber-300">
                        ลา/สาย
                      </th>
                      <th className="px-3 py-3 text-center min-w-[80px] bg-indigo-950/40 text-indigo-300">
                        % เรียน (เทอม 2)
                      </th>
                      <th className="px-3 py-3 text-center min-w-[85px] bg-slate-950 text-slate-300">
                        สถานะเทอม 2
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {displayedStudents.map((student) => {
                      const summary = summaries.find(sm => sm.studentId === student.id);
                      const t2Percent = summary?.term2Percent ?? 100;

                      return (
                        <tr key={student.id} className="hover:bg-white/[0.03] transition-colors group">
                          <td className="sticky left-0 bg-slate-900 group-hover:bg-slate-800/90 z-20 px-3 py-2 text-center font-mono font-bold text-slate-300 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                            {student.number}
                          </td>

                          <td className="sticky left-[55px] bg-slate-900 group-hover:bg-slate-800/90 z-20 px-4 py-2 font-medium text-slate-100 shadow-[1px_0_0_0_rgba(255,255,255,0.08)] whitespace-nowrap">
                            <span>{student.name}</span>
                          </td>

                          {sortedSessions.map((session, sIdx) => {
                            const status = session.records?.[student.id] as AttendanceStatus | undefined;
                            return (
                              <td key={`${student.id}_${session.date}_${sIdx}`} className="px-1.5 py-1.5 text-center border-r border-white/5">
                                {status === "present" ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30">
                                    ม
                                  </span>
                                ) : status === "absent" ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-rose-500/25 text-rose-300 font-bold text-[11px] border border-rose-500/40 shadow-[0_0_6px_rgba(244,63,94,0.3)]">
                                    ข
                                  </span>
                                ) : status === "leave" ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/30">
                                    ล
                                  </span>
                                ) : status === "late" ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-orange-500/20 text-orange-300 font-bold text-[11px] border border-orange-500/30">
                                    ส
                                  </span>
                                ) : status === "activity" ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-300 font-bold text-[11px] border border-cyan-500/30">
                                    ก
                                  </span>
                                ) : (
                                  <span className="text-slate-600 font-mono">-</span>
                                )}
                              </td>
                            );
                          })}

                          <td className="px-3 py-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/15 border-l border-white/10">
                            {summary?.present || 0}
                          </td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-rose-400 bg-rose-950/15">
                            {summary?.absent || 0}
                          </td>
                          <td className="px-3 py-2 text-center font-mono font-semibold text-amber-300 bg-amber-950/15">
                            {(summary?.leave || 0) + (summary?.late || 0)}
                          </td>
                          <td className="px-3 py-2 text-center font-mono font-extrabold bg-indigo-950/15">
                            <span className={t2Percent < 80 ? "text-rose-400" : "text-emerald-400"}>
                              {t2Percent}%
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {t2Percent < 80 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                                เสี่ยง (&lt; 80%)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                ปกติ
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </>
              )}

              {/* ========================================================= */}
              {/* MODE 2: TERM 1 TABLE (Baseline Vault)                      */}
              {/* ========================================================= */}
              {termMode === "term1" && (
                <>
                  <thead className="sticky top-0 z-30 bg-slate-950 border-b border-white/10 shadow-md">
                    <tr className="text-slate-300 font-extrabold text-[11px] uppercase tracking-wider">
                      <th className="sticky left-0 bg-slate-950 z-40 px-3 py-3 w-[55px] text-center shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                        เลขที่
                      </th>
                      <th className="sticky left-[55px] bg-slate-950 z-40 px-4 py-3 min-w-[200px] shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                        ชื่อ-นามสกุล
                      </th>
                      <th className="px-4 py-3 text-center min-w-[120px] bg-emerald-950/40 text-emerald-300">
                        เวลาเรียนที่มา (คาบ)
                      </th>
                      <th className="px-4 py-3 text-center min-w-[100px] bg-rose-950/40 text-rose-300">
                        ขาดเรียน (คาบ)
                      </th>
                      <th className="px-4 py-3 text-center min-w-[120px] bg-slate-950 text-slate-300">
                        คาบเต็ม เทอม 1
                      </th>
                      <th className="px-4 py-3 text-center min-w-[120px] bg-indigo-950/40 text-indigo-300">
                        % เวลาเรียน (เทอม 1)
                      </th>
                      <th className="px-4 py-3 text-center min-w-[120px] bg-slate-950 text-slate-300">
                        สถานะเทอม 1
                      </th>
                      <th className="px-4 py-3 text-left min-w-[150px] bg-slate-950 text-slate-400">
                        แหล่งข้อมูล
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {displayedStudents.map((student) => {
                      const summary = summaries.find(sm => sm.studentId === student.id);
                      const t1Attended = summary?.term1Attended;
                      const t1Total = summary?.term1Total;
                      const hasData = typeof t1Attended === "number" && typeof t1Total === "number";
                      const t1Absent = hasData ? Math.max(0, t1Total - t1Attended) : "-";
                      const t1Percent = summary?.term1Percent;

                      return (
                        <tr key={student.id} className="hover:bg-white/[0.03] transition-colors group">
                          <td className="sticky left-0 bg-slate-900 group-hover:bg-slate-800/90 z-20 px-3 py-2 text-center font-mono font-bold text-slate-300 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                            {student.number}
                          </td>
                          <td className="sticky left-[55px] bg-slate-900 group-hover:bg-slate-800/90 z-20 px-4 py-2 font-medium text-slate-100 shadow-[1px_0_0_0_rgba(255,255,255,0.08)] whitespace-nowrap">
                            <span>{student.name}</span>
                          </td>
                          <td className="px-4 py-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/15">
                            {hasData ? `${t1Attended} คาบ` : "-"}
                          </td>
                          <td className="px-4 py-2 text-center font-mono font-bold text-rose-400 bg-rose-950/15">
                            {hasData ? `${t1Absent} คาบ` : "-"}
                          </td>
                          <td className="px-4 py-2 text-center font-mono text-slate-300">
                            {hasData ? `${t1Total} คาบ` : "-"}
                          </td>
                          <td className="px-4 py-2 text-center font-mono font-extrabold bg-indigo-950/15">
                            {t1Percent !== null && t1Percent !== undefined ? (
                              <span className={t1Percent < 80 ? "text-rose-400" : "text-emerald-400"}>
                                {t1Percent}%
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {t1Percent !== null && t1Percent !== undefined ? (
                              t1Percent < 80 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                                  เสี่ยง (&lt; 80%)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                  ปกติ
                                </span>
                              )
                            ) : (
                              <span className="text-slate-500 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-xs font-mono text-slate-400">
                            คลังคะแนนเทอม 1 (Vault)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </>
              )}

              {/* ========================================================= */}
              {/* MODE 3: ANNUAL SUMMARY (Full Academic Year / ปพ.5)          */}
              {/* ========================================================= */}
              {termMode === "annual" && (
                <>
                  <thead className="sticky top-0 z-30 bg-slate-950 border-b border-white/10 shadow-md">
                    {/* Level 1 Group Header */}
                    <tr className="text-slate-300 font-extrabold text-[11px] uppercase tracking-wider border-b border-white/10">
                      <th rowSpan={2} className="sticky left-0 bg-slate-950 z-40 px-3 py-2 w-[55px] text-center shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                        เลขที่
                      </th>
                      <th rowSpan={2} className="sticky left-[55px] bg-slate-950 z-40 px-4 py-2 min-w-[200px] shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                        ชื่อ-นามสกุล
                      </th>
                      <th colSpan={3} className="px-3 py-2 text-center bg-indigo-950/50 text-indigo-300 border-r border-white/10 font-black">
                        ภาคเรียนที่ 1
                      </th>
                      <th colSpan={3} className="px-3 py-2 text-center bg-cyan-950/50 text-cyan-300 border-r border-white/10 font-black">
                        ภาคเรียนที่ 2
                      </th>
                      <th colSpan={3} className="px-3 py-2 text-center bg-emerald-950/50 text-emerald-300 border-r border-white/10 font-black">
                        รวมตลอดปีการศึกษา (ปพ.5)
                      </th>
                      <th colSpan={2} className="px-3 py-2 text-center bg-slate-950 text-slate-300 font-black">
                        การตัดสินผลการเรียน
                      </th>
                    </tr>
                    {/* Level 2 Sub-columns */}
                    <tr className="text-slate-400 font-bold text-[10px]">
                      {/* Term 1 */}
                      <th className="px-2.5 py-1.5 text-center bg-indigo-950/30 text-indigo-200">มา (คาบ)</th>
                      <th className="px-2.5 py-1.5 text-center bg-indigo-950/30 text-indigo-200">เต็ม</th>
                      <th className="px-2.5 py-1.5 text-center bg-indigo-950/30 text-indigo-300 border-r border-white/10">% เทอม 1</th>
                      {/* Term 2 */}
                      <th className="px-2.5 py-1.5 text-center bg-cyan-950/30 text-cyan-200">มา (คาบ)</th>
                      <th className="px-2.5 py-1.5 text-center bg-cyan-950/30 text-cyan-200">เต็ม</th>
                      <th className="px-2.5 py-1.5 text-center bg-cyan-950/30 text-cyan-300 border-r border-white/10">% เทอม 2</th>
                      {/* Annual */}
                      <th className="px-2.5 py-1.5 text-center bg-emerald-950/30 text-emerald-200 font-bold">มาสะสม</th>
                      <th className="px-2.5 py-1.5 text-center bg-emerald-950/30 text-emerald-200">เต็มปี</th>
                      <th className="px-2.5 py-1.5 text-center bg-emerald-950/40 text-emerald-300 font-extrabold border-r border-white/10">% รวมทั้งปี</th>
                      {/* Decisions */}
                      <th className="px-2.5 py-1.5 text-center bg-slate-950 text-amber-300">ขาดได้อีก</th>
                      <th className="px-2.5 py-1.5 text-center bg-slate-950 text-slate-200">สถานะ ม.ส.</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {displayedStudents.map((student) => {
                      const summary = summaries.find(sm => sm.studentId === student.id);
                      const remainingQuota = summary?.remainingAllowedAbsences ?? Math.floor(courseHours * 0.2);

                      return (
                        <tr key={student.id} className="hover:bg-white/[0.03] transition-colors group">
                          {/* Number */}
                          <td className="sticky left-0 bg-slate-900 group-hover:bg-slate-800/90 z-20 px-3 py-2 text-center font-mono font-bold text-slate-300 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                            {student.number}
                          </td>
                          {/* Name */}
                          <td className="sticky left-[55px] bg-slate-900 group-hover:bg-slate-800/90 z-20 px-4 py-2 font-medium text-slate-100 shadow-[1px_0_0_0_rgba(255,255,255,0.08)] whitespace-nowrap">
                            <span>{student.name}</span>
                          </td>

                          {/* Term 1 Group */}
                          <td className="px-2.5 py-2 text-center font-mono bg-indigo-950/15">
                            {summary?.term1Attended ?? "-"}
                          </td>
                          <td className="px-2.5 py-2 text-center font-mono text-slate-400 bg-indigo-950/15">
                            {summary?.term1Total ?? "-"}
                          </td>
                          <td className="px-2.5 py-2 text-center font-mono font-bold bg-indigo-950/25 border-r border-white/10">
                            {summary?.term1Percent !== null && summary?.term1Percent !== undefined ? (
                              <span className={summary.term1Percent < 80 ? "text-rose-400" : "text-indigo-300"}>
                                {summary.term1Percent}%
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>

                          {/* Term 2 Group */}
                          <td className="px-2.5 py-2 text-center font-mono bg-cyan-950/15 font-bold text-cyan-300">
                            {summary?.term2Attended ?? 0}
                          </td>
                          <td className="px-2.5 py-2 text-center font-mono text-slate-400 bg-cyan-950/15">
                            {summary?.term2Total ?? 0}
                          </td>
                          <td className="px-2.5 py-2 text-center font-mono font-bold bg-cyan-950/25 border-r border-white/10">
                            <span className={(summary?.term2Percent ?? 100) < 80 ? "text-rose-400" : "text-cyan-300"}>
                              {summary?.term2Percent ?? 100}%
                            </span>
                          </td>

                          {/* Annual Group */}
                          <td className="px-2.5 py-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">
                            {summary?.attendedPeriods ?? 0}
                          </td>
                          <td className="px-2.5 py-2 text-center font-mono text-slate-400 bg-emerald-950/20">
                            {summary?.totalPeriods ?? courseHours}
                          </td>
                          <td className="px-2.5 py-2 text-center font-mono font-black bg-emerald-950/30 border-r border-white/10">
                            <span className={`${
                              (summary?.attendancePercent || 100) < 80 
                                ? "text-rose-400 font-bold" 
                                : (summary?.attendancePercent || 100) <= 85 
                                ? "text-amber-400" 
                                : "text-emerald-300"
                            }`}>
                              {summary?.attendancePercent || 100}%
                            </span>
                          </td>

                          {/* Remaining Quota */}
                          <td className="px-2.5 py-2 text-center font-mono text-[11px]">
                            <span className={`px-2 py-0.5 rounded-full ${
                              remainingQuota <= 0
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold"
                                : remainingQuota <= 3
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold"
                                : "text-slate-400"
                            }`}>
                              {remainingQuota <= 0 ? "หมดโควตา" : `อีก ${remainingQuota} คาบ`}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="px-2.5 py-2 text-center">
                            {summary?.isMS ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/40 text-[10px] font-black animate-pulse">
                                ติด ม.ส.
                              </span>
                            ) : summary?.isRisk ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                เฝ้าระวัง
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                ปกติ
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </>
              )}
            </table>
          </div>
        )}

        {/* Matrix Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>
              ห้อง {selectedRoom} · รายวิชา {selectedSubject?.code || ""} {selectedSubject?.name || ""}
            </span>
          </div>
          <div>
            โหมดปัจจุบัน: {termMode === "term2" ? "ภาคเรียนที่ 2 (ปัจจุบัน)" : termMode === "term1" ? "ภาคเรียนที่ 1" : "สรุปตลอดปีการศึกษา (ปพ.5)"} · นักเรียน {displayedStudents.length} คน
          </div>
        </div>
      </div>
    </div>
  );
}
