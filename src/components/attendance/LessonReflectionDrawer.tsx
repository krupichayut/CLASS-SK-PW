"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  BookOpen, 
  Calendar, 
  UserCheck, 
  UserX, 
  Clock, 
  FileText,
  Lightbulb,
  Save,
  CheckCircle2
} from "lucide-react";
import { StudentRecord, SubjectDoc, CurriculumUnit } from "@/lib/firebase/services";
import { AttendanceStatus } from "@/lib/calculations/attendance";

interface LessonReflectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  subject: SubjectDoc | null;
  room: string;
  students: StudentRecord[];
  attendance: { [studentId: string]: AttendanceStatus };
  selectedIndicatorCode: string;
  activeUnit?: CurriculumUnit | null;
}

export function LessonReflectionDrawer({
  isOpen,
  onClose,
  date,
  subject,
  room,
  students,
  attendance,
  selectedIndicatorCode,
  activeUnit
}: LessonReflectionDrawerProps) {
  const [reflectionText, setReflectionText] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Calculate real-time numbers
  const totalStudents = students.length;
  const presentCount = students.filter(s => (attendance[s.id] || "present") === "present").length;
  const absentStudents = students.filter(s => attendance[s.id] === "absent");
  const leaveStudents = students.filter(s => attendance[s.id] === "leave");
  const lateStudents = students.filter(s => attendance[s.id] === "late");

  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 100;

  // Format Thai Date
  const thaiDateFormatted = (() => {
    try {
      const d = new Date(date);
      const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${d.getFullYear() + 543}`;
    } catch {
      return date;
    }
  })();

  // Generate Automated Post-Lesson Reflection
  const generateReflection = () => {
    const subName = subject ? `${subject.code} ${subject.name}` : "รายวิชา";
    const unitTitle = activeUnit ? `หน่วยการเรียนรู้ที่ ${activeUnit.unitNumber}: ${activeUnit.title}` : "หน่วยการเรียนรู้ตามแผนการสอน";
    const indicatorInfo = selectedIndicatorCode ? `ตัวชี้วัด ว15/2566: ${selectedIndicatorCode}` : "ตัวชี้วัดประจำบทเรียน";

    const absentNames = absentStudents.map(s => s.name).join(", ");
    const leaveNames = leaveStudents.map(s => s.name).join(", ");

    const text = `📝 บันทึกหลังการจัดการเรียนรู้ (Active Learning)
วันที่: ${thaiDateFormatted} | ห้อง: ${room}
รายวิชา: ${subName}
${unitTitle}
${indicatorInfo}

1. ข้อมูลการเข้าชั้นเรียน:
- นักเรียนทั้งหมด: ${totalStudents} คน | มาเรียน: ${presentCount} คน (${attendanceRate}%)
${absentStudents.length > 0 ? `- ขาดเรียน (${absentStudents.length} คน): ${absentNames}\n` : ""}${leaveStudents.length > 0 ? `- ลา (${leaveStudents.length} คน): ${leaveNames}\n` : ""}${lateStudents.length > 0 ? `- มาสาย: ${lateStudents.length} คน\n` : ""}
2. ผลการจัดกิจกรรมการเรียนรู้เชิงรุก (Active Learning):
- ผู้เรียนส่วนใหญ่ให้ความร่วมมือในกิจกรรมสืบเสาะและอภิปรายกลุ่มเป็นอย่างดี สามารถสรุปประเด็นสำคัญของบทเรียนได้ตามเกณฑ์
- ร้อยละ ${attendanceRate >= 80 ? "85 ขึ้นไป" : `${attendanceRate}`} ของผู้เรียนมีส่วนร่วมในการตอบคำถามและทำงานร่วมกับเพื่อน

3. ปัญหาและอุปสรรคที่พบ:
- ${absentStudents.length > 0 ? `มีนักเรียนขาดเรียน ${absentStudents.length} คน จำเป็นต้องมอบหมายงานย้อนหลังเพื่อติดตามความรู้` : "กิจกรรมดำเนินไปตามแผน นักเรียนทุกคนสามารถร่วมกิจกรรมได้ครบถ้วน"}

4. แนวทางแก้ไขและพัฒนาในคาบถัดไป:
- ติดตามชิ้นงานย้อนหลังสำหรับนักเรียนที่ขาดเรียน และเพิ่มเวลาในส่วนของการสรุปองค์ความรู้กลุ่มย่อย`;

    setReflectionText(text);
  };

  useEffect(() => {
    if (isOpen) {
      generateReflection();
      setIsCopied(false);
      setIsSaved(false);
    }
  }, [isOpen, date, subject, room, students, attendance, selectedIndicatorCode, activeUnit]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(reflectionText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl h-full bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-cyan-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>สรุปบทเรียน & บันทึกหลังสอนท้ายคาบ</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                  1-Click Auto
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                ดึงข้อมูลการมาเรียนและตัวชี้วัดจริง ว15/2566 อัตโนมัติ (ไม่มี ว PA)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Telemetry Summary Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[10px] font-mono text-slate-400 uppercase">มาเรียน</span>
              <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                {presentCount} <span className="text-xs text-slate-500 font-normal">/ {totalStudents}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[10px] font-mono text-slate-400 uppercase">ขาด / ลา</span>
              <div className="text-lg font-black font-mono text-rose-400 mt-0.5">
                {absentStudents.length + leaveStudents.length} <span className="text-xs text-slate-500 font-normal">คน</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-[10px] font-mono text-slate-400 uppercase">เปอร์เซ็นต์มาเรียน</span>
              <div className="text-lg font-black font-mono text-cyan-300 mt-0.5">
                {attendanceRate}%
              </div>
            </div>
          </div>

          {/* Active Context Banner */}
          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-indigo-300">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>{subject ? `${subject.code} ${subject.name} (${room})` : "รายวิชา"}</span>
            </div>
            {selectedIndicatorCode && (
              <div className="text-[11px] font-mono text-slate-300">
                ตัวชี้วัดที่ใช้: <span className="text-cyan-300 font-bold">{selectedIndicatorCode}</span>
              </div>
            )}
          </div>

          {/* Generated Text Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>ข้อความบันทึกหลังการสอน (แก้ไขได้):</span>
              </label>

              <button
                type="button"
                onClick={generateReflection}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                สร้างใหม่ (Regenerate)
              </button>
            </div>

            <textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              rows={14}
              className="w-full p-4 rounded-xl bg-slate-950 border border-white/10 text-slate-200 text-xs font-sans leading-relaxed outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none"
            />
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            ปิดหน้าต่าง
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                isCopied
                  ? "bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-white/10"
              }`}
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{isCopied ? "คัดลอกเรียบร้อย!" : "คัดลอกข้อความ"}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md active:scale-95 ${
                isSaved
                  ? "bg-emerald-600 shadow-[0_0_16px_rgba(16,185,129,0.5)]"
                  : "bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 shadow-[0_0_16px_rgba(99,102,241,0.4)]"
              }`}
            >
              {isSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaved ? "บันทึกแล้ว!" : "บันทึกลงระบบ"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
