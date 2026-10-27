"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  CalendarDays, 
  Save, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Bell, 
  Copy, 
  X, 
  Loader2, 
  UserCheck, 
  UserX, 
  CalendarCheck,
  TrendingDown,
  Sparkles,
  BookOpen,
  School,
  Layers,
  Filter,
  ChevronLeft,
  ChevronRight,
  Info,
  Check,
  ShieldAlert,
  Users,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Mic,
  MicOff,
  Volume2
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  getAllStudents, 
  getStudentsByRoom,
  saveAttendanceRecord, 
  getAttendanceRecord, 
  getAttendanceHistory,
  getAllSubjects,
  getAllClassrooms,
  getActiveAcademicYear,
  SubjectDoc,
  ClassroomDoc,
  StudentRecord,
  AttendanceHistoryDoc,
  AcademicYearDoc,
  CurriculumUnit
} from "@/lib/firebase/services";
import { 
  calculateAttendanceSummaries, 
  AttendanceStatus, 
  StudentAttendanceSummary 
} from "@/lib/calculations/attendance";
import { isDateWithinTerm } from "@/lib/dateUtils";
import { ClassroomSeatingGrid } from "@/components/attendance/ClassroomSeatingGrid";
import { StudentInspectorDrawer } from "@/components/students/StudentInspectorDrawer";
import { DynamicIsland } from "@/components/ui/DynamicIsland";
import { useThaiVoiceCheckIn } from "@/lib/speech/useThaiVoiceCheckIn";
import { LessonReflectionDrawer } from "@/components/attendance/LessonReflectionDrawer";
import { useCockpit } from "@/context/CockpitContext";

