"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Save, 
  FileDown, 
  Plus, 
  Trash2, 
  Sparkles, 
  BarChart3, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  Award,
  Layers,
  TrendingUp,
  BookOpen,
  Heart,
  Brain,
  Zap,
  CheckCheck,
  School,
  Users,
  Lock,
  Unlock,
  Scale
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DynamicIsland } from "@/components/ui/DynamicIsland";
import { 
  calculateTotalScore, 
  calculateGrade, 
  calculateGradeDistribution,
  ScoreColumn 
} from "@/lib/calculations/engine";
import { useCockpit } from "@/context/CockpitContext";
import { calculateContinuityMetrics } from "@/lib/calculations/continuity";
import { 
  getAllStudents, 
  getStudentsByRoom,
  getScoresBySubject, 
  saveScoresBatch, 
  getScoreColumnsBySubject, 
  saveScoreColumn, 
  deleteScoreColumn,
  saveAssessmentRecord,
  getAssessmentRecord,
  getAllSubjects,
  getAllClassrooms,
  getAttendanceHistory,
  SubjectDoc,
  ClassroomDoc,
  StudentRecord, 
  ScoreRecord,
  ScoreColumnRecord
} from "@/lib/firebase/services";
import { calculateAttendanceSummaries } from "@/lib/calculations/attendance";
import { generateFullPorPor5Report } from "@/lib/excel/generator";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";

interface StudentScoreRow extends StudentRecord {
  scores: { [activityId: string]: number };
}

type SectionTab = "scores" | "attributes" | "literacy" | "competencies" | "summary";

const ATTRIBUTES_NAMES = [
  "1. รักชาติฯ",
  "2. ซื่อสัตย์",
  "3. มีวินัย",
  "4. ใฝ่เรียนรู้",
  "5. อยู่อย่างพอเพียง",
  "6. มุ่งมั่นทำงาน",
  "7. รักไทย",
  "8. จิตสาธารณะ"
];

const COMPETENCIES_NAMES = [
  "1. สื่อสาร",
  "2. การคิด",
  "3. แก้ปัญหา",
  "4. ทักษะชีวิต",
  "5. เทคโนโลยี"
];

