"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Award, 
  Layers, 
  CheckCircle2, 
  ChevronRight,
  FileText,
  Calendar,
  Share2,
  BookmarkCheck,
  ChevronDown,
  Sparkles,
  ExternalLink,
  ChevronUp,
  FolderArchive,
  Rocket,
  Check
} from "lucide-react";
import { 
  getSubjectById, 
  SubjectDoc, 
  CurriculumUnit 
} from "@/lib/firebase/services";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SubjectCurriculumDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const subjectId = resolvedParams.id;

  const [subject, setSubject] = useState<SubjectDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<CurriculumUnit | null>(null);
  const [mobileExpandedIndex, setMobileExpandedIndex] = useState<number | null>(0);
  const [isTerm1ArchiveOpen, setIsTerm1ArchiveOpen] = useState(false);

  useEffect(() => {
    async function fetchSubject() {
      setLoading(true);
      try {
        const data = await getSubjectById(subjectId);
        setSubject(data);
        if (data?.units && data.units.length > 0) {
          // Default selection to first Term 2 unit (Active Runway), fallback to first unit
          const t2First = data.units.find(u => u.term === 2);
          setSelectedUnit(t2First || data.units[0]);
        }
      } catch (err) {
        console.error("Error fetching subject details:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubject();
  }, [subjectId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-xs text-slate-400 uppercase tracking-widest">กำลังโหลดโครงสร้างหลักสูตร...</p>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
          <BookOpen className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">ไม่พบข้อมูลรายวิชา</h2>
        <p className="text-sm text-slate-400 mt-1 mb-6">รหัสวิชานี้อาจยังไม่ได้ถูกซิงก์หรือถูกลบออกจากระบบ</p>
        <Link 
          href="/subjects" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs uppercase tracking-wider transition-colors border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้ารายวิชา</span>
        </Link>
      </div>
    );
  }

  const units = subject.units || [];
  const term2Units = units.filter(u => u.term === 2);
  const term1Units = units.filter(u => u.term === 1);

  // Statistics
  const totalBetween = units.reduce((acc, u) => acc + (u.indicatorsBetween?.length || 0), 0);
  const totalEnd = units.reduce((acc, u) => acc + (u.indicatorsEnd?.length || 0), 0);

  const handleUnitClick = (u: CurriculumUnit, idx: number) => {
    setSelectedUnit(u);
    setMobileExpandedIndex(mobileExpandedIndex === idx ? null : idx);
  };

  return (
    <div className="min-h-screen pb-20 space-y-6 animate-in fade-in duration-500 text-slate-100">
      
      {/* 1. Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <Link 
            href="/subjects"
            className="w-10 h-10 rounded-2xl border border-white/10 hover:border-cyan-400/50 bg-slate-900/80 hover:bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md"
            title="กลับหน้ารายวิชาทั้งหมด"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-cyan-300 border border-indigo-500/30">
                {subject.code}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ระดับ {subject.level} • {subject.type === "basic" ? "วิชาพื้นฐาน" : "วิชาเพิ่มเติม"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-0.5">
              {subject.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/attendance?subjectId=${subject.id}&classId=${subject.assignedRooms?.[0] || "ป.6"}`}
            className="px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>เข้าห้องเรียนสด</span>
          </Link>
          <Link
            href={`/scores?subjectId=${subject.id}&classId=${subject.assignedRooms?.[0] || "ป.6"}`}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(99,102,241,0.3)]"
          >
            <Award className="w-3.5 h-3.5" />
            <span>สมุดบันทึก ปพ.5</span>
          </Link>
        </div>
      </div>

      {/* 2. Bento Summary Strip (Spatial Dark Translucent Glass) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-lg flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider">เวลาเรียนตลอดปี</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-100">{subject.hours}</span>
            <span className="text-xs text-slate-400 font-sans">ชม. / {subject.credits} หน่วยกิต</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-lg flex flex-col justify-between">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider">โครงสร้างหน่วยการเรียน</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-cyan-400">{units.length}</span>
            <span className="text-xs text-slate-400 font-sans">หน่วย (เทอม 1: {term1Units.length} | เทอม 2: {term2Units.length})</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-amber-500/20 bg-amber-950/20 shadow-lg flex flex-col justify-between">
          <span className="text-[11px] text-amber-400 uppercase tracking-wider">ระหว่างทาง (FORMATIVE)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-300">{totalBetween}</span>
            <span className="text-xs text-amber-400/80 font-sans">ตัวชี้วัด</span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-emerald-500/20 bg-emerald-950/20 shadow-lg flex flex-col justify-between">
          <span className="text-[11px] text-emerald-400 uppercase tracking-wider">ปลายทาง (SUMMATIVE ว15)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-300">{totalEnd}</span>
            <span className="text-xs text-emerald-400/80 font-sans">ตัวชี้วัด (ว15/2566)</span>
          </div>
        </div>
      </div>

      {/* 3. Units Master-Detail Matrix (Term 2 Runway vs Term 1 Archive) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Dual-Epoch Units Partition */}
        <div className="md:col-span-5 lg:col-span-5 space-y-6 md:max-h-[calc(100vh-280px)] md:overflow-y-auto md:pr-2 scrollbar-thin">
          
          {/* SECTION A: TERM 2 ACTIVE RUNWAY (Expanded by default) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center">
                  <Rocket className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                    <span>รันเวย์สอนสด เทอม 2</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans">หน่วยการเรียนรู้ที่กำลังดำเนินการสอนในภาคเรียนปัจจุบัน</p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-bold">
                {term2Units.length} หน่วย
              </span>
            </div>

            {term2Units.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 text-center text-xs text-slate-500">
                ไม่มีหน่วยการเรียนรู้ในเทอม 2
              </div>
            ) : (
              term2Units.map((u, idx) => {
                const isSelected = selectedUnit?.title === u.title && selectedUnit?.term === u.term;
                const isMobileOpen = mobileExpandedIndex === idx;

                return (
                  <div
                    key={`t2-${u.unitNumber}-${idx}`}
                    className={`rounded-2xl border transition-all ${
                      isSelected 
                        ? "bg-slate-900/95 border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50" 
                        : "bg-slate-900/60 hover:bg-slate-900/90 border-white/10 hover:border-white/20 shadow-sm"
                    }`}
                  >
                    <div 
                      onClick={() => handleUnitClick(u, idx)}
                      className="p-4 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
                            isSelected ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white" : "bg-slate-800 text-slate-300 border border-white/5"
                          }`}>
                            หน่วยที่ {u.unitNumber}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-950/50 text-cyan-300 border border-cyan-500/30">
                            เทอม 2
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            {u.hours} ชม.
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-slate-300">{u.scoreWeight} คะแนน</span>
                          <div className="md:hidden ml-1">
                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isMobileOpen ? "rotate-180" : ""}`} />
                          </div>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-100 line-clamp-1">
                        {u.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        สาระ: {u.strand}
                      </p>

                      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/5 text-[11px] font-mono">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          ระหว่างทาง: {u.indicatorsBetween?.length || 0}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          ปลายทาง: {u.indicatorsEnd?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* SECTION B: TERM 1 BASELINE ARCHIVE (Collapsible Accordion) */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsTerm1ArchiveOpen(prev => !prev)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/10 transition-all text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
                  <FolderArchive className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-200">
                      📦 คลังทุนเดิม เทอม 1 (Archive)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {term1Units.length} หน่วย
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans">
                    หน่วยที่ส่งมอบคะแนนรวมก้อนเดียวเรียบร้อยแล้ว
                  </p>
                </div>
              </div>

              <div className="text-slate-400 p-1">
                {isTerm1ArchiveOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {/* Accordion Content for Term 1 */}
            {isTerm1ArchiveOpen && (
              <div className="space-y-2.5 pl-2 border-l-2 border-indigo-500/30 animate-in fade-in slide-in-from-top-2 duration-200">
                {term1Units.map((u, idx) => {
                  const isSelected = selectedUnit?.title === u.title && selectedUnit?.term === u.term;

                  return (
                    <div
                      key={`t1-${u.unitNumber}-${idx}`}
                      onClick={() => handleUnitClick(u, idx)}
                      className={`rounded-2xl border p-3.5 cursor-pointer transition-all ${
                        isSelected 
                          ? "bg-slate-900/95 border-indigo-400/60 shadow-[0_0_16px_rgba(99,102,241,0.25)] ring-1 ring-indigo-400/50" 
                          : "bg-slate-900/40 hover:bg-slate-900/70 border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/5">
                            หน่วยที่ {u.unitNumber}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                            เทอม 1
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                          <span>{u.hours} ชม.</span>
                          <span>•</span>
                          <span>{u.scoreWeight} คะแนน</span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-200 line-clamp-1">
                        {u.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        สาระ: {u.strand}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Master Inspector Detail Panel (Spatial Dark Obsidian) */}
        <div className="hidden md:block md:col-span-7 lg:col-span-7 sticky top-4 md:max-h-[calc(100vh-280px)] md:overflow-y-auto pr-1">
          {selectedUnit ? (
            <div className="p-6 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl space-y-6">
              
              {/* Unit Title Header */}
              <div className="border-b border-white/10 pb-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-mono text-xs font-bold shadow-md">
                      หน่วยการเรียนรู้ที่ {selectedUnit.unitNumber}
                    </span>
                    <span className={`px-2.5 py-1 rounded-xl font-mono text-xs border ${
                      selectedUnit.term === 2 
                        ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/30" 
                        : "bg-indigo-950/60 text-indigo-300 border-indigo-500/30"
                    }`}>
                      ภาคเรียนที่ {selectedUnit.term}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      {selectedUnit.hours} คาบ/ชั่วโมง
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" />
                      น้ำหนัก {selectedUnit.scoreWeight} คะแนน
                    </span>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-slate-100 mt-3">
                  {selectedUnit.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  สาระการเรียนรู้: <span className="font-semibold text-slate-200">{selectedUnit.strand}</span>
                </p>
              </div>

              {/* Formative Indicators (ระหว่างทาง) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    ตัวชี้วัดระหว่างทาง (Formative Indicators)
                  </h4>
                  <span className="font-mono text-xs text-amber-300 font-bold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    {selectedUnit.indicatorsBetween?.length || 0} ตัวชี้วัด
                  </span>
                </div>

                {selectedUnit.indicatorsBetween && selectedUnit.indicatorsBetween.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUnit.indicatorsBetween.map((ind, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs">
                        <div className="font-mono font-bold text-amber-300 mb-1">
                          {ind.code || "ตัวชี้วัดระหว่างทาง"}
                        </div>
                        <p className="text-slate-300 leading-relaxed font-sans">
                          {ind.description || ind.code}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    หน่วยนี้ไม่มีตัวชี้วัดระหว่างทางกำหนดไว้โดยเฉพาะ
                  </p>
                )}
              </div>

              {/* Summative Indicators (ปลายทาง) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    ตัวชี้วัดปลายทาง (Summative Indicators)
                  </h4>
                  <span className="font-mono text-xs text-emerald-300 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    {selectedUnit.indicatorsEnd?.length || 0} ตัวชี้วัด (ว15/2566)
                  </span>
                </div>

                {selectedUnit.indicatorsEnd && selectedUnit.indicatorsEnd.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUnit.indicatorsEnd.map((ind, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs">
                        <div className="font-mono font-bold text-emerald-300 mb-1">
                          {ind.code || "ตัวชี้วัดปลายทาง"}
                        </div>
                        <p className="text-slate-300 leading-relaxed font-sans">
                          {ind.description || ind.code}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-950/60 rounded-xl border border-white/5">
                    หน่วยนี้ไม่มีตัวชี้วัดปลายทางกำหนดไว้
                  </p>
                )}
              </div>

              {/* Sub-Topics (สาระการเรียนรู้ย่อย) */}
              {selectedUnit.learningTopics && selectedUnit.learningTopics.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    หัวข้อการจัดการเรียนรู้ (Topics)
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUnit.learningTopics.map((top, tIdx) => (
                      <span key={tIdx} className="px-3 py-1 rounded-xl bg-slate-950/80 border border-white/10 text-slate-300 text-xs">
                        {top}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Ribbon */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-500">
                  {selectedUnit.term === 2 ? "🚀 รันเวย์สอนสด เทอม 2" : "📦 คลังทุนเดิม เทอม 1"}
                </span>
                <Link
                  href={`/attendance?subjectId=${subject.id}&unit=${selectedUnit.unitNumber}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>เริ่มสอนหน่วยนี้ (เช็คชื่อ & ตัวชี้วัด)</span>
                </Link>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-white/10 text-slate-500 font-mono text-xs">
              เลือกหน่วยการเรียนรู้ทางซ้ายเพื่อดูรายละเอียดตัวชี้วัด
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
