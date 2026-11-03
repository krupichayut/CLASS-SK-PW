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
  BookOpen
} from "lucide-react";
import { StudentRecord, AttendanceHistoryDoc, SubjectDoc, ClassroomDoc } from "@/lib/firebase/services";
import { StudentAttendanceSummary, AttendanceStatus } from "@/lib/calculations/attendance";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "risk">("all");

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

  // KPI Calculations
  const stats = useMemo(() => {
    const totalSessions = sortedSessions.length;
    const studentCount = students.length;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLeave = 0;
    let totalLate = 0;
    let totalActivity = 0;

    sortedSessions.forEach(session => {
      Object.values(session.records || {}).forEach(status => {
        if (status === "present") totalPresent++;
        else if (status === "absent") totalAbsent++;
        else if (status === "leave") totalLeave++;
        else if (status === "late") totalLate++;
        else if (status === "activity") totalActivity++;
      });
    });

    const totalRecorded = totalPresent + totalAbsent + totalLeave + totalLate + totalActivity;
    const effectiveAttended = totalPresent + totalLate + totalActivity;
    const avgAttendancePercent = totalRecorded > 0 
      ? Math.round((effectiveAttended / totalRecorded) * 1000) / 10 
      : 100;

    const atRiskCount = summaries.filter(s => s.isRisk || s.isMS).length;
    const msCount = summaries.filter(s => s.isMS).length;

    return {
      totalSessions,
      studentCount,
      totalPresent,
      totalAbsent,
      totalLeave,
      totalLate,
      totalActivity,
      avgAttendancePercent,
      atRiskCount,
      msCount,
      percentOfPlan: courseHours > 0 ? Math.round((totalSessions / courseHours) * 100) : 0
    };
  }, [sortedSessions, students, summaries, courseHours]);

  // Filter students based on search and risk filter
  const displayedStudents = useMemo(() => {
    return students
      .filter(s => {
        const summary = summaries.find(sm => sm.studentId === s.id);
        if (filterMode === "risk" && !summary?.isRisk && !summary?.isMS) {
          return false;
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
  }, [students, summaries, filterMode, searchQuery]);

  // Export Matrix Data to CSV (with UTF-8 BOM for Excel Thai support)
  const handleExportCSV = () => {
    if (students.length === 0 || sortedSessions.length === 0) {
      alert("ยังไม่มีข้อมูลเวลาเรียนที่สามารถส่งออกได้ครับ");
      return;
    }

    const headers = [
      "เลขที่",
      "รหัสนักเรียน",
      "ชื่อ-นามสกุล",
      ...sortedSessions.map(s => `${s.date} (${formatPeriodLabel(s.period)})`),
      "รวมมา (คาบ)",
      "ขาด (คาบ)",
      "ลา (คาบ)",
      "สาย (คาบ)",
      "กิจกรรม (คาบ)",
      "ร้อยละเวลาเรียน (%)",
      "สถานะ"
    ];

    const statusMapThai: { [key: string]: string } = {
      present: "ม",
      absent: "ข",
      leave: "ล",
      late: "ส",
      activity: "ก"
    };

    const rows = displayedStudents.map(student => {
      const summary = summaries.find(sm => sm.studentId === student.id);
      const sessionValues = sortedSessions.map(session => {
        const rawStatus = session.records?.[student.id];
        return rawStatus ? statusMapThai[rawStatus] || rawStatus : "-";
      });

      const statusText = summary?.isMS ? "ม.ส." : summary?.isRisk ? "เฝ้าระวัง" : "ปกติ";

      return [
        student.number,
        `"${student.studentCode || ""}"`,
        `"${student.name}"`,
        ...sessionValues,
        summary?.present || 0,
        summary?.absent || 0,
        summary?.leave || 0,
        summary?.late || 0,
        summary?.activity || 0,
        `${summary?.attendancePercent || 100}%`,
        statusText
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `ตารางเวลาเรียน_${selectedRoom}_${selectedSubject?.code || "วิชา"}_${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 0. Room & Subject Quick Switcher Bar */}
      {(subjects.length > 0 || classrooms.length > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-lg">
          <div className="flex flex-wrap items-center gap-3">
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
                <span className="text-slate-400 font-medium">ห้องเรียน:</span>
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

          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            <span>เกณฑ์ สพฐ. 80% (ขาดได้ไม่เกิน {Math.floor(courseHours * 0.2)} คาบ)</span>
          </div>
        </div>
      )}

      {/* 1. Spatial Telemetry & Analytics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Sessions Recorded */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">สอนแล้วสะสม</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100">
              {stats.totalSessions}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {courseHours} คาบ
            </span>
          </div>
          <div className="mt-2 text-[11px] text-cyan-300 font-medium">
            คืบหน้า {stats.percentOfPlan}% ของหลักสูตรปีนี้
          </div>
        </div>

        {/* Card 2: Average Attendance Rate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">มาเรียนเฉลี่ย</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${
              stats.avgAttendancePercent >= 85 ? "text-emerald-400" : stats.avgAttendancePercent >= 80 ? "text-amber-400" : "text-rose-400"
            }`}>
              {stats.avgAttendancePercent}%
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
            <span className="text-xs font-semibold">กลุ่มเฝ้าระวัง / ม.ส.</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              stats.atRiskCount > 0 ? "bg-rose-500/20 text-rose-400 border border-rose-500/40" : "bg-slate-800 text-slate-400 border border-white/10"
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${
              stats.atRiskCount > 0 ? "text-rose-400" : "text-slate-100"
            }`}>
              {stats.atRiskCount}
            </span>
            <span className="text-xs text-slate-400">คน</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-medium">
            {stats.msCount > 0 ? (
              <span className="text-rose-400 font-bold">ติด ม.ส. แล้ว {stats.msCount} คน</span>
            ) : (
              <span className="text-emerald-400 font-semibold">ยังไม่มีผู้ติด ม.ส.</span>
            )}
          </div>
        </div>

        {/* Card 4: Breakdown Counts */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">สถิติแจกแจงทั้งห้อง</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs font-mono mt-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">มาเรียน:</span>
              <span className="font-bold text-emerald-400">{stats.totalPresent}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ขาดเรียน:</span>
              <span className="font-bold text-rose-400">{stats.totalAbsent}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ลา/สาย:</span>
              <span className="font-bold text-amber-400">{stats.totalLeave + stats.totalLate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">กิจกรรม:</span>
              <span className="font-bold text-cyan-400">{stats.totalActivity}</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-mono text-right">
            รวม {stats.studentCount} คนในห้อง
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
              กลุ่มเสี่ยง ({stats.atRiskCount})
            </button>
          </div>
        </div>

        {/* Right: Legend & Export Button */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Status Badge Legend */}
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

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-400/40 text-indigo-200 text-xs font-bold transition-all hover:scale-105 active:scale-95"
            title="ส่งออกเป็นไฟล์ CSV เพื่อเปิดใน Excel"
          >
            <Download className="w-3.5 h-3.5 text-indigo-300" />
            <span>ส่งออก Excel</span>
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
        ) : sortedSessions.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <CalendarCheck className="w-12 h-12 text-cyan-400/40 mx-auto mb-2" />
            <h4 className="text-base font-bold text-slate-200">ยังไม่มีประวัติการเช็กชื่อของวิชานี้</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              เมื่อคุณครูทำการเช็กชื่อในแท็บ "เช็กชื่อประจำวัน" ระบบจะรวบรวมประวัติและสรุปเป็นตารางสถิติให้อัตโนมัติที่หน้านี้ครับ
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full border-collapse text-left text-xs">
              {/* Header */}
              <thead className="sticky top-0 z-30 bg-slate-950 border-b border-white/10 shadow-md">
                <tr className="text-slate-300 font-extrabold text-[11px] uppercase tracking-wider">
                  {/* Sticky Col 1: Number */}
                  <th className="sticky left-0 bg-slate-950 z-40 px-3 py-3 w-[55px] text-center shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                    เลขที่
                  </th>
                  {/* Sticky Col 2: Student Name */}
                  <th className="sticky left-[55px] bg-slate-950 z-40 px-4 py-3 min-w-[200px] shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                    ชื่อ-นามสกุล
                  </th>

                  {/* Dynamic Date Columns */}
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

                  {/* Summary Columns */}
                  <th className="px-3 py-3 text-center min-w-[65px] bg-emerald-950/40 text-emerald-300 border-l border-white/10">
                    รวมมา
                  </th>
                  <th className="px-3 py-3 text-center min-w-[60px] bg-rose-950/40 text-rose-300">
                    ขาด
                  </th>
                  <th className="px-3 py-3 text-center min-w-[65px] bg-amber-950/40 text-amber-300">
                    ลา/สาย
                  </th>
                  <th className="px-3 py-3 text-center min-w-[75px] bg-indigo-950/40 text-indigo-300">
                    % เรียน
                  </th>
                  <th className="px-3 py-3 text-center min-w-[95px] bg-slate-950 text-slate-300 border-l border-white/10">
                    โควตาขาดได้
                  </th>
                  <th className="px-3 py-3 text-center min-w-[85px] bg-slate-950 text-slate-300">
                    สถานะ
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody className="divide-y divide-white/5 text-slate-200">
                {displayedStudents.map((student) => {
                  const summary = summaries.find(sm => sm.studentId === student.id);
                  const remainingQuota = summary?.remainingAllowedAbsences ?? Math.floor(courseHours * 0.2);

                  return (
                    <tr 
                      key={student.id} 
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Sticky Col 1: Number */}
                      <td className="sticky left-0 bg-slate-900 group-hover:bg-slate-800/90 z-20 px-3 py-2 text-center font-mono font-bold text-slate-300 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                        {student.number}
                      </td>

                      {/* Sticky Col 2: Name */}
                      <td className="sticky left-[55px] bg-slate-900 group-hover:bg-slate-800/90 z-20 px-4 py-2 font-medium text-slate-100 shadow-[1px_0_0_0_rgba(255,255,255,0.08)] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{student.name}</span>
                          {summary?.isMS && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="ติด ม.ส." />
                          )}
                        </div>
                      </td>

                      {/* Dynamic Date Cells */}
                      {sortedSessions.map((session, sIdx) => {
                        const status = session.records?.[student.id] as AttendanceStatus | undefined;

                        return (
                          <td 
                            key={`${student.id}_${session.date}_${sIdx}`}
                            className="px-1.5 py-1.5 text-center border-r border-white/5"
                          >
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

                      {/* Summary Col: Present */}
                      <td className="px-3 py-2 text-center font-mono font-bold text-emerald-400 bg-emerald-950/15 border-l border-white/10">
                        {summary?.present || 0}
                      </td>

                      {/* Summary Col: Absent */}
                      <td className="px-3 py-2 text-center font-mono font-bold text-rose-400 bg-rose-950/15">
                        {summary?.absent || 0}
                      </td>

                      {/* Summary Col: Leave + Late */}
                      <td className="px-3 py-2 text-center font-mono font-semibold text-amber-300 bg-amber-950/15">
                        {(summary?.leave || 0) + (summary?.late || 0)}
                      </td>

                      {/* Summary Col: Percentage */}
                      <td className="px-3 py-2 text-center font-mono font-extrabold bg-indigo-950/15">
                        <span className={`${
                          (summary?.attendancePercent || 100) < 80 
                            ? "text-rose-400" 
                            : (summary?.attendancePercent || 100) <= 85 
                            ? "text-amber-400" 
                            : "text-slate-100"
                        }`}>
                          {summary?.attendancePercent || 100}%
                        </span>
                      </td>

                      {/* Summary Col: Remaining Quota */}
                      <td className="px-3 py-2 text-center font-mono text-[11px]">
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

                      {/* Summary Col: Status Badge */}
                      <td className="px-3 py-2 text-center">
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
            บันทึกแล้ว {sortedSessions.length} คาบ · นักเรียน {displayedStudents.length} คน
          </div>
        </div>
      </div>
    </div>
  );
}
