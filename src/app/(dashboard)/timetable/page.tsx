"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  CalendarDays, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Flame, 
  BookOpen, 
  Users, 
  FileSpreadsheet, 
  Printer, 
  Layers, 
  Compass,
  GraduationCap,
  ShieldCheck
} from "lucide-react";
import { 
  TIMETABLE_PERIODS, 
  TIMETABLE_DAYS, 
  TIMETABLE_SLOTS, 
  TimetableSlot, 
  getCurrentPeriodSlot, 
  getTimetableSummaryStats 
} from "@/lib/data/timetableData";
import { useCockpit } from "@/context/CockpitContext";

export default function TimetablePage() {
  const router = useRouter();
  const { setSelectedRoom, setSelectedSubjectId } = useCockpit();

  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);

  // Live clock tick
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 30000); // tick every 30s
    return () => clearInterval(timer);
  }, []);

  const stats = getTimetableSummaryStats();
  const activeStatus = currentTime ? getCurrentPeriodSlot(currentTime) : { slot: null, status: "after_school" as const, currentPeriodNumber: null };
  const currentSlot = activeStatus.slot;

  // Jump to Attendance with preselected room & subject
  const handleLaunchAttendance = (slot: TimetableSlot) => {
    if (slot.room && slot.room !== "-" && slot.room !== "ทุกระดับชั้น" && slot.room !== "คณะครู") {
      setSelectedRoom(slot.room);
    }
    if (slot.subjectId) {
      setSelectedSubjectId(slot.subjectId);
    }
    router.push("/attendance");
  };

  // Jump to Scores with preselected room & subject
  const handleLaunchScores = (slot: TimetableSlot) => {
    if (slot.room && slot.room !== "-" && slot.room !== "ทุกระดับชั้น" && slot.room !== "คณะครู") {
      setSelectedRoom(slot.room);
    }
    if (slot.subjectId) {
      setSelectedSubjectId(slot.subjectId);
    }
    router.push("/scores");
  };

  const getSlotCategoryColor = (category: TimetableSlot["category"], isCurrent: boolean) => {
    if (isCurrent) {
      return "bg-gradient-to-br from-indigo-600/30 via-cyan-500/20 to-slate-900 border-indigo-400/80 shadow-[0_0_24px_rgba(99,102,241,0.4)]";
    }
    switch (category) {
      case "core_social":
        return "bg-indigo-950/30 hover:bg-indigo-900/40 border-indigo-500/20 hover:border-indigo-400/50 text-indigo-200";
      case "core_history":
        return "bg-amber-950/30 hover:bg-amber-900/40 border-amber-500/20 hover:border-amber-400/50 text-amber-200";
      case "art":
        return "bg-rose-950/30 hover:bg-rose-900/40 border-rose-500/20 hover:border-rose-400/50 text-rose-200";
      case "development":
        return "bg-emerald-950/30 hover:bg-emerald-900/40 border-emerald-500/20 hover:border-emerald-400/50 text-emerald-200";
      case "plc":
        return "bg-purple-950/30 hover:bg-purple-900/40 border-purple-500/20 hover:border-purple-400/50 text-purple-200";
      default:
        return "bg-slate-950/30 border-white/5 text-slate-600 hover:border-white/10";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header Banner & Live Period Radar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
            <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
            <span>ภาคเรียนที่ 2 ปีการศึกษา 2569 • โรงเรียนบ้านควนเนียง</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>ตารางสอน คุณครูพิชญุตม์ ประภาศิริ</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            สพป.สุราษฎร์ธานี เขต 3 • รวมภาระงานสอนและกิจกรรมพัฒนาผู้เรียน 28 ชั่วโมง/สัปดาห์
          </p>
        </div>

        {/* Live Period Banner */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 relative z-10">
          {currentSlot && currentSlot.category !== "empty" ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-indigo-950/70 border border-indigo-400/50 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <div>
                <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider block">
                  กำลังสอนอยู่ในคาบนี้ (LIVE)
                </span>
                <span className="text-xs sm:text-sm font-bold text-white">
                  คาบ {currentSlot.periodNumber}: {currentSlot.subjectName} ({currentSlot.room})
                </span>
              </div>
              <button
                onClick={() => handleLaunchAttendance(currentSlot)}
                className="ml-2 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md transition-all active:scale-95"
              >
                <span>เข้าห้องเรียน</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="px-4 py-3 rounded-2xl bg-slate-950/60 border border-white/10 text-xs font-mono text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>
                {activeStatus.status === "lunch" ? "🍱 เวลาพักกลางวัน (11.30-12.30 น.)" :
                 activeStatus.status === "weekend" ? "🌿 วันหยุดสุดสัปดาห์ (ไม่มีการเรียนการสอน)" :
                 activeStatus.status === "before_school" ? "☀️ ก่อนเวลาเข้าเรียน (เริ่ม 08.30 น.)" :
                 "🌙 หลังเลิกเรียน / นอกเวลาสอนสด"}
              </span>
            </div>
          )}

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all"
            title="พิมพ์ตารางสอน"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">พิมพ์ตาราง</span>
          </button>
        </div>
      </div>

      {/* 2. Workload Metrics Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>ภาระงานรวม</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {stats.totalWeeklyHours} <span className="text-xs text-slate-400 font-sans font-normal">ชม./สัปดาห์</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">สอน 23 คาบ + PLC 5 คาบ</span>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-indigo-300">
            <span>สังคม & ประวัติฯ</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black font-mono text-indigo-300">
            {stats.coreSocialHours + stats.coreHistoryHours} <span className="text-xs text-indigo-400/80 font-sans font-normal">ชม./สัปดาห์</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">สังคม 8 ชม. + ประวัติ 2 ชม.</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-rose-300">
            <span>กลุ่มสาระศิลปะ</span>
            <Compass className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-300">
            {stats.artHours} <span className="text-xs text-rose-400/80 font-sans font-normal">ชม./สัปดาห์</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">ป.1 ถึง ป.6 (ชั้นละ 1 ชม.)</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-300">
            <span>พัฒนาผู้เรียน/ซ่อมเสริม</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-300">
            {stats.developmentHours} <span className="text-xs text-emerald-400/80 font-sans font-normal">ชม./สัปดาห์</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">แนะแนว, ลูกเสือ, ชุมนุม, ซ่อม</span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs font-mono text-purple-300">
            <span>ชั่วโมง PLC</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-300">
            {stats.plcHours} <span className="text-xs text-purple-400/80 font-sans font-normal">ชม./สัปดาห์</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">จันทร์-ศุกร์ (15.30-16.30)</span>
        </div>
      </div>

      {/* 3. The Interactive Spatial Timetable Grid */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-2xl overflow-x-auto">
        <div className="min-w-[980px]">
          
          {/* Header Row: Periods & Timestamps */}
          <div className="grid grid-cols-[110px_repeat(3,1fr)_80px_repeat(4,1fr)] gap-2 pb-3 border-b border-white/10 text-center text-xs font-mono font-bold text-slate-400">
            <div className="flex items-center justify-center p-2 rounded-xl bg-slate-950 border border-white/5 text-slate-300">
              วัน \ เวลา
            </div>
            {TIMETABLE_PERIODS.slice(0, 3).map((p) => (
              <div key={p.periodNumber} className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-indigo-300 block font-black">คาบ {p.periodNumber}</span>
                <span className="text-[10px] text-slate-500 font-normal">{p.timeLabel}</span>
              </div>
            ))}
            
            {/* Lunch Divider Header */}
            <div className="flex flex-col items-center justify-center p-1 rounded-xl bg-slate-950/80 border border-white/5 text-[10px] text-amber-400 font-sans font-bold">
              <span>พัก</span>
              <span>11.30-12.30</span>
            </div>

            {TIMETABLE_PERIODS.slice(3).map((p) => (
              <div key={p.periodNumber} className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
                <span className="text-indigo-300 block font-black">
                  {p.periodNumber === 7 ? "กิจกรรม / PLC" : `คาบ ${p.periodNumber}`}
                </span>
                <span className="text-[10px] text-slate-500 font-normal">{p.timeLabel}</span>
              </div>
            ))}
          </div>

          {/* Days Rows */}
          <div className="space-y-2.5 pt-3">
            {TIMETABLE_DAYS.map((day) => {
              const isToday = currentTime ? currentTime.getDay() === day.dayIndex : false;

              return (
                <div 
                  key={day.dayIndex} 
                  className={`grid grid-cols-[110px_repeat(3,1fr)_80px_repeat(4,1fr)] gap-2 items-stretch ${
                    isToday ? "relative before:absolute before:-left-2 before:top-0 before:bottom-0 before:w-1 before:bg-cyan-400 before:rounded-full" : ""
                  }`}
                >
                  
                  {/* Day Badge */}
                  <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border font-bold text-sm tracking-wide ${day.bgClass} ${
                    isToday ? "ring-1 ring-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]" : ""
                  }`}>
                    <span>วัน{day.name}</span>
                    {isToday && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-400 text-slate-950 font-black mt-1 uppercase">
                        วันนี้
                      </span>
                    )}
                  </div>

                  {/* Periods 1, 2, 3 */}
                  {[1, 2, 3].map((periodNum) => {
                    const slot = TIMETABLE_SLOTS.find(s => s.dayIndex === day.dayIndex && s.periodNumber === periodNum);
                    if (!slot) return <div key={periodNum} className="rounded-2xl bg-slate-950/20 border border-white/5" />;

                    const isCurrent = isToday && activeStatus.currentPeriodNumber === periodNum;

                    return (
                      <div
                        key={periodNum}
                        onClick={() => slot.category !== "empty" && setSelectedSlot(slot)}
                        className={`p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between group cursor-pointer ${
                          getSlotCategoryColor(slot.category, isCurrent)
                        } ${slot.category === "empty" ? "cursor-default opacity-40 hover:opacity-40" : "hover:scale-[1.02] active:scale-[0.98]"}`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                            <span className="opacity-70">{slot.timeLabel}</span>
                            {slot.room && slot.room !== "-" && (
                              <span className="px-1.5 py-0.5 rounded-md bg-white/10 font-bold font-sans">
                                {slot.room}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-white leading-tight">
                            {slot.subjectName}
                          </h4>
                          {slot.subjectCode && (
                            <span className="text-[10px] font-mono opacity-60 block mt-0.5">
                              {slot.subjectCode}
                            </span>
                          )}
                        </div>

                        {slot.category !== "empty" && (
                          <div className="pt-2 mt-1 border-t border-white/5 flex items-center justify-between text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-cyan-400">คลิกจัดการคาบ</span>
                            <ArrowRight className="w-3 h-3 text-cyan-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Lunch Column */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-950/40 border border-white/5 text-slate-500 font-sans text-xs">
                    <span className="writing-vertical [writing-mode:vertical-rl] tracking-widest text-[11px] font-medium">
                      พักกลางวัน
                    </span>
                  </div>

                  {/* Periods 4, 5, 6, 7 */}
                  {[4, 5, 6, 7].map((periodNum) => {
                    const slot = TIMETABLE_SLOTS.find(s => s.dayIndex === day.dayIndex && s.periodNumber === periodNum);
                    if (!slot) return <div key={periodNum} className="rounded-2xl bg-slate-950/20 border border-white/5" />;

                    const isCurrent = isToday && activeStatus.currentPeriodNumber === periodNum;

                    return (
                      <div
                        key={periodNum}
                        onClick={() => slot.category !== "empty" && setSelectedSlot(slot)}
                        className={`p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between group cursor-pointer ${
                          getSlotCategoryColor(slot.category, isCurrent)
                        } ${slot.category === "empty" ? "cursor-default opacity-40 hover:opacity-40" : "hover:scale-[1.02] active:scale-[0.98]"}`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                            <span className="opacity-70">{slot.timeLabel}</span>
                            {slot.room && slot.room !== "-" && (
                              <span className="px-1.5 py-0.5 rounded-md bg-white/10 font-bold font-sans">
                                {slot.room}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-white leading-tight">
                            {slot.subjectName}
                          </h4>
                          {slot.subjectCode && (
                            <span className="text-[10px] font-mono opacity-60 block mt-0.5">
                              {slot.subjectCode}
                            </span>
                          )}
                        </div>

                        {slot.category !== "empty" && (
                          <div className="pt-2 mt-1 border-t border-white/5 flex items-center justify-between text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-cyan-400">คลิกจัดการคาบ</span>
                            <ArrowRight className="w-3 h-3 text-cyan-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* 4. Slot Quick Action Modal / Drawer */}
      {selectedSlot && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedSlot(null)}
        >
          <div 
            className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-white/15 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  วัน{selectedSlot.dayName} • คาบ {selectedSlot.periodNumber} ({selectedSlot.timeLabel} น.)
                </span>
                <h3 className="text-xl font-black text-white mt-2">
                  {selectedSlot.subjectName} {selectedSlot.room !== "-" ? `(ชั้น ${selectedSlot.room})` : ""}
                </h3>
                {selectedSlot.subjectCode && (
                  <p className="text-xs font-mono text-cyan-400 mt-0.5">
                    รหัสวิชา: {selectedSlot.subjectCode}
                  </p>
                )}
              </div>
              <button 
                onClick={() => setSelectedSlot(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">ประเภทรายวิชา:</span>
                <span className="font-bold">
                  {selectedSlot.category === "core_social" ? "สาระสังคมศึกษา (พื้นฐาน)" :
                   selectedSlot.category === "core_history" ? "สาระประวัติศาสตร์ (พื้นฐาน)" :
                   selectedSlot.category === "art" ? "สาระศิลปะ (พื้นฐาน)" :
                   selectedSlot.category === "development" ? "กิจกรรมพัฒนาผู้เรียน / ซ่อมเสริม" :
                   "งานสนับสนุนการจัดการเรียนรู้ (PLC)"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">สถานที่ / ห้องเรียน:</span>
                <span className="font-mono font-bold text-slate-200">{selectedSlot.room}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">เวลาทำการสอน:</span>
                <span className="font-mono text-indigo-300 font-bold">{selectedSlot.timeLabel} น. (60 นาที)</span>
              </div>
            </div>

            {/* Direct Cockpit Navigation Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleLaunchAttendance(selectedSlot)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
              >
                <Users className="w-4 h-4" />
                <span>เปิดห้องเรียนและเช็กชื่อคาบนี้ (Smart Attendance)</span>
              </button>

              <button
                onClick={() => handleLaunchScores(selectedSlot)}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <span>เปิดสมุดคะแนนและรอยต่อ 50:50 (Scores & Grade)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Official Endorsement Signatures (ตามเอกสารทางการ) */}
      <div className="p-6 rounded-3xl bg-slate-950/60 border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8 text-center text-xs text-slate-400">
        <div className="space-y-2">
          <div className="h-10 flex items-center justify-center">
            <span className="font-cursive text-indigo-400 italic text-base">รัชฎาภรณ์ จักกระหวัด</span>
          </div>
          <p className="font-bold text-slate-200">(ว่าที่ร้อยหญิงรัชฎาภรณ์ จักกระหวัด)</p>
          <p className="text-[11px] text-slate-400">หัวหน้างานบริหารวิชาการ</p>
        </div>

        <div className="space-y-2">
          <div className="h-10 flex items-center justify-center">
            <span className="font-cursive text-cyan-400 italic text-base">อังศุมาวรรณ ฉวาง</span>
          </div>
          <p className="font-bold text-slate-200">(นางสาวอังศุมาวรรณ ฉวาง)</p>
          <p className="text-[11px] text-slate-400">ผู้อำนวยการโรงเรียนบ้านควนเนียง</p>
        </div>
      </div>

    </div>
  );
}