function SmartScorebookContent() {
  const searchParams = useSearchParams();
  const urlSubId = searchParams.get("subjectId");
  const urlClass = searchParams.get("classId");

  const [activeTab, setActiveTab] = useState<SectionTab>("scores");
  
  const {
    selectedRoom: selectedClassRoom,
    setSelectedRoom: setSelectedClassRoom,
    selectedSubjectId,
    setSelectedSubjectId,
    activeLens,
    vaultDoc,
    updateStudentScore,
    toggleLock,
    subjects,
    classrooms,
    currentSubject,
    relevantClassrooms
  } = useCockpit();

  const [students, setStudents] = useState<StudentScoreRow[]>([]);
  const [columns, setColumns] = useState<ScoreColumnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Section 4, 5, 6 Assessments State
  const [attributes, setAttributes] = useState<{ [studentId: string]: { [key: string]: number } }>({});
  const [literacy, setLiteracy] = useState<{ [studentId: string]: { reading: number; thinking: number; writing: number } }>({});
  const [competencies, setCompetencies] = useState<{ [studentId: string]: { [key: string]: number } }>({});

  // Modals
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // New Column Form
  const [newCol, setNewCol] = useState<Partial<ScoreColumnRecord>>({
    name: "",
    type: "collected",
    maxScore: 10,
    weight: 10,
    term: "1"
  });

  useEffect(() => {
    if (urlSubId && urlSubId !== selectedSubjectId) {
      setSelectedSubjectId(urlSubId);
    }
    if (urlClass && urlClass !== selectedClassRoom) {
      setSelectedClassRoom(urlClass);
    }
  }, [urlSubId, urlClass]);

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
        if (!validRooms.some(r => r.name === selectedClassRoom)) {
          setSelectedClassRoom(validRooms[0].name);
        }
      } else if (sub.assignedRooms && sub.assignedRooms.length > 0) {
        setSelectedClassRoom(sub.assignedRooms[0]);
      } else {
        setSelectedClassRoom(sub.level);
      }
    }
  };

  // 2. Load Workspace Data (Students, Columns, Scores, Assessments)
  useEffect(() => {
    if (!selectedSubjectId || !selectedClassRoom) return;

    const loadWorkspaceData = async () => {
      setLoading(true);
      try {
        // 2.1 Fetch students for selected classroom
        let studentList = await getStudentsByRoom(selectedClassRoom);
        if (studentList.length === 0) {
          const all = await getAllStudents();
          studentList = all.filter(s => s.room === selectedClassRoom || s.classroomId === selectedClassRoom);
        }

        // 2.2 Fetch score columns
        let colList = await getScoreColumnsBySubject(selectedSubjectId);
        if (colList.length === 0) {
          colList = [
            { id: `col_${selectedSubjectId}_a1`, name: "ใบงานที่ 1", type: "collected", maxScore: 10, weight: 10, term: "1", order: 1, subjectId: selectedSubjectId },
            { id: `col_${selectedSubjectId}_a2`, name: "ชิ้นงานสร้างสรรค์", type: "collected", maxScore: 10, weight: 10, term: "1", order: 2, subjectId: selectedSubjectId },
            { id: `col_${selectedSubjectId}_mid`, name: "สอบกลางภาค", type: "midterm", maxScore: 20, weight: 20, term: "1", order: 3, subjectId: selectedSubjectId },
          ];
          for (const c of colList) {
            await saveScoreColumn(selectedSubjectId, c);
          }
        }
        setColumns(colList);

        // 2.3 Fetch saved scores
        const savedScores = await getScoresBySubject(selectedSubjectId);
        const scoreLookup: { [key: string]: number } = {};
        savedScores.forEach(s => {
          scoreLookup[`${s.studentId}_${s.activityId}`] = s.rawScore;
        });

        const mappedStudents: StudentScoreRow[] = studentList.map(s => {
          const studentScores: { [key: string]: number } = {};
          colList.forEach(c => {
            const val = scoreLookup[`${s.id}_${c.id}`];
            studentScores[c.id] = val !== undefined ? val : 0;
          });
          return {
            ...s,
            scores: studentScores
          };
        });
        setStudents(mappedStudents);

        // 2.4 Fetch Assessments
        const savedAttr = await getAssessmentRecord(selectedClassRoom, selectedSubjectId, "attributes");
        if (savedAttr) setAttributes(savedAttr);
        else {
          const defAttr: any = {};
          studentList.forEach(s => {
            defAttr[s.id] = { "1": 3, "2": 3, "3": 3, "4": 3, "5": 3, "6": 3, "7": 3, "8": 3 };
          });
          setAttributes(defAttr);
        }

        const savedLit = await getAssessmentRecord(selectedClassRoom, selectedSubjectId, "literacy");
        if (savedLit) setLiteracy(savedLit as any);
        else {
          const defLit: any = {};
          studentList.forEach(s => {
            defLit[s.id] = { reading: 3, thinking: 3, writing: 3 };
          });
          setLiteracy(defLit);
        }

        const savedComp = await getAssessmentRecord(selectedClassRoom, selectedSubjectId, "competencies");
        if (savedComp) setCompetencies(savedComp);
        else {
          const defComp: any = {};
          studentList.forEach(s => {
            defComp[s.id] = { "1": 3, "2": 3, "3": 3, "4": 3, "5": 3 };
          });
          setCompetencies(defComp);
        }

      } catch (err) {
        console.error(err);
        setSaveStatus("ไม่สามารถโหลดข้อมูลจาก Cloud ได้");
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaceData();
  }, [selectedSubjectId, selectedClassRoom]);

  // Quick "Give 3 to All"
  const handleSetAllAttributesTo3 = () => {
    const updated: any = {};
    students.forEach(s => {
      updated[s.id] = { "1": 3, "2": 3, "3": 3, "4": 3, "5": 3, "6": 3, "7": 3, "8": 3 };
    });
    setAttributes(updated);
    setSaveStatus("ตั้งค่า: ทุกคนได้ระดับ 'ดีเยี่ยม (3)' เรียบร้อย");
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const handleSetAllLiteracyTo3 = () => {
    const updated: any = {};
    students.forEach(s => {
      updated[s.id] = { reading: 3, thinking: 3, writing: 3 };
    });
    setLiteracy(updated);
    setSaveStatus("ตั้งค่า: ทุกคนได้ระดับ 'ดีเยี่ยม (3)' เรียบร้อย");
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const handleSetAllCompetenciesTo3 = () => {
    const updated: any = {};
    students.forEach(s => {
      updated[s.id] = { "1": 3, "2": 3, "3": 3, "4": 3, "5": 3 };
    });
    setCompetencies(updated);
    setSaveStatus("ตั้งค่า: ทุกคนได้ระดับ 'ดีเยี่ยม (3)' เรียบร้อย");
    setTimeout(() => setSaveStatus(null), 2500);
  };

  // Evaluation summarizers (Helper)
  const getAverageLevel = (scoresObj: { [k: string]: number } | undefined, totalCount: number): string => {
    if (!scoresObj) return "ดีเยี่ยม (3)";
    const values = Object.values(scoresObj);
    if (values.length === 0) return "ดีเยี่ยม (3)";
    const avg = values.reduce((a, b) => a + Number(b), 0) / values.length;
    if (avg >= 2.5) return "ดีเยี่ยม (3)";
    if (avg >= 1.5) return "ดี (2)";
    if (avg >= 1.0) return "ผ่าน (1)";
    return "ไม่ผ่าน (0)";
  };

  // Score Input Change
  const handleScoreChange = (studentId: string, colId: string, value: string) => {
    const num = value === "" ? 0 : Number(value);
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return { ...s, scores: { ...s.scores, [colId]: num } };
      }
      return s;
    }));
  };

  // Save Current Section to Cloud Firestore
  const handleSaveActiveSection = async () => {
    setIsSaving(true);
    setSaveStatus("กำลังซิงก์ข้อมูลขึ้น Cloud...");
    try {
      if (activeTab === "scores") {
        const flatScores: Omit<ScoreRecord, "id">[] = [];
        students.forEach(s => {
          Object.entries(s.scores).forEach(([actId, raw]) => {
            flatScores.push({ studentId: s.id, activityId: actId, rawScore: raw, subjectId: selectedSubjectId });
          });
        });
        await saveScoresBatch(selectedSubjectId, flatScores);
      } else if (activeTab === "attributes") {
        await saveAssessmentRecord(selectedClassRoom, selectedSubjectId, "attributes", attributes);
      } else if (activeTab === "literacy") {
        await saveAssessmentRecord(selectedClassRoom, selectedSubjectId, "literacy", literacy as any);
      } else if (activeTab === "competencies") {
        await saveAssessmentRecord(selectedClassRoom, selectedSubjectId, "competencies", competencies);
      }
      setSaveStatus("บันทึกข้อมูลขึ้น Cloud Firestore เรียบร้อยแล้ว ✅");
    } catch (err: any) {
      console.error(err);
      setSaveStatus(`บันทึกไม่สำเร็จ: ${err.message || "ตรวจสอบ Firestore"}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // Calculations for Summary
  const totalMaxWeight = columns.reduce((acc, c) => acc + (c.weight || c.maxScore), 0);

  const studentsWithCalculations = students.map(s => {
    const scoreEntries = Object.entries(s.scores).map(([colId, raw]) => ({
      activityId: colId,
      rawScore: raw
    }));
    const hasScore = Object.values(s.scores).some(v => v !== undefined && v !== null && v > 0);
    const total = calculateTotalScore(scoreEntries, columns);
    const scaled = totalMaxWeight > 0 ? (total / totalMaxWeight) * 100 : total;
    const grade = hasScore ? calculateGrade(scaled) : "-";

    const attrSummary = getAverageLevel(attributes[s.id], 8);
    const litSummary = getAverageLevel(literacy[s.id] as any, 3);
    const compSummary = getAverageLevel(competencies[s.id], 5);

    // 50:50 Continuity Calculation
    const term1Score = vaultDoc?.students?.[s.id]?.score ?? null;
    const term2Score = hasScore ? Math.min(50, total) : null;
    const continuity = calculateContinuityMetrics(term1Score, term2Score, 50, 50);

    return {
      ...s,
      hasScore,
      calculatedTotal: total,
      scaledScore: Math.round(scaled),
      grade,
      attrSummary,
      litSummary,
      compSummary,
      term1Score,
      term2Score,
      continuity
    };
  });

  const scoredStudents = studentsWithCalculations.filter(s => s.hasScore);
  const gradeDistributionData = calculateGradeDistribution(
    scoredStudents.map(s => s.grade)
  );

  const atRiskStudents = studentsWithCalculations.filter(
    s => s.hasScore && (s.grade === "0" || s.grade === "1" || s.grade === "ร" || s.grade === "มส")
  );

  // Full Por-Por-5 Excel Download (All 7 Sections)
  const handleExportFullPorPor5 = async () => {
    try {
      const curSub = subjects.find(s => s.id === selectedSubjectId);
      const curClass = classrooms.find(c => c.name === selectedClassRoom || c.id === selectedClassRoom);

      // Fetch actual cumulative attendance
      let attMap: { [stuId: string]: number } = {};
      try {
        const historyDocs = await getAttendanceHistory(selectedClassRoom, selectedSubjectId);
        const attendanceSummaries = calculateAttendanceSummaries(students, historyDocs, curSub?.hours || 80);
        attMap = Object.fromEntries(attendanceSummaries.map(a => [a.studentId, a.attendancePercent]));
      } catch (attErr) {
        console.warn("Could not calculate real attendance for export:", attErr);
      }

      const fullData = {
        schoolName: "โรงเรียนบ้านควนเนียง",
        academicYear: curClass?.academicYear || "2568",
        term: "1",
        subjectCode: curSub?.code || "ส13101",
        subjectName: curSub?.name || "สังคมศึกษา ศาสนา และวัฒนธรรม",
        className: selectedClassRoom,
        teacherName: curClass?.advisorName || "นายพิชญุตม์ ประภาศิริ",
        students: studentsWithCalculations.map(s => ({
          number: s.number,
          studentId: s.studentCode || s.id,
          name: s.name,
          totalScore: s.calculatedTotal,
          grade: s.grade,
          attendancePercent: attMap[s.id] !== undefined ? attMap[s.id] : 100,
          attributes: attributes[s.id] || {},
          attributesSummary: s.attrSummary,
          literacy: literacy[s.id] || { reading: 3, thinking: 3, writing: 3 },
          literacySummary: s.litSummary,
          competencies: competencies[s.id] || {},
          competenciesSummary: s.compSummary,
        }))
      };

      const blob = await generateFullPorPor5Report(fullData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanSub = (curSub?.code || "รายวิชา").replace(/[\/\s]/g, '_');
      const cleanRoom = selectedClassRoom.replace(/[\/\s]/g, '_');
      a.download = `ปพ5_ฉบับสมบูรณ์_${cleanSub}_${cleanRoom}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Full Export Error:", err);
    }
  };

  const getBarColor = (grade: string) => {
    if (grade === "4" || grade === "3.5") return "#10b981";
    if (grade === "3" || grade === "2.5") return "#06b6d4";
    if (grade === "2" || grade === "1.5") return "#f59e0b";
    if (grade === "1" || grade === "0") return "#f43f5e";
    return "#8b5cf6";
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-cyan-300 text-xs font-mono font-semibold mb-2 shadow-xs">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span>แบบบันทึก ปพ.5 (50:50 Dual-Term Continuity) • {currentSubject ? `${currentSubject.code} ${currentSubject.name}` : "รายวิชา"} • ชั้น {selectedClassRoom}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            ระบบวัดและประเมินผล ปพ.5
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            ครอบคลุมคะแนนรอยต่อ 50:50, คุณลักษณะ 8 ด้าน, อ่านคิดวิเคราะห์, สมรรถนะ 5 ด้าน และลายเซ็น 4 ชั้น
          </p>
        </div>

        {/* Global Action Hub */}
        <div className="flex flex-wrap items-center gap-2.5">
          {saveStatus && (
            <span className="px-3 py-1.5 rounded-full bg-slate-900 text-xs font-bold text-cyan-300 border border-cyan-500/30 shadow-md">
              {saveStatus}
            </span>
          )}

          <button
            onClick={handleExportFullPorPor5}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02]"
            title="ดาวน์โหลดไฟล์ Excel ปพ.5 แยก 5 แผ่นงานครบทุก Section"
          >
            <FileDown className="w-4 h-4 text-white" />
            <span>ส่งออก ปพ.5 เล่มสมบูรณ์ (.xlsx)</span>
          </button>

          <button
            onClick={handleSaveActiveSection}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-cyan-300" /> : <Save className="w-4 h-4 text-cyan-300" />}
            <span>{isSaving ? "กำลังบันทึก..." : "บันทึกแท็บนี้"}</span>
          </button>
        </div>
      </div>

      {/* Class & Subject Selector Ribbon (Spatial Glass Bar) */}
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-white/10 shadow-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Dropdown */}
          <div className="flex items-center gap-2.5 bg-slate-950/80 hover:bg-slate-950 transition-colors px-3.5 py-2 rounded-xl border border-white/10 shadow-sm">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">รายวิชา</span>
              <select
                value={selectedSubjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="text-xs sm:text-sm font-bold text-slate-200 bg-transparent outline-none cursor-pointer pr-2"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {s.code} {s.name} (ชั้น {s.level})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Classroom Dropdown (Filtered by relevantClassrooms) */}
          <div className="flex items-center gap-2.5 bg-slate-950/80 hover:bg-slate-950 transition-colors px-3.5 py-2 rounded-xl border border-white/10 shadow-sm">
            <School className="w-4 h-4 text-cyan-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ห้องเรียน</span>
              <select
                value={selectedClassRoom}
                onChange={(e) => setSelectedClassRoom(e.target.value)}
                className="text-xs sm:text-sm font-bold text-slate-200 bg-transparent outline-none cursor-pointer pr-2"
              >
                {(relevantClassrooms.length > 0 ? relevantClassrooms : classrooms).map((c) => (
                  <option key={c.id} value={c.name} className="bg-slate-900 text-slate-200">
                    ห้อง {c.name} ({c.level})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Stats Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs font-semibold text-slate-200">
            <span>รหัส: <b className="text-cyan-300">{currentSubject?.code || "-"}</b></span>
            <span className="text-slate-600">|</span>
            <span>นักเรียน: <b className="text-emerald-400">{students.length} คน</b></span>
            <span className="text-slate-600">|</span>
            <span>คะแนนสะสม: <b className="text-indigo-300">{totalMaxWeight} คะแนน</b></span>
          </div>
        </div>

        <Link
          href="/subjects"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all self-start md:self-auto border border-white/10 shadow-sm"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>จัดการวิชา / เพิ่มห้องเรียน</span>
        </Link>
      </div>

      {/* Sub-Navigation Switcher (7 Sections of Por-Por-5) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab("scores")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === "scores"
              ? "bg-slate-800 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)] scale-[1.02]"
              : "bg-slate-900/60 hover:bg-slate-900/90 text-slate-400 border border-white/5"
          }`}
        >
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>1. คะแนนรายวิชา (Section 3)</span>
        </button>

        <button
          onClick={() => setActiveTab("attributes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === "attributes"
              ? "bg-slate-800 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)] scale-[1.02]"
              : "bg-slate-900/60 hover:bg-slate-900/90 text-slate-400 border border-white/5"
          }`}
        >
          <Heart className="w-4 h-4 text-rose-400" />
          <span>2. คุณลักษณะ 8 ประการ (Section 4)</span>
        </button>

        <button
          onClick={() => setActiveTab("literacy")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === "literacy"
              ? "bg-slate-800 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)] scale-[1.02]"
              : "bg-slate-900/60 hover:bg-slate-900/90 text-slate-400 border border-white/5"
          }`}
        >
          <Brain className="w-4 h-4 text-cyan-400" />
          <span>3. อ่าน คิดวิเคราะห์ เขียน (Section 5)</span>
        </button>

        <button
          onClick={() => setActiveTab("competencies")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === "competencies"
              ? "bg-slate-800 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)] scale-[1.02]"
              : "bg-slate-900/60 hover:bg-slate-900/90 text-slate-400 border border-white/5"
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>4. สมรรถนะสำคัญ 5 ด้าน (Section 6)</span>
        </button>

        <button
          onClick={() => setActiveTab("summary")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === "summary"
              ? "bg-slate-800 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)] scale-[1.02]"
              : "bg-slate-900/60 hover:bg-slate-900/90 text-slate-400 border border-white/5"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>5. สรุปเล่ม ปพ.5 & ลายเซ็น (Section 7)</span>
        </button>
      </div>

      {/* Main Bento Workspace */}
      <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        
        {/* ======================================================== */}
        {/* TAB 1: SCORES (Section 3) - 50:50 Dual-Term Continuity Table */}
        {/* ======================================================== */}
        {activeTab === "scores" && (
          <div>
            <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/70">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">ห้องเรียน:</span>
                <span className="px-3 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-cyan-300 font-mono font-bold text-xs">
                  {selectedClassRoom} ({students.length} คน)
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-xs font-mono font-semibold text-slate-300">
                  คะแนนเต็มเทอม 2: <b className="text-indigo-300">{totalMaxWeight} คะแนน</b>
                </span>
                <span className="text-slate-600">|</span>
                {/* Vault Lock Status Indicator */}
                <button
                  type="button"
                  onClick={toggleLock}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono font-bold text-xs transition-all ${
                    vaultDoc?.isLocked
                      ? "bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25"
                      : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
                  }`}
                  title={vaultDoc?.isLocked ? "คลิกเพื่อปลดล็อกแก้ไขคะแนนทุนเดิมเทอม 1" : "คลิกเพื่อล็อกป้องกันการแก้ไข"}
                >
                  {vaultDoc?.isLocked ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{vaultDoc?.isLocked ? "ทุนเทอม 1: ล็อกแล้ว" : "ทุนเทอม 1: ปลดล็อก (แก้ไขได้)"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAnalyticsModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-bold text-xs transition-colors"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ดูกราฟเกรด</span>
                </button>
                <button
                  onClick={() => setShowAddColumnModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs transition-all shadow-[0_0_12px_rgba(99,102,241,0.3)] active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มช่องคะแนนเทอม 2</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[1100px]">
                <TableHeader>
                  <tr className="bg-slate-950 border-b border-white/10 text-xs font-bold text-slate-300 font-mono">
                    <TableHead className="w-[65px] text-center sticky left-0 bg-slate-950 z-20 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">เลขที่</TableHead>
                    <TableHead className="w-[220px] sticky left-[65px] bg-slate-950 z-20 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">ชื่อ-นามสกุล นักเรียน</TableHead>
                    
                    {/* Dedicated Column: Term 1 Baseline Vault (50 pts) */}
                    <TableHead className="text-center min-w-[150px] bg-indigo-950/40 border-x border-indigo-500/20">
                      <div className="flex flex-col items-center py-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-indigo-300">📦 ทุนเดิมเทอม 1</span>
                          {vaultDoc?.isLocked ? (
                            <Lock className="w-3 h-3 text-rose-400" />
                          ) : (
                            <Unlock className="w-3 h-3 text-emerald-400" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium font-mono">(เต็ม 50 คะแนน)</span>
                      </div>
                    </TableHead>

                    {/* Term 2 Evaluation Columns */}
                    {columns.map((col) => (
                      <TableHead key={col.id} className="text-center min-w-[130px] group relative">
                        <div className="flex flex-col items-center py-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-cyan-300">{col.name}</span>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`ต้องการลบช่องคะแนน "${col.name}" ใช่หรือไม่?`)) {
                                  await deleteScoreColumn(col.id);
                                  setColumns(prev => prev.filter(c => c.id !== col.id));
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-opacity"
                              title="ลบช่องคะแนนนี้"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium font-mono">(เต็ม {col.maxScore} | นน. {col.weight})</span>
                        </div>
                      </TableHead>
                    ))}

                    {/* Term 2 Subtotal */}
                    <TableHead className="text-center w-[120px] bg-cyan-950/30 text-cyan-300">
                      <div className="flex flex-col items-center py-1">
                        <span className="font-bold text-cyan-300">คะแนนเทอม 2</span>
                        <span className="text-[10px] text-slate-400 font-mono">(เต็ม {totalMaxWeight})</span>
                      </div>
                    </TableHead>

                    {/* Combined Dual-Term Total (100 pts) */}
                    <TableHead className="text-center w-[130px] bg-indigo-950/50 text-indigo-200">
                      <div className="flex flex-col items-center py-1">
                        <span className="font-black text-indigo-200">รวม 2 เทอม</span>
                        <span className="text-[10px] text-indigo-300 font-mono">(เต็ม 100)</span>
                      </div>
                    </TableHead>

                    {/* Target Gap (Grade 3 & 4) */}
                    <TableHead className="text-center w-[160px] bg-amber-950/30 text-amber-300">
                      <div className="flex flex-col items-center py-1">
                        <span className="font-bold text-amber-300">🎯 สู่เกรด 3 / 4</span>
                        <span className="text-[10px] text-slate-400 font-mono">(เป้า 70 / 80 แต้ม)</span>
                      </div>
                    </TableHead>

                    {/* Projected OBEC Grade */}
                    <TableHead className="text-center w-[120px] bg-emerald-950/40 text-emerald-300">
                      <div className="flex flex-col items-center py-1">
                        <span className="font-bold text-emerald-300">เกรด ปพ.5</span>
                        <span className="text-[10px] text-emerald-400/80 font-mono">(ประมาณการ)</span>
                      </div>
                    </TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {studentsWithCalculations.map((student, idx) => (
                    <TableRow key={student.id} className="hover:bg-white/[0.03] transition-colors border-b border-white/5 font-mono text-xs">
                      <TableCell className="text-center font-bold text-slate-400 sticky left-0 bg-slate-950 z-10 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">
                        {student.number}
                      </TableCell>
                      <TableCell className="sticky left-[65px] bg-slate-950 z-10 shadow-[1px_0_0_0_rgba(255,255,255,0.08)] font-sans font-bold text-slate-200">
                        {student.name}
                      </TableCell>
                      
                      {/* Term 1 Baseline Cell with Fast Keyboard Nav */}
                      <TableCell className="p-2 text-center bg-indigo-950/20 border-x border-indigo-500/20">
                        {vaultDoc?.isLocked ? (
                          <span className="inline-block px-3 py-1.5 rounded-xl font-mono font-bold text-xs bg-slate-900 border border-white/10 text-indigo-300">
                            {student.term1Score !== null ? `${student.term1Score} / 50` : "-"}
                          </span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            max="50"
                            data-row-index={idx}
                            data-field="term1-score"
                            value={student.term1Score !== null ? student.term1Score : ""}
                            placeholder="-"
                            onChange={(e) => {
                              const val = e.target.value === "" ? null : Math.min(50, Math.max(0, Number(e.target.value)));
                              updateStudentScore(student.id, student.studentCode, val);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === "ArrowDown") {
                                e.preventDefault();
                                const next = document.querySelector<HTMLInputElement>(`input[data-row-index="${idx + 1}"][data-field="term1-score"]`);
                                next?.focus();
                                next?.select();
                              } else if (e.key === "ArrowUp") {
                                e.preventDefault();
                                const prev = document.querySelector<HTMLInputElement>(`input[data-row-index="${idx - 1}"][data-field="term1-score"]`);
                                prev?.focus();
                                prev?.select();
                              }
                            }}
                            className="w-20 text-center py-1.5 rounded-xl font-mono font-bold text-xs bg-slate-950 border border-indigo-500/40 text-indigo-200 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all mx-auto block"
                          />
                        )}
                      </TableCell>

                      {/* Term 2 Evaluation Inputs */}
                      {columns.map((col) => (
                        <TableCell key={col.id} className="p-2">
                          <input
                            type="number"
                            min="0"
                            max={col.maxScore}
                            value={student.scores[col.id] !== undefined && student.scores[col.id] !== null ? student.scores[col.id] : ""}
                            placeholder="-"
                            onChange={(e) => handleScoreChange(student.id, col.id, e.target.value)}
                            className="w-full text-center py-1.5 rounded-xl font-mono font-bold text-xs bg-slate-950 border border-white/10 hover:border-white/20 focus:border-cyan-400 text-slate-100 outline-none transition-colors"
                          />
                        </TableCell>
                      ))}

                      {/* Term 2 Subtotal */}
                      <TableCell className="text-center bg-cyan-950/20 font-mono font-bold text-cyan-300 text-sm">
                        {student.hasScore ? student.calculatedTotal : "-"}
                      </TableCell>

                      {/* Combined Dual-Term Total */}
                      <TableCell className="text-center bg-indigo-950/30 font-mono font-black text-indigo-200 text-base">
                        {student.continuity.totalScore !== null ? student.continuity.totalScore : "-"}
                      </TableCell>

                      {/* Target Gap (Grade 3 & 4) */}
                      <TableCell className="text-center bg-amber-950/15">
                        {student.continuity.hasGrade4 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                            🏆 เกรด 4 แล้ว
                          </span>
                        ) : student.continuity.totalScore !== null ? (
                          <div className="flex flex-col items-center gap-0.5 font-mono">
                            <span className="text-[11px] font-bold text-amber-300">
                              เกรด 3: ขาด {student.continuity.targetGapGrade3}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              เกรด 4: ขาด {student.continuity.targetGapGrade4}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )}
                      </TableCell>

                      {/* Projected Grade */}
                      <TableCell className="text-center bg-emerald-950/20">
                        {student.continuity.projectedGrade !== "-" ? (
                          <span className="inline-block px-3 py-1 rounded-xl font-black text-xs font-mono bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-400/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                            เกรด {student.continuity.projectedGrade}
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-mono text-slate-500 bg-slate-900 border border-white/5">
                            -
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ATTRIBUTES (Section 4) */}
        {/* ======================================================== */}
        {activeTab === "attributes" && (
          <div>
            <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/70">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">แบบประเมินคุณลักษณะอันพึงประสงค์ 8 ประการ</h3>
                <p className="text-xs text-slate-400 font-mono">เกณฑ์: 3 = ดีเยี่ยม, 2 = ดี, 1 = ผ่าน, 0 = ไม่ผ่าน</p>
              </div>
              <button
                onClick={handleSetAllAttributesTo3}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-colors shadow-xs"
              >
                <CheckCheck className="w-4 h-4" />
                <span>ให้ 3 (ดีเยี่ยม) ทุกคน</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <tr className="bg-slate-950 border-b border-white/10 text-xs font-bold text-slate-300">
                    <TableHead className="w-[60px] text-center sticky left-0 bg-slate-950 z-20 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">เลขที่</TableHead>
                    <TableHead className="w-[200px] sticky left-[60px] bg-slate-950 z-20 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">ชื่อ-นามสกุล</TableHead>
                    {ATTRIBUTES_NAMES.map((name, i) => (
                      <TableHead key={i} className="text-center w-[85px] py-2 text-[11px] font-bold text-rose-400">{name}</TableHead>
                    ))}
                    <TableHead className="text-center w-[120px] bg-emerald-950/40 text-emerald-300">สรุปผลประเมิน</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const studentAttr = attributes[student.id] || {};
                    const summary = getAverageLevel(studentAttr, 8);
                    return (
                      <TableRow key={student.id} className="hover:bg-white/[0.03] border-b border-white/5 text-xs font-mono">
                        <TableCell className="text-center font-bold sticky left-0 bg-slate-950 text-slate-400 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">{student.number}</TableCell>
                        <TableCell className="font-semibold sticky left-[60px] bg-slate-950 text-slate-200 shadow-[1px_0_0_0_rgba(255,255,255,0.08)] font-sans">{student.name}</TableCell>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                          <TableCell key={num} className="p-1 text-center">
                            <select
                              value={studentAttr[num.toString()] !== undefined ? studentAttr[num.toString()] : 3}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setAttributes(prev => ({
                                  ...prev,
                                  [student.id]: { ...(prev[student.id] || {}), [num.toString()]: val }
                                }));
                              }}
                              className="w-12 py-1 text-center font-bold rounded-lg bg-slate-900 border border-white/10 text-slate-200 outline-none cursor-pointer focus:border-cyan-400"
                            >
                              <option value="3" className="bg-slate-900 text-slate-200">3</option>
                              <option value="2" className="bg-slate-900 text-slate-200">2</option>
                              <option value="1" className="bg-slate-900 text-slate-200">1</option>
                              <option value="0" className="bg-slate-900 text-slate-200">0</option>
                            </select>
                          </TableCell>
                        ))}
                        <TableCell className="text-center bg-emerald-950/20 font-bold text-emerald-300">
                          {summary}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: LITERACY (Section 5) */}
        {/* ======================================================== */}
        {activeTab === "literacy" && (
          <div>
            <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/70">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">แบบประเมินการอ่าน คิดวิเคราะห์ และเขียน</h3>
                <p className="text-xs text-slate-400 font-mono">เกณฑ์: 3 = ดีเยี่ยม, 2 = ดี, 1 = ผ่าน, 0 = ไม่ผ่าน</p>
              </div>
              <button
                onClick={handleSetAllLiteracyTo3}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition-colors shadow-xs"
              >
                <CheckCheck className="w-4 h-4" />
                <span>ให้ 3 (ดีเยี่ยม) ทุกคน</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <tr className="bg-slate-950 border-b border-white/10 text-xs font-bold text-slate-300 font-mono">
                    <TableHead className="w-[70px] text-center sticky left-0 bg-slate-950 z-20 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">เลขที่</TableHead>
                    <TableHead className="w-[240px] sticky left-[70px] bg-slate-950 z-20 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">ชื่อ-นามสกุล</TableHead>
                    <TableHead className="text-center w-[140px] text-cyan-300">1. การอ่าน (0-3)</TableHead>
                    <TableHead className="text-center w-[140px] text-cyan-300">2. การคิดวิเคราะห์ (0-3)</TableHead>
                    <TableHead className="text-center w-[140px] text-cyan-300">3. การเขียน (0-3)</TableHead>
                    <TableHead className="text-center w-[140px] bg-emerald-950/40 text-emerald-300">สรุปผลประเมิน</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const studentLit = literacy[student.id] || { reading: 3, thinking: 3, writing: 3 };
                    const summary = getAverageLevel(studentLit as any, 3);
                    return (
                      <TableRow key={student.id} className="hover:bg-white/[0.03] border-b border-white/5 text-xs font-mono">
                        <TableCell className="text-center font-bold sticky left-0 bg-slate-950 text-slate-400 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">{student.number}</TableCell>
                        <TableCell className="font-semibold sticky left-[70px] bg-slate-950 text-slate-200 shadow-[1px_0_0_0_rgba(255,255,255,0.08)] font-sans">{student.name}</TableCell>
                        
                        {["reading", "thinking", "writing"].map((field) => (
                          <TableCell key={field} className="p-2 text-center">
                            <select
                              value={(studentLit as any)[field] !== undefined ? (studentLit as any)[field] : 3}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setLiteracy(prev => ({
                                  ...prev,
                                  [student.id]: { ...(prev[student.id] || { reading: 3, thinking: 3, writing: 3 }), [field]: val }
                                }));
                              }}
                              className="w-24 py-1.5 text-center font-bold rounded-lg bg-slate-900 border border-white/10 text-slate-200 outline-none cursor-pointer focus:border-cyan-400"
                            >
                              <option value="3" className="bg-slate-900 text-slate-200">3 (ดีเยี่ยม)</option>
                              <option value="2" className="bg-slate-900 text-slate-200">2 (ดี)</option>
                              <option value="1" className="bg-slate-900 text-slate-200">1 (ผ่าน)</option>
                              <option value="0" className="bg-slate-900 text-slate-200">0 (ไม่ผ่าน)</option>
                            </select>
                          </TableCell>
                        ))}

                        <TableCell className="text-center bg-emerald-950/20 font-bold text-emerald-300">
                          {summary}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: COMPETENCIES (Section 6) */}
        {/* ======================================================== */}
        {activeTab === "competencies" && (
          <div>
            <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/70">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">แบบประเมินสมรรถนะสำคัญของผู้เรียน 5 ด้าน</h3>
                <p className="text-xs text-slate-400 font-mono">เกณฑ์: 3 = ดีเยี่ยม, 2 = ดี, 1 = ผ่าน, 0 = ไม่ผ่าน</p>
              </div>
              <button
                onClick={handleSetAllCompetenciesTo3}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs border border-amber-500/30 transition-colors shadow-xs"
              >
                <CheckCheck className="w-4 h-4" />
                <span>ให้ 3 (ดีเยี่ยม) ทุกคน</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <tr className="bg-slate-950 border-b border-white/10 text-xs font-bold text-slate-300 font-mono">
                    <TableHead className="w-[70px] text-center sticky left-0 bg-slate-950 z-20 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">เลขที่</TableHead>
                    <TableHead className="w-[200px] sticky left-[70px] bg-slate-950 z-20 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">ชื่อ-นามสกุล</TableHead>
                    {COMPETENCIES_NAMES.map((name, i) => (
                      <TableHead key={i} className="text-center w-[110px] py-2 text-[11px] font-bold text-amber-400">{name}</TableHead>
                    ))}
                    <TableHead className="text-center w-[130px] bg-emerald-950/40 text-emerald-300">สรุปผลประเมิน</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const studentComp = competencies[student.id] || {};
                    const summary = getAverageLevel(studentComp, 5);
                    return (
                      <TableRow key={student.id} className="hover:bg-white/[0.03] border-b border-white/5 text-xs font-mono">
                        <TableCell className="text-center font-bold sticky left-0 bg-slate-950 text-slate-400 shadow-[1px_0_0_0_rgba(255,255,255,0.08)]">{student.number}</TableCell>
                        <TableCell className="font-semibold sticky left-[70px] bg-slate-950 text-slate-200 shadow-[1px_0_0_0_rgba(255,255,255,0.08)] font-sans">{student.name}</TableCell>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <TableCell key={num} className="p-1 text-center">
                            <select
                              value={studentComp[num.toString()] !== undefined ? studentComp[num.toString()] : 3}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCompetencies(prev => ({
                                  ...prev,
                                  [student.id]: { ...(prev[student.id] || {}), [num.toString()]: val }
                                }));
                              }}
                              className="w-14 py-1 text-center font-bold rounded-lg bg-slate-900 border border-white/10 text-slate-200 outline-none cursor-pointer focus:border-cyan-400"
                            >
                              <option value="3" className="bg-slate-900 text-slate-200">3</option>
                              <option value="2" className="bg-slate-900 text-slate-200">2</option>
                              <option value="1" className="bg-slate-900 text-slate-200">1</option>
                              <option value="0" className="bg-slate-900 text-slate-200">0</option>
                            </select>
                          </TableCell>
                        ))}
                        <TableCell className="text-center bg-emerald-950/20 font-bold text-emerald-300">
                          {summary}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: SUMMARY & SIGNATURES (Section 7) */}
        {/* ======================================================== */}
        {activeTab === "summary" && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-slate-100">สรุปเล่ม ปพ.5 และการอนุมัติผลการประเมิน</h3>
                <p className="text-xs text-slate-400">รวบรวมผลสัมฤทธิ์ทุกมิติ พร้อมช่องลงนาม 4 ระดับเพื่อพิมพ์ส่งฝ่ายวิชาการ</p>
              </div>
              <button
                onClick={handleExportFullPorPor5}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                <FileDown className="w-4 h-4" />
                <span>ดาวน์โหลดไฟล์ Excel ครบ 5 ชีต</span>
              </button>
            </div>

            {/* Summary Matrix Preview */}
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-slate-950/70">
              <Table>
                <TableHeader>
                  <tr className="bg-slate-950 text-xs font-bold text-slate-300 font-mono border-b border-white/10">
                    <TableHead className="w-[60px] text-center">เลขที่</TableHead>
                    <TableHead>ชื่อ-นามสกุล</TableHead>
                    <TableHead className="text-center text-indigo-300">คะแนนรวม 100</TableHead>
                    <TableHead className="text-center text-emerald-300">เกรด ปพ.5</TableHead>
                    <TableHead className="text-center">คุณลักษณะ 8 ด้าน</TableHead>
                    <TableHead className="text-center">อ่าน คิด เขียน</TableHead>
                    <TableHead className="text-center">สมรรถนะ 5 ด้าน</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {studentsWithCalculations.map((s) => (
                    <TableRow key={s.id} className="text-xs font-mono hover:bg-white/[0.03] border-b border-white/5">
                      <TableCell className="text-center font-bold text-slate-400">{s.number}</TableCell>
                      <TableCell className="font-sans font-bold text-slate-200">{s.name}</TableCell>
                      <TableCell className="text-center font-bold text-indigo-200">
                        {s.continuity.totalScore !== null ? s.continuity.totalScore : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {s.continuity.projectedGrade !== "-" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-black border border-emerald-500/30">
                            {s.continuity.projectedGrade}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-500 font-semibold border border-white/5">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-slate-300">{s.attrSummary}</TableCell>
                      <TableCell className="text-center text-slate-300">{s.litSummary}</TableCell>
                      <TableCell className="text-center text-slate-300">{s.compSummary}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 4-Tier Signature Blocks (Preview) */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-white/10">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                สายการอนุมัติ 4 ชั้น (4-Tier Signatures)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-center">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 shadow-sm flex flex-col justify-between h-36">
                  <span className="font-bold text-slate-200">1. ครูผู้สอน</span>
                  <div className="border-b border-dashed border-white/15 mx-4 my-2"></div>
                  <div>
                    <p className="font-medium text-slate-300">(นายพิชญุตม์ ครูผู้สอน)</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">วันที่ ......../......../........</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 shadow-sm flex flex-col justify-between h-36">
                  <span className="font-bold text-slate-200">2. หัวหน้ากลุ่มสาระฯ</span>
                  <div className="border-b border-dashed border-white/15 mx-4 my-2"></div>
                  <div>
                    <p className="font-medium text-slate-300">(..........................................)</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">วันที่ ......../......../........</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 shadow-sm flex flex-col justify-between h-36">
                  <span className="font-bold text-slate-200">3. หัวหน้างานวัดผล/วิชาการ</span>
                  <div className="border-b border-dashed border-white/15 mx-4 my-2"></div>
                  <div>
                    <p className="font-medium text-slate-300">(..........................................)</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">วันที่ ......../......../........</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 shadow-sm flex flex-col justify-between h-36">
                  <span className="font-bold text-slate-200">4. ผู้อำนวยการสถานศึกษา</span>
                  <div className="border-b border-dashed border-white/15 mx-4 my-2"></div>
                  <div>
                    <p className="font-medium text-slate-300">(..........................................)</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">วันที่ ......../......../........</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modal 1: Column Builder Modal (Spatial Dark Glass) */}
      {showAddColumnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900/95 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/10 text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-cyan-400 border border-indigo-500/30 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">เพิ่มช่องคะแนนใหม่</h3>
                  <p className="text-xs text-slate-400">สร้างคอลัมน์เก็บคะแนนเทอม 2</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddColumnModal(false)}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newCol.name || !newCol.maxScore) return;
              const columnId = `col_${selectedSubjectId}_${Date.now()}`;
              const createdCol: ScoreColumnRecord = {
                id: columnId,
                name: newCol.name,
                type: newCol.type || "collected",
                maxScore: Number(newCol.maxScore),
                weight: Number(newCol.weight) || Number(newCol.maxScore),
                term: "2",
                order: columns.length + 1,
                subjectId: selectedSubjectId
              };
              await saveScoreColumn(selectedSubjectId, createdCol);
              setColumns(prev => [...prev, createdCol]);
              setStudents(prev => prev.map(s => ({ ...s, scores: { ...s.scores, [columnId]: 0 } })));
              setShowAddColumnModal(false);
              setNewCol({ name: "", type: "collected", maxScore: 10, weight: 10, term: "2" });
            }} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1">ชื่อช่องคะแนน</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ใบงานที่ 3"
                  value={newCol.name}
                  onChange={(e) => setNewCol({ ...newCol, name: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-white/10 font-medium text-sm text-slate-100 outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1">ประเภทคะแนน</label>
                <select
                  value={newCol.type}
                  onChange={(e) => setNewCol({ ...newCol, type: e.target.value as any })}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-white/10 font-bold text-sm text-slate-200 outline-none focus:border-cyan-400"
                >
                  <option value="collected" className="bg-slate-900 text-slate-200">คะแนนเก็บระหว่างภาค (เทอม 2)</option>
                  <option value="midterm" className="bg-slate-900 text-slate-200">สอบกลางภาค (เทอม 2)</option>
                  <option value="final" className="bg-slate-900 text-slate-200">สอบปลายภาค (เทอม 2)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">คะแนนเต็มดิบ</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCol.maxScore}
                    onChange={(e) => setNewCol({ ...newCol, maxScore: Number(e.target.value) })}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-white/10 font-bold text-sm text-center text-slate-100 outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">น้ำหนักคะแนน (%)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCol.weight}
                    onChange={(e) => setNewCol({ ...newCol, weight: Number(e.target.value) })}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-white/10 font-bold text-sm text-center text-slate-100 outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddColumnModal(false)}
                  className="px-4 py-2.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 font-bold text-xs transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  สร้างคอลัมน์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Grade Analytics Dashboard Modal (Spatial Dark Glass) */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-slate-900/95 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/10 max-h-[90vh] flex flex-col text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-cyan-400 border border-indigo-500/30 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">การวิเคราะห์ผลการเรียน (Grade Analytics)</h3>
                  <p className="text-xs text-slate-400">ภาพรวมการกระจายเกรดและเด็กกลุ่มเสี่ยง</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAnalyticsModal(false)}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-6">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  การกระจายของเกรด (Grade Distribution)
                </h4>
                {scoredStudents.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gradeDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="grade" tick={{ fontSize: 12, fontWeight: "bold", fill: "#94a3b8" }} stroke="#334155" />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} stroke="#334155" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#f8fafc" }}
                          formatter={(value: any) => [`${value} คน`, "จำนวนนักเรียน"]} 
                        />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {gradeDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBarColor(entry.grade)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold gap-1 font-mono">
                    <BarChart3 className="w-8 h-8 text-slate-600 mb-1" />
                    <span>ยังไม่มีการลงคะแนนในวิชานี้</span>
                    <span className="text-[11px] text-slate-500">กราฟการกระจายเกรดจะแสดงผลเมื่อเริ่มบันทึกคะแนน</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-white/10">
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Dynamic Context Island for Scores */}
      <DynamicIsland
        statusIcon={
          isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8] animate-pulse" />
          )
        }
        statusText={
          <span>
            {saveStatus || `สมุด ปพ.5 • ${subjects.find(s => s.id === selectedSubjectId)?.code || "วิชา"} ห้อง ${selectedClassRoom} (${students.length} คน)`}
          </span>
        }
        actions={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowAnalyticsModal(true)}
              className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              title="ดูกราฟการกระจายเกรด"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">สถิติเกรด</span>
            </button>

            <button
              type="button"
              onClick={handleExportFullPorPor5}
              className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              title="ส่งออกเล่ม ปพ.5 Excel"
            >
              <FileDown className="w-3.5 h-3.5 text-teal-300" />
              <span className="hidden sm:inline">ส่งออก ปพ.5</span>
            </button>

            <button
              type="button"
              onClick={handleSaveActiveSection}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 hover:scale-[1.03] active:scale-[0.98]"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? "กำลังบันทึก..." : "บันทึก Cloud"}</span>
            </button>
          </div>
        }
      />
    </div>
  );
}

export default function SmartScorebookPage() {
  return (
    <Suspense fallback={
      <div className="py-24 flex flex-col items-center justify-center text-white/80 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-300" />
        <span className="text-sm font-bold">กำลังเปิดสมุด ปพ.5...</span>
      </div>
    }>
      <SmartScorebookContent />
    </Suspense>
  );
}
