"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  Plus, 
  Power, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  X, 
  Loader2, 
  CalendarDays, 
  Save, 
  Check, 
  AlertCircle 
} from "lucide-react";
import { 
  getAcademicYears, 
  saveAcademicYear, 
  setActiveAcademicYear as setFirestoreActiveAcademicYear, 
  deleteAcademicYear as deleteFirestoreAcademicYear,
  AcademicYearDoc 
} from "@/lib/firebase/services";
import { 
  toIsoDate, 
  toThaiDateString, 
  calculateSchoolDays 
} from "@/lib/dateUtils";

interface TermEditState {
  yearId: string;
  year: number;
  termNum: number;
  startDateIso: string;
  endDateIso: string;
  active: boolean;
}

export default function AcademicYearsPage() {
  const [academicYears, setAcademicYears] = useState<AcademicYearDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newYear, setNewYear] = useState(2569);
  const [newYearTerm1Start, setNewYearTerm1Start] = useState("");
  const [newYearTerm1End, setNewYearTerm1End] = useState("");
  const [newYearTerm2Start, setNewYearTerm2Start] = useState("");
  const [newYearTerm2End, setNewYearTerm2End] = useState("");
  const [newYearIsActive, setNewYearIsActive] = useState(false);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingTerm, setEditingTerm] = useState<TermEditState | null>(null);
  const [isSavingTerm, setIsSavingTerm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchYears = async () => {
    setLoading(true);
    try {
      let years = await getAcademicYears();
      if (years.length === 0) {
        // Seed initial default years
        const defaults: AcademicYearDoc[] = [
          {
            id: "2568",
            year: 2568,
            isActive: true,
            terms: [
              { num: 1, active: true, startDate: "16 พ.ค. 2568", endDate: "10 ต.ค. 2568" },
              { num: 2, active: false, startDate: "1 พ.ย. 2568", endDate: "31 มี.ค. 2569" },
            ],
          },
          {
            id: "2567",
            year: 2567,
            isActive: false,
            terms: [
              { num: 1, active: false, startDate: "16 พ.ค. 2567", endDate: "10 ต.ค. 2567" },
              { num: 2, active: false, startDate: "1 พ.ย. 2567", endDate: "31 มี.ค. 2568" },
            ],
          },
        ];
        for (const item of defaults) {
          await saveAcademicYear(item);
        }
        years = defaults;
      }
      setAcademicYears(years);
    } catch (err) {
      console.error("Error loading academic years:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  // Update defaults when newYear changes
  useEffect(() => {
    const cYear = newYear > 2400 ? newYear - 543 : newYear;
    setNewYearTerm1Start(`${cYear}-05-16`);
    setNewYearTerm1End(`${cYear}-10-10`);
    setNewYearTerm2Start(`${cYear}-11-01`);
    setNewYearTerm2End(`${cYear + 1}-03-31`);
  }, [newYear]);

  const toggleTerm = async (yearId: string, termNum: number) => {
    const target = academicYears.find(ay => ay.id === yearId);
    if (!target) return;

    const updated = {
      ...target,
      terms: target.terms.map(t => (t.num === termNum ? { ...t, active: !t.active } : t)),
    };

    setAcademicYears(prev => prev.map(ay => (ay.id === yearId ? updated : ay)));
    try {
      await saveAcademicYear(updated);
      showToast(`อัปเดตสถานะภาคเรียนที่ ${termNum}/${target.year} สำเร็จ`);
    } catch (err) {
      console.error("Error saving term toggle:", err);
      fetchYears(); // revert on failure
    }
  };

  const openEditTerm = (ay: AcademicYearDoc, term: AcademicYearDoc["terms"][0]) => {
    setEditingTerm({
      yearId: ay.id,
      year: ay.year,
      termNum: term.num,
      startDateIso: toIsoDate(term.startDate, ay.year),
      endDateIso: toIsoDate(term.endDate, term.num === 2 ? ay.year + 1 : ay.year),
      active: term.active,
    });
  };

  const applyStandardPreset = () => {
    if (!editingTerm) return;
    const cYear = editingTerm.year > 2400 ? editingTerm.year - 543 : editingTerm.year;
    if (editingTerm.termNum === 1) {
      setEditingTerm({
        ...editingTerm,
        startDateIso: `${cYear}-05-16`,
        endDateIso: `${cYear}-10-10`,
      });
    } else {
      setEditingTerm({
        ...editingTerm,
        startDateIso: `${cYear}-11-01`,
        endDateIso: `${cYear + 1}-03-31`,
      });
    }
  };

  const handleSaveTermDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerm) return;
    setIsSavingTerm(true);

    const targetYear = academicYears.find(ay => ay.id === editingTerm.yearId);
    if (!targetYear) {
      setIsSavingTerm(false);
      return;
    }

    const updatedStartDateThai = toThaiDateString(editingTerm.startDateIso);
    const updatedEndDateThai = toThaiDateString(editingTerm.endDateIso);

    const updatedTerms = targetYear.terms.map(t => {
      if (t.num === editingTerm.termNum) {
        return {
          ...t,
          startDate: updatedStartDateThai,
          endDate: updatedEndDateThai,
          active: editingTerm.active,
        };
      }
      return t;
    });

    const updatedYearDoc: AcademicYearDoc = {
      ...targetYear,
      terms: updatedTerms,
    };

    setAcademicYears(prev => prev.map(ay => ay.id === editingTerm.yearId ? updatedYearDoc : ay));
    setEditingTerm(null);
    setIsSavingTerm(false);
    showToast(`บันทึกวันเปิด-ปิดภาคเรียนที่ ${editingTerm.termNum}/${targetYear.year} เรียบร้อยแล้ว`);

    try {
      await saveAcademicYear(updatedYearDoc);
    } catch (err) {
      console.error("Error saving term dates:", err);
      fetchYears();
    }
  };

  const setYearActive = async (yearId: string) => {
    setSavingId(yearId);
    setAcademicYears(prev =>
      prev.map(ay => ({
        ...ay,
        isActive: ay.id === yearId,
      }))
    );
    try {
      await setFirestoreActiveAcademicYear(yearId);
      showToast(`ตั้งปีการศึกษา ${yearId} เป็นปีปัจจุบันแล้ว`);
    } catch (err) {
      console.error("Error setting active year:", err);
      fetchYears();
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteYear = async (yearId: string) => {
    if (!confirm(`ต้องการลบข้อมูลปีการศึกษา ${yearId} หรือไม่?`)) return;
    setAcademicYears(prev => prev.filter(ay => ay.id !== yearId));
    try {
      await deleteFirestoreAcademicYear(yearId);
      showToast(`ลบปีการศึกษา ${yearId} สำเร็จ`);
    } catch (err) {
      console.error("Error deleting year:", err);
      fetchYears();
    }
  };

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    const item: AcademicYearDoc = {
      id: newYear.toString(),
      year: newYear,
      isActive: newYearIsActive,
      terms: [
        { 
          num: 1, 
          active: newYearIsActive, 
          startDate: toThaiDateString(newYearTerm1Start) || `16 พ.ค. ${newYear}`, 
          endDate: toThaiDateString(newYearTerm1End) || `10 ต.ค. ${newYear}` 
        },
        { 
          num: 2, 
          active: false, 
          startDate: toThaiDateString(newYearTerm2Start) || `1 พ.ย. ${newYear}`, 
          endDate: toThaiDateString(newYearTerm2End) || `31 มี.ค. ${newYear + 1}` 
        },
      ],
    };

    setAcademicYears(prev => {
      let updated = [item, ...prev.filter(ay => ay.id !== item.id)];
      if (newYearIsActive) {
        updated = updated.map(ay => ({
          ...ay,
          isActive: ay.id === item.id,
        }));
      }
      return updated.sort((a, b) => b.year - a.year);
    });

    setShowAddModal(false);
    setNewYear(newYear + 1);
    showToast(`เพิ่มปีการศึกษา ${item.year} เรียบร้อยแล้ว`);

    try {
      await saveAcademicYear(item);
      if (newYearIsActive) {
        await setFirestoreActiveAcademicYear(item.id);
      }
    } catch (err) {
      console.error("Error creating academic year:", err);
      fetchYears();
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/95 text-white text-xs font-bold shadow-2xl border border-white/20 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold mb-2 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-teal-300" />
            <span>การบริหารจัดการปีการศึกษา & ภาคเรียน</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
            ปีการศึกษาและภาคเรียน
          </h1>
          <p className="text-slate-200 text-sm mt-0.5">
            กำหนดวันเปิด-ปิดภาคเรียน และสถานะของแต่ละเทอม เพื่อควบคุมการเช็กชื่อ การตัดเกรด และเอกสาร ปพ.5
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm border border-white/20 shadow-xl backdrop-blur-md transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4 text-teal-300" />
          <span>สร้างปีการศึกษาใหม่</span>
        </button>
      </div>

      {/* Main Bento Container */}
      <div className="space-y-5">
        {academicYears.map((ay) => (
          <div
            key={ay.id}
            className={`p-6 sm:p-7 rounded-[28px] border transition-all duration-300 ${
              ay.isActive
                ? "bg-white/95 dark:bg-slate-900/95 border-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-2 ring-indigo-500/20"
                : "bg-white/70 dark:bg-slate-900/70 border-white/40 shadow-sm opacity-90"
            } backdrop-blur-xl`}
          >
            {/* Year Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    ay.isActive
                      ? "bg-gradient-to-tr from-indigo-600 to-teal-400 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">ปีการศึกษา {ay.year}</h3>
                    {ay.isActive && (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                        ใช้งานปัจจุบัน
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {ay.isActive ? "ระบบกำลังผูกข้อมูลการเช็กชื่อและการประเมินกับปีการศึกษานี้" : "ปีการศึกษาที่สิ้นสุดแล้ว"}
                  </p>
                </div>
              </div>

              {!ay.isActive && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setYearActive(ay.id)}
                    disabled={savingId === ay.id}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    {savingId === ay.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>ตั้งเป็นปีการศึกษาปัจจุบัน</span>
                  </button>
                  <button
                    onClick={() => handleDeleteYear(ay.id)}
                    title="ลบปีการศึกษา"
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Terms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {ay.terms.map((term) => {
                const duration = calculateSchoolDays(term.startDate, term.endDate);
                return (
                  <div
                    key={term.num}
                    className={`p-5 rounded-2xl border transition-all ${
                      term.active
                        ? "bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-800/80 shadow-sm ring-1 ring-indigo-500/15"
                        : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-black flex items-center justify-center">
                          {term.num}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          ภาคเรียนที่ {term.num}/{ay.year}
                        </h4>
                      </div>

                      {term.active ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          เปิดภาคเรียน
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                          ปิดภาคเรียน
                        </span>
                      )}
                    </div>

                    {/* Date Details & Calculation summary */}
                    <div className="bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 mb-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          ช่วงวันเปิด-ปิดภาคเรียน
                        </span>
                        {duration.weeks > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                            ~{duration.weeks} สัปดาห์
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 pt-0.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{term.startDate} — {term.endDate}</span>
                      </p>
                      {duration.schoolDays > 0 && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5">
                          วันทำการเรียนการสอน (จ.-ศ.): ประมาณ <span className="font-bold text-slate-700 dark:text-slate-200">{duration.schoolDays} วัน</span>
                        </p>
                      )}
                    </div>

                    {/* Actions: Edit Dates & Toggle Active */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openEditTerm(ay, term)}
                        className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01]"
                      >
                        <CalendarDays className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>ระบุวันเปิด-ปิด</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleTerm(ay.id, term.num)}
                        className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] ${
                          term.active
                            ? "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                            : "bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white shadow-sm"
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{term.active ? "ปิดภาคเรียนนี้" : "เปิดภาคเรียนนี้"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Term Dates Modal */}
      {editingTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] p-6 sm:p-7 shadow-2xl border border-white/80 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    กำหนดวันเปิด-ปิดภาคเรียน
                  </h3>
                  <p className="text-xs text-slate-500">
                    ภาคเรียนที่ {editingTerm.termNum} ปีการศึกษา {editingTerm.year}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditingTerm(null)} 
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTermDates} className="space-y-4">
              {/* Preset Button */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">ช่วงเวลาทำการเรียนการสอน</span>
                <button
                  type="button"
                  onClick={applyStandardPreset}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 hover:underline"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>ใช้เกณฑ์มาตรฐาน สพฐ.</span>
                </button>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  วันเปิดภาคเรียน (วันเริ่มต้น)
                </label>
                <input
                  type="date"
                  required
                  value={editingTerm.startDateIso}
                  onChange={(e) => setEditingTerm({ ...editingTerm, startDateIso: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-1">
                  แสดงในเอกสาร: <span className="font-bold text-slate-700 dark:text-slate-300">{toThaiDateString(editingTerm.startDateIso) || "-"}</span>
                </p>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  วันปิดภาคเรียน (วันสิ้นสุด)
                </label>
                <input
                  type="date"
                  required
                  value={editingTerm.endDateIso}
                  onChange={(e) => setEditingTerm({ ...editingTerm, endDateIso: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-1">
                  แสดงในเอกสาร: <span className="font-bold text-slate-700 dark:text-slate-300">{toThaiDateString(editingTerm.endDateIso) || "-"}</span>
                </p>
              </div>

              {/* Calculated summary */}
              {(() => {
                const calc = calculateSchoolDays(editingTerm.startDateIso, editingTerm.endDateIso);
                return (
                  <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      <span>สรุปเวลาเรียนในภาคเรียนนี้</span>
                      <span>~{calc.weeks} สัปดาห์</span>
                    </div>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                      วันทำการเรียนการสอน (จันทร์-ศุกร์): ประมาณ <span className="font-bold">{calc.schoolDays} วัน</span> ({calc.calendarDays} วันตามปฏิทิน)
                    </p>
                  </div>
                );
              })()}

              {/* Status Toggle */}
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingTerm.active}
                  onChange={(e) => setEditingTerm({ ...editingTerm, active: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">เปิดใช้งานภาคเรียนนี้</span>
                  <span className="text-[10px] text-slate-500 block">ใช้เป็นภาคเรียนปัจจุบันในการบันทึกเวลาเรียนและออกเอกสาร</span>
                </div>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 mt-5">
                <button
                  type="button"
                  onClick={() => setEditingTerm(null)}
                  className="px-4 py-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSavingTerm}
                  className="px-6 py-2.5 rounded-2xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
                >
                  {isSavingTerm ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-teal-300" />}
                  <span>{isSavingTerm ? "กำลังบันทึก..." : "บันทึกวันเปิด-ปิด"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Academic Year Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] p-6 sm:p-8 shadow-2xl border border-white dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">สร้างปีการศึกษาใหม่</h3>
                  <p className="text-xs text-slate-500">กำหนดปีการศึกษาและช่วงวันเปิด-ปิดภาคเรียน 1 และ 2</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddYear} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">ปีการศึกษา (พ.ศ.)</label>
                <input
                  type="number"
                  required
                  value={newYear}
                  onChange={(e) => setNewYear(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-center text-xl outline-none focus:border-indigo-500 text-slate-800 dark:text-white"
                />
              </div>

              {/* Term 1 Configuration */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-indigo-700 dark:text-indigo-400">
                    ภาคเรียนที่ 1/{newYear}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    มาตรฐาน สพฐ. 16 พ.ค. - 10 ต.ค.
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      วันเปิดภาคเรียน 1
                    </label>
                    <input
                      type="date"
                      required
                      value={newYearTerm1Start}
                      onChange={(e) => setNewYearTerm1Start(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {toThaiDateString(newYearTerm1Start)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      วันปิดภาคเรียน 1
                    </label>
                    <input
                      type="date"
                      required
                      value={newYearTerm1End}
                      onChange={(e) => setNewYearTerm1End(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {toThaiDateString(newYearTerm1End)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Term 2 Configuration */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-indigo-700 dark:text-indigo-400">
                    ภาคเรียนที่ 2/{newYear}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    มาตรฐาน สพฐ. 1 พ.ย. - 31 มี.ค.
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      วันเปิดภาคเรียน 2
                    </label>
                    <input
                      type="date"
                      required
                      value={newYearTerm2Start}
                      onChange={(e) => setNewYearTerm2Start(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {toThaiDateString(newYearTerm2Start)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      วันปิดภาคเรียน 2
                    </label>
                    <input
                      type="date"
                      required
                      value={newYearTerm2End}
                      onChange={(e) => setNewYearTerm2End(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {toThaiDateString(newYearTerm2End)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Set Active Checkbox */}
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newYearIsActive}
                  onChange={(e) => setNewYearIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 block">
                    ตั้งเป็นปีการศึกษาปัจจุบันทันที
                  </span>
                  <span className="text-[10px] text-indigo-700 dark:text-indigo-300 block">
                    ระบบจะเปิดภาคเรียนที่ 1 ให้โดยอัตโนมัติ
                  </span>
                </div>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  บันทึกปีการศึกษา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