function SmartAttendanceContent() {
  const searchParams = useSearchParams();
  const urlSubId = searchParams.get("subjectId");
  const urlClass = searchParams.get("classId");

  const {
    selectedRoom,
    setSelectedRoom,
    selectedSubjectId,
    setSelectedSubjectId,
    activeLens,
    setActiveLens,
    vaultDoc,
    updateStudentScore,
    subjects,
    classrooms,
    currentSubject,
    relevantClassrooms
  } = useCockpit();

  useEffect(() => {
    if (urlSubId && urlSubId !== selectedSubjectId) {
      setSelectedSubjectId(urlSubId);
    }
    if (urlClass && urlClass !== selectedRoom) {
      setSelectedRoom(urlClass);
    }
  }, [urlSubId, urlClass]);

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [activeYearDoc, setActiveYearDoc] = useState<AcademicYearDoc | null>(null);
  const [viewMode, setViewMode] = useState<"seating" | "table">("seating");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedPeriod, setSelectedPeriod] = useState("period-1");
  const dateInputRef = useRef<HTMLInputElement>(null);
  const todayStr = new Date().toISOString().split("T")[0];
  const isToday = selectedDate === todayStr;

  const formatThaiDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      const days = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
      const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      const thaiYear = y + 543;
      return `วัน${days[date.getDay()]}ที่ ${d} ${months[m - 1]} ${thaiYear}`;
    } catch {
      return dateStr;
    }
  };

  const shiftDate = (days: number) => {
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const cur = new Date(y, m - 1, d);
      cur.setDate(cur.getDate() + days);
      const newStr = cur.toISOString().split("T")[0];
      setSelectedDate(newStr);
    } catch (e) {
      console.error(e);
    }
  };
  const [attendance, setAttendance] = useState<{ [studentId: string]: AttendanceStatus }>({});
  const [history, setHistory] = useState<AttendanceHistoryDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Quick Filter State: "all" | "abnormal" (ขาด/ลา/สาย) | "risk" (เสี่ยง ม.ส.)
  const [filterMode, setFilterMode] = useState<"all" | "abnormal" | "risk">("all");

  // Focus Drawer State (Spatial individual student card)
  const [focusStudent, setFocusStudent] = useState<StudentAttendanceSummary | null>(null);

  // Modals
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // 1. Initial Load of Academic Year
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const activeYear = await getActiveAcademicYear();
        if (activeYear) {
          setActiveYearDoc(activeYear);
        }
      } catch (yearErr) {
        console.error("Error fetching active academic year:", yearErr);
      }
    };

    fetchMetadata();
  }, []);

  const handleSubjectChange = (newSubId: string) => {
    setSelectedSubjectId(newSubId);
    const sub = subjects.find(s => s.id === newSubId);
    if (sub) {
      const validRooms = classrooms.filter(c => {
        if (sub.assignedRooms && sub.assignedRooms.length > 0) {
          return sub.assignedRooms.includes(c.name);
        }
        return c.level === sub.level;
      });
      if (validRooms.length > 0) {
        if (!validRooms.some(r => r.name === selectedRoom)) {
          setSelectedRoom(validRooms[0].name);
        }
      } else if (sub.assignedRooms && sub.assignedRooms.length > 0) {
        setSelectedRoom(sub.assignedRooms[0]);
      } else {
        setSelectedRoom(sub.level);
      }
    }
  };

  // 2. Load Students & Attendance
  useEffect(() => {
    if (!selectedRoom || !selectedSubjectId) return;

    const initData = async () => {
      setLoading(true);
      try {
        let studentList = await getStudentsByRoom(selectedRoom);
        if (studentList.length === 0) {
          const all = await getAllStudents();
          studentList = all.filter(s => s.room === selectedRoom || s.classroomId === selectedRoom);
        }
        setStudents(studentList);

        // Fetch attendance history for cumulative calculations
        const historyDocs = await getAttendanceHistory(selectedRoom, selectedSubjectId);
        setHistory(historyDocs);

        // Fetch today's record if existing
        const todayRec = await getAttendanceRecord(selectedRoom, selectedSubjectId, selectedDate, selectedPeriod);
        if (todayRec) {
          setAttendance(todayRec as any);
        } else {
          const defaults: { [id: string]: AttendanceStatus } = {};
          studentList.forEach(s => defaults[s.id] = "present");
          setAttendance(defaults);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [selectedRoom, selectedSubjectId, selectedDate, selectedPeriod]);

  const courseHours = currentSubject?.hours || 80;

  // Mark all present (Quick 1-Click Batch Attendance)
  const handleMarkAllPresent = () => {
    const updated: { [id: string]: AttendanceStatus } = {};
    students.forEach(s => updated[s.id] = "present");
    setAttendance(updated);
    setSaveStatus("เช็กด่วน: มาเรียนครบ 100% เรียบร้อย");
    setTimeout(() => setSaveStatus(null), 2500);
  };

  // Set single student status
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));

    // Update focused student if currently in drawer
    if (focusStudent && focusStudent.studentId === studentId) {
      setFocusStudent(prev => prev ? ({ ...prev }) : null);
    }
  };

  // Save attendance to Firestore
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("กำลังบันทึกเวลาเรียน...");
    try {
      await saveAttendanceRecord(selectedRoom, selectedSubjectId, selectedDate, selectedPeriod, attendance);
      setSaveStatus("บันทึกเวลาเรียนขึ้น Cloud Firestore สำเร็จแล้ว ✅");
      const historyDocs = await getAttendanceHistory(selectedRoom, selectedSubjectId);
      setHistory(historyDocs);
    } catch (err: any) {
      console.error(err);
      setSaveStatus(`บันทึกไม่สำเร็จ: ${err.message || "เกิดข้อผิดพลาด"}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Calculate cumulative attendance summary with courseHours quota
  const allHistoryForCalculation = [
    ...history.filter(h => h.date !== selectedDate || h.period !== selectedPeriod),
    { date: selectedDate, records: attendance }
  ];

  const summaries: StudentAttendanceSummary[] = calculateAttendanceSummaries(
    students,
    allHistoryForCalculation,
    courseHours,
    vaultDoc?.students
  );

  // Group stats for today
  const todayCounts = {
    present: Object.values(attendance).filter(v => v === "present").length,
    absent: Object.values(attendance).filter(v => v === "absent").length,
    leave: Object.values(attendance).filter(v => v === "leave").length,
    late: Object.values(attendance).filter(v => v === "late").length,
    activity: Object.values(attendance).filter(v => v === "activity").length,
  };

  const totalStudents = students.length || 1;
  const todayAttendanceRate = Math.round(((todayCounts.present + todayCounts.leave + todayCounts.late + todayCounts.activity) / totalStudents) * 100);

  // Filter at-risk students (ม.ส. or Chronic Absent)
  const atRiskStudents = summaries.filter(s => s.isRisk || s.isMS);

  // Filtered Students according to Quick Filter Mode
  const displayedStudents = students.filter(student => {
    const todayStatus = attendance[student.id] || "present";
    const sum = summaries.find(s => s.studentId === student.id);

    if (filterMode === "abnormal") {
      return todayStatus !== "present";
    }
    if (filterMode === "risk") {
      return sum?.isRisk || sum?.isMS;
    }
    return true;
  });

  // Copy Parent Notification message
  const handleCopyAlertMessage = () => {
    const lines = [
      `📢 [แจ้งเตือนเวลาเรียนนักเรียนกลุ่มเสี่ยง] โรงเรียนบ้านควนเนียง`,
      `วิชา: ${currentSubject ? `${currentSubject.name} (${currentSubject.code})` : "รายวิชา"} ชั้น ${selectedRoom}`,
      `วันที่ตรวจสอบ: ${selectedDate}`,
      `เกณฑ์เวลาเรียนขั้นต่ำ: 80% (ขาดได้ไม่เกิน ${Math.floor(courseHours * 0.2)} คาบ จาก ${courseHours} คาบ)`,
      `----------------------------------------`,
      ...atRiskStudents.map(s => 
        `• เลขที่ ${s.number} ${s.name}\n  - เวลาเรียนสะสม: ${s.attendancePercent}% (${s.attendedPeriods}/${s.totalPeriods} คาบ)\n  - ขาดเรียนแล้ว: ${s.absent} ครั้ง | โควตาขาดได้อีก: ${s.remainingAllowedAbsences} คาบ\n  - สถานะ: ${s.isMS ? "⚠️ ม.ส. (เวลาเรียนไม่ถึง 80%)" : "⚠️ กลุ่มเสี่ยงเฝ้าระวัง"}`
      ),
      `----------------------------------------`,
      `กรุณาติดต่อครูประจำวิชา (ครูเบนซ์) เพื่อดำเนินการติดตามเวลาเรียนตามระเบียบ สพฐ.`
    ].join("\n");

    navigator.clipboard.writeText(lines);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // Active semester calculation
  const activeTerm = activeYearDoc?.terms?.find(t => t.active) || activeYearDoc?.terms?.[0];
  const isOutsideTerm = activeTerm ? !isDateWithinTerm(selectedDate, activeTerm.startDate, activeTerm.endDate) : false;

  // ว15/2566 Indicator & Active Unit Selection (Grouped by Term 2 Runway vs Term 1 Archive)
  const [selectedIndicatorCode, setSelectedIndicatorCode] = useState<string>("");
  const [showReflectionDrawer, setShowReflectionDrawer] = useState(false);

  const { term2Indicators, term1Indicators, allIndicators } = useMemo(() => {
    if (!currentSubject?.units) return { term2Indicators: [], term1Indicators: [], allIndicators: [] };
    
    const t2List: { code: string; description: string; unitTitle: string }[] = [];
    const t1List: { code: string; description: string; unitTitle: string }[] = [];
    const allList: { code: string; description: string; unitTitle: string }[] = [];

    currentSubject.units.forEach(u => {
      const isTerm2 = u.term === 2;
      const targetList = isTerm2 ? t2List : t1List;

      u.indicatorsBetween?.forEach(ind => {
        if (ind.code && !allList.some(x => x.code === ind.code)) {
          const item = { ...ind, unitTitle: u.title };
          targetList.push(item);
          allList.push(item);
        }
      });
      u.indicatorsEnd?.forEach(ind => {
        if (ind.code && !allList.some(x => x.code === ind.code)) {
          const item = { ...ind, unitTitle: u.title };
          targetList.push(item);
          allList.push(item);
        }
      });
    });

    return { term2Indicators: t2List, term1Indicators: t1List, allIndicators: allList };
  }, [currentSubject]);

  // Default to first Term 2 indicator if available, or first of all
  useEffect(() => {
    if (!selectedIndicatorCode) {
      if (term2Indicators.length > 0) {
        setSelectedIndicatorCode(term2Indicators[0].code);
      } else if (allIndicators.length > 0) {
        setSelectedIndicatorCode(allIndicators[0].code);
      }
    }
  }, [term2Indicators, allIndicators, selectedIndicatorCode]);

  const activeUnit = useMemo(() => {
    if (!currentSubject?.units || !selectedIndicatorCode) return null;
    return currentSubject.units.find(u => 
      u.indicatorsBetween?.some(i => i.code === selectedIndicatorCode) ||
      u.indicatorsEnd?.some(i => i.code === selectedIndicatorCode)
    ) || null;
  }, [currentSubject, selectedIndicatorCode]);

  // Voice Check-in Hook (Web Speech API)
  const voice = useThaiVoiceCheckIn({
    students,
    onUpdateStatus: (studentId, status) => {
      handleStatusChange(studentId, status);
    },
    onMarkAllPresent: () => {
      handleMarkAllPresent();
    }
  });

  return (
    <div className="space-y-6">
      {/* 🚀 COMPACT BENTO HUD BAR (Spatial Dark Command Center) */}
      <div className="rounded-2xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-2xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Cluster 1: Subject & Room & Date Shifter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Shifter Pill */}
            <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1.5 rounded-xl border border-white/10 shadow-xs">
              <button
                type="button"
                onClick={() => shiftDate(-1)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="วันก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div 
                onClick={() => dateInputRef.current?.showPicker?.()}
                className="flex items-center gap-1.5 px-2 cursor-pointer relative"
              >
                <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-slate-200 whitespace-nowrap">
                  {formatThaiDate(selectedDate)}
                </span>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
              <button
                type="button"
                onClick={() => shiftDate(1)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="วันถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Subject Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-slate-200">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={selectedSubjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="bg-transparent outline-none cursor-pointer pr-1 text-slate-200"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {s.code} ({s.level})
                  </option>
                ))}
              </select>
            </div>

            {/* Room Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-slate-200">
              <School className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="bg-transparent outline-none cursor-pointer pr-1 text-slate-200"
              >
                {(relevantClassrooms.length > 0 ? relevantClassrooms : classrooms).map((c) => (
                  <option key={c.id} value={c.name} className="bg-slate-900 text-slate-200">
                    ห้อง {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cluster 2: ว15/2566 Indicator Selector */}
          <div className="flex items-center gap-2 bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-500/30 text-xs font-medium text-slate-200">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase whitespace-nowrap">
              ว15/2566:
            </span>
            <select
              value={selectedIndicatorCode}
              onChange={(e) => setSelectedIndicatorCode(e.target.value)}
              className="bg-transparent outline-none cursor-pointer text-xs font-mono text-slate-200 max-w-[200px] sm:max-w-[280px] truncate"
            >
              <option value="" className="bg-slate-900 text-slate-400">
                -- เลือกตัวชี้วัดประจำคาบ --
              </option>
              {term2Indicators.length > 0 && (
                <optgroup label="🚀 เทอม 2 (รันเวย์สอนสด)" className="bg-slate-950 font-bold text-cyan-400">
                  {term2Indicators.map((ind, idx) => (
                    <option key={`t2-${ind.code}-${idx}`} value={ind.code} className="bg-slate-900 text-slate-200 font-normal">
                      {ind.code} - {ind.description.slice(0, 42)}...
                    </option>
                  ))}
                </optgroup>
              )}
              {term1Indicators.length > 0 && (
                <optgroup label="📦 เทอม 1 (คลังทุนเดิม - ส่งมอบแล้ว)" className="bg-slate-950 font-bold text-indigo-400">
                  {term1Indicators.map((ind, idx) => (
                    <option key={`t1-${ind.code}-${idx}`} value={ind.code} className="bg-slate-900 text-slate-400 font-normal">
                      {ind.code} - {ind.description.slice(0, 42)}...
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Cluster 3: Live Telemetry Numbers */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              <span className="text-emerald-400 font-bold">{todayCounts.present}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e]" />
              <span className="text-rose-400 font-bold">{todayCounts.absent}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              <span className="text-amber-400 font-bold">{todayCounts.leave}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_#fb923c]" />
              <span className="text-orange-400 font-bold">{todayCounts.late}</span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="font-bold text-cyan-300">{todayAttendanceRate}%</span>
          </div>

          {/* Cluster 4: Command Suite */}
          <div className="flex items-center gap-2">
            {/* Voice Check-in Mic Button */}
            <button
              type="button"
              onClick={voice.toggleListening}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                voice.isListening
                  ? "bg-rose-500 text-white shadow-[0_0_16px_rgba(244,63,94,0.6)] animate-pulse"
                  : "bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300"
              }`}
              title={voice.isListening ? "กำลังดักฟังเสียงภาษาไทย (คลิกเพื่อหยุด)" : "คลิกเพื่อสั่งการด้วยเสียง (เช่น 'เลขที่ 5 ขาด', 'ปัณณวัฒน์ มา')"}
            >
              <Mic className={`w-3.5 h-3.5 ${voice.isListening ? "animate-bounce" : ""}`} />
              <span>{voice.isListening ? "กำลังฟัง..." : "เสียง"}</span>
            </button>

            {/* 1-Click All Present */}
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-bold transition-all"
              title="เช็คทุกคนเป็น 'มาเรียน' ในคลิกเดียว"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">มาครบ 100%</span>
            </button>

            {/* 1-Click Reflection Drawer Trigger */}
            <button
              type="button"
              onClick={() => setShowReflectionDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/40 text-indigo-300 text-xs font-bold transition-all"
              title="สร้างบันทึกหลังสอนท้ายคาบอัตโนมัติ"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden sm:inline">สรุปท้ายคาบ</span>
            </button>

            {/* Cloud Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white text-xs font-bold shadow-[0_0_16px_rgba(99,102,241,0.4)] transition-all active:scale-95"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? "บันทึก..." : "บันทึก Cloud"}</span>
            </button>
          </div>

        </div>

        {/* Live Voice Feedback Toast Banner */}
        {voice.lastAction && (
          <div className="px-3 py-2 rounded-xl bg-slate-950/90 border border-cyan-400/30 flex items-center justify-between text-xs text-slate-200 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono text-cyan-300 font-bold">🎙️ Voice Feedback:</span>
              <span>{voice.lastAction.message}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              "{voice.lastAction.rawText}"
            </span>
          </div>
        )}

        {/* Save Status Banner */}
        {saveStatus && (
          <div className="px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-400/30 text-xs font-mono text-cyan-300 animate-in fade-in">
            {saveStatus}
          </div>
        )}
      </div>

      {/* At-Risk Banner (Shown only if there are at-risk students) */}
      {atRiskStudents.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 backdrop-blur-md border border-rose-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
            <span className="text-xs font-bold text-rose-200">
              พบเด็กเสี่ยง ม.ส. ({atRiskStudents.length} คน): {atRiskStudents.map(s => s.name).join(", ")}
            </span>
          </div>
          <button
            onClick={handleCopyAlertMessage}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-mono font-bold text-rose-200 shadow-xs hover:scale-105 transition-all"
          >
            {copySuccess ? "คัดลอกแล้ว" : "คัดลอกแจ้ง LINE"}
          </button>
        </div>
      )}

      {/* 캔버스 Workspace Header (Filter & View Switcher) */}
      <div className="flex items-center justify-between gap-4 px-2">
        {/* Subtle Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-mono">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1 rounded-lg transition-all ${
              filterMode === "all"
                ? "bg-slate-800 text-cyan-300 font-bold border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ALL ({students.length})
          </button>
          <button
            onClick={() => setFilterMode("risk")}
            className={`px-3 py-1 rounded-lg transition-all ${
              filterMode === "risk"
                ? "bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)] font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            AT-RISK ({atRiskStudents.length})
          </button>
        </div>

        {/* View Switcher Pill */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-mono">
          <button
            type="button"
            onClick={() => setViewMode("seating")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              viewMode === "seating"
                ? "bg-slate-800 text-cyan-300 font-bold border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span>ผังห้อง (Grid)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              viewMode === "table"
                ? "bg-slate-800 text-cyan-300 font-bold border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <TableIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>ตาราง (Table)</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Canvas */}
      <div>
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="text-sm font-mono font-semibold">กำลังซิงก์ข้อมูลเวลาเรียน...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 text-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-white/10 text-slate-400 flex items-center justify-center mb-3">
              <Users className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              ยังไม่มีรายชื่อนักเรียนในห้อง {selectedRoom}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mt-1 mb-5 leading-relaxed">
              ในระบบมีรายชื่อของห้อง ป.6 อยู่แล้ว หากคุณครูต้องการบันทึกเวลาเรียนของห้อง {selectedRoom} สามารถเพิ่มรายชื่อนักเรียน หรือนำเข้าไฟล์ Excel ได้ทันทีครับ
            </p>
            <Link
              href="/students"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่ม / นำเข้ารายชื่อนักเรียน (ห้อง {selectedRoom})</span>
            </Link>
          </div>
        ) : viewMode === "seating" ? (
          <div>
            <ClassroomSeatingGrid
              students={displayedStudents}
              attendance={attendance}
              summaries={summaries}
              activeLens={activeLens}
              vaultDoc={vaultDoc}
              onStatusChange={handleStatusChange}
              onSelectStudent={(s) => setFocusStudent(s)}
              onUpdateTerm1Score={updateStudentScore}
            />
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
            <Table className="min-w-[960px]">
              <TableHeader>
                <tr className="bg-slate-950/80 border-b border-white/10 text-xs font-extrabold text-slate-300">
                  <TableHead className="w-[70px] text-center sticky left-0 bg-slate-950 z-20 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                    เลขที่
                  </TableHead>
                  <TableHead className="w-[230px] sticky left-[70px] bg-slate-950 z-20 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                    ชื่อ-นามสกุล นักเรียน
                  </TableHead>
                  <TableHead className="text-center w-[360px]">
                    สถานะคาบนี้ (แตะเพื่อเปลี่ยน)
                  </TableHead>
                  <TableHead className="text-center w-[130px] bg-indigo-950/30">
                    <div className="flex flex-col items-center py-1">
                      <span className="font-bold text-indigo-300">เวลาเรียนสะสม</span>
                      <span className="text-[10px] text-slate-400 font-medium">({allHistoryForCalculation.length} คาบ)</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-[130px] bg-amber-950/30">
                    <div className="flex flex-col items-center py-1">
                      <span className="font-bold text-amber-300">โควตาขาดได้</span>
                      <span className="text-[10px] text-slate-400 font-medium">(เกณฑ์ 80%)</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-[120px] bg-emerald-950/30">
                    <div className="flex flex-col items-center py-1">
                      <span className="font-bold text-emerald-300">สถานะ ม.ส.</span>
                      <span className="text-[10px] text-emerald-400 font-medium">(ขั้นต่ำ 80%)</span>
                    </div>
                  </TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {displayedStudents.map((student) => {
                  const studentStatus = attendance[student.id] || "present";
                  const summary = summaries.find(s => s.studentId === student.id);
                  const remainingQuota = summary?.remainingAllowedAbsences ?? Math.floor(courseHours * 0.2);

                  return (
                    <TableRow 
                      key={student.id} 
                      className="hover:bg-white/[0.03] transition-colors border-b border-white/5 group"
                    >
                      <TableCell className="text-center font-bold text-slate-300 sticky left-0 bg-slate-900 z-10 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                        {student.number}
                      </TableCell>
                      <TableCell 
                        onClick={() => summary && setFocusStudent(summary)}
                        className="sticky left-[70px] bg-slate-900 z-10 shadow-[1px_0_0_0_rgba(255,255,255,0.08)] font-semibold text-slate-100 cursor-pointer hover:text-cyan-400 transition-colors"
                      >
                        <div className="flex items-center justify-between pr-2">
                          <span>{student.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </TableCell>

                      {/* Touch-Friendly Status Radio Pills with Neon Glows */}
                      <TableCell className="p-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, "present")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                              studentStatus === "present"
                                ? "bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)] font-black scale-105"
                                : "bg-white/5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/5"
                            }`}
                          >
                            มา
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, "absent")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                              studentStatus === "absent"
                                ? "bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.5)] font-black scale-105"
                                : "bg-white/5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 border border-white/5"
                            }`}
                          >
                            ขาด
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, "leave")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                              studentStatus === "leave"
                                ? "bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)] font-black scale-105"
                                : "bg-white/5 text-slate-400 hover:bg-amber-500/20 hover:text-amber-300 border border-white/5"
                            }`}
                          >
                            ลา
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, "late")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                              studentStatus === "late"
                                ? "bg-orange-500 text-slate-950 shadow-[0_0_12px_rgba(251,146,60,0.5)] font-black scale-105"
                                : "bg-white/5 text-slate-400 hover:bg-orange-500/20 hover:text-orange-300 border border-white/5"
                            }`}
                          >
                            สาย
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, "activity")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                              studentStatus === "activity"
                                ? "bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)] font-black scale-105"
                                : "bg-white/5 text-slate-400 hover:bg-cyan-500/20 hover:text-cyan-300 border border-white/5"
                            }`}
                          >
                            กิจกรรม
                          </button>
                        </div>
                      </TableCell>

                      {/* Cumulative Percentage */}
                      <TableCell className="text-center bg-indigo-950/20">
                        <div className="flex flex-col items-center">
                          <span className={`font-black text-sm font-mono ${
                            (summary?.attendancePercent || 100) < 80 
                              ? "text-rose-400" 
                              : (summary?.attendancePercent || 100) <= 85 
                              ? "text-amber-400" 
                              : "text-slate-100"
                          }`}>
                            {summary?.attendancePercent}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {summary?.attendedPeriods}/{summary?.totalPeriods} คาบ
                          </span>
                        </div>
                      </TableCell>

                      {/* Quota Remaining (ขาดได้อีกกี่คาบ) */}
                      <TableCell className="text-center bg-amber-950/20">
                        <div className="flex flex-col items-center">
                          <span className={`text-xs font-black font-mono px-2.5 py-0.5 rounded-full ${
                            remainingQuota <= 0
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : remainingQuota <= 3
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-white/5 text-slate-300 border border-white/10"
                          }`}>
                            {remainingQuota <= 0 ? "หมดโควตา" : `ขาดได้อีก ${remainingQuota} คาบ`}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            ขาดแล้ว {summary?.absent || 0} ครั้ง
                          </span>
                        </div>
                      </TableCell>

                      {/* Auto Flag ม.ส. Pill */}
                      <TableCell className="text-center bg-emerald-950/20">
                        {summary?.isMS ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/40 font-black text-xs animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            ติด ม.ส.
                          </span>
                        ) : summary?.isRisk ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold text-xs">
                            เฝ้าระวัง
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs">
                            ปกติ
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          </div>
        )}

        {/* Bottom Ribbon */}
        <div className="p-4 sm:p-5 bg-slate-950/70 border-t border-white/10 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            คำนวณเกณฑ์ ม.ส. อัตโนมัติเมื่อเวลาเรียนต่ำกว่าร้อยละ 80 (วิชานี้เรียน {courseHours} ชม./ปี ขาดได้ไม่เกิน {Math.floor(courseHours * 0.2)} ชม.)
          </span>
          <span className="text-slate-500 font-mono text-[11px]">
            ระบบซิงก์ Cloud Firestore เรียลไทม์
          </span>
        </div>
      </div>

      {/* 360° Student Spatial Inspector Drawer */}
      <StudentInspectorDrawer
        studentSummary={focusStudent}
        history={history}
        currentAttendance={focusStudent ? (attendance[focusStudent.studentId] || "present") : "present"}
        courseHours={courseHours}
        onClose={() => setFocusStudent(null)}
        onStatusChange={handleStatusChange}
      />

      {/* Modal: Smart Alert Hub Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/15 max-h-[85vh] flex flex-col text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-inner">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">ระบบเตือนอัจฉริยะ (Smart Alert Hub)</h3>
                  <p className="text-xs text-slate-400">รายงานนักเรียนกลุ่มเสี่ยงติด ม.ส. (&lt; 80%) และติดตามเวลาเรียน</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAlertModal(false)}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
              {atRiskStudents.length === 0 ? (
                <div className="p-8 text-center bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <h4 className="font-bold text-emerald-300 text-sm">ไม่มีนักเรียนกลุ่มเสี่ยง</h4>
                  <p className="text-xs text-emerald-400/80 mt-1">นักเรียนทุกคนในห้องมีเวลาเรียนเกินร้อยละ 80 ตามเกณฑ์ สพฐ. เรียบร้อยครับ</p>
                </div>
              ) : (
                atRiskStudents.map((s) => (
                  <div key={s.studentId} className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold flex items-center justify-center text-xs font-mono">
                        #{s.number}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-100 text-sm">{s.name}</h4>
                        <p className="text-xs text-slate-400">รหัส: {s.studentCode} • ขาดแล้ว {s.absent} ครั้ง (โควตาขาดได้อีก {s.remainingAllowedAbsences} คาบ)</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-400">เวลาเรียน: </span>
                        <span className="text-sm font-black text-rose-400 font-mono">{s.attendancePercent}%</span>
                      </div>
                      {s.isMS ? (
                        <span className="px-3 py-1 rounded-full bg-rose-500 text-white font-black text-xs shadow-sm">
                          ติด ม.ส.
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-bold text-xs shadow-sm">
                          เสี่ยง ม.ส.
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                onClick={handleCopyAlertMessage}
                disabled={atRiskStudents.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs transition-colors disabled:opacity-50"
              >
                <Copy className="w-4 h-4" />
                <span>{copySuccess ? "คัดลอกข้อความแล้ว! ✅" : "คัดลอกข้อความแจ้งผู้ปกครอง (LINE)"}</span>
              </button>

              <button
                onClick={() => setShowAlertModal(false)}
                className="px-6 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Dynamic Context Island (Bottom-Center Capsule) */}
      <DynamicIsland
        statusIcon={
          isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          ) : (
            <div className={`w-2.5 h-2.5 rounded-full ${todayAttendanceRate >= 80 ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-rose-400 shadow-[0_0_8px_#f87171]"} animate-pulse`} />
          )
        }
        statusText={
          <span>
            {saveStatus || `มาเรียน ${todayCounts.present}/${totalStudents} คน (${todayAttendanceRate}%)`}
          </span>
        }
        badge={
          atRiskStudents.length > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px] animate-pulse">
              เสี่ยง ม.ส. {atRiskStudents.length} คน
            </span>
          ) : undefined
        }
        actions={
          <div className="flex items-center gap-1.5">
            {/* View Switcher Pill */}
            <button
              type="button"
              onClick={() => setViewMode(prev => prev === "seating" ? "table" : "seating")}
              className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              title="สลับมุมมองผังที่นั่ง / ตาราง"
            >
              {viewMode === "seating" ? (
                <>
                  <TableIcon className="w-3.5 h-3.5 text-cyan-300" />
                  <span className="hidden sm:inline">ดูตาราง</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="w-3.5 h-3.5 text-indigo-300" />
                  <span className="hidden sm:inline">ดูผังห้อง</span>
                </>
              )}
            </button>

            {/* 1-Click Mark All */}
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              title="เช็กมาครบทุกคนใน 1 คลิก"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">มาครบ</span>
            </button>

            {/* Cloud Save Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 hover:scale-[1.03] active:scale-[0.98]"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? "บันทึก..." : "บันทึก Cloud"}</span>
            </button>
          </div>
        }
      />

      {/* 1-Click Lesson Reflection Drawer (Active Learning & Reflection Notes) */}
      <LessonReflectionDrawer
        isOpen={showReflectionDrawer}
        onClose={() => setShowReflectionDrawer(false)}
        date={selectedDate}
        subject={currentSubject || null}
        room={selectedRoom}
        students={students}
        attendance={attendance}
        selectedIndicatorCode={selectedIndicatorCode}
        activeUnit={activeUnit}
      />
    </div>
  );
}

export default function SmartAttendancePage() {
  return (
    <Suspense fallback={
      <div className="py-24 flex flex-col items-center justify-center text-white/80 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-300" />
        <span className="text-sm font-bold">กำลังเปิดระบบบันทึกเวลาเรียน...</span>
      </div>
    }>
      <SmartAttendanceContent />
    </Suspense>
  );
}

