"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Users, 
  Clock, 
  Award, 
  X, 
  Sparkles, 
  ArrowRight, 
  Trash2, 
  School, 
  CheckCircle2, 
  Loader2,
  Layers,
  GraduationCap,
  AlertTriangle
} from "lucide-react";
import { 
  getAllSubjects, 
  saveSubject, 
  deleteSubject, 
  SubjectDoc,
  getAllClassrooms,
  saveClassroom,
  deleteClassroom,
  ClassroomDoc
} from "@/lib/firebase/services";
import curriculumMaster from "@/lib/data/curriculum_master.json";

type ActiveTab = "subjects" | "classrooms";

export default function SubjectsAndClassroomsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("subjects");
  
  // Data State
  const [subjects, setSubjects] = useState<SubjectDoc[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  // Modals
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showAddClassroomModal, setShowAddClassroomModal] = useState(false);

  // Subject Form State
  // Level Definitions (Primary School First)
  const STANDARD_LEVEL_GROUPS = [
    { group: "ประถมศึกษา (ป.1 - ป.6)", levels: ["ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6"] },
    { group: "มัธยมศึกษาตอนต้น", levels: ["ม.1", "ม.2", "ม.3"] },
    { group: "มัธยมศึกษาตอนปลาย", levels: ["ม.4", "ม.5", "ม.6"] },
  ];

  // Subject Form State (Default Primary School)
  const [newSub, setNewSub] = useState<Partial<SubjectDoc>>({
    code: "",
    name: "",
    learningArea: "สังคมศึกษา ศาสนาฯ",
    level: "ป.6",
    type: "basic",
    credits: 2.0,
    hours: 80,
    assignedRooms: ["ป.6"]
  });
  const [customRoomInput, setCustomRoomInput] = useState("");

  // Classroom Form State (Default Single Room Primary)
  const [newRoom, setNewRoom] = useState<{
    name: string;
    level: string;
    roomType: "single" | "section";
    roomNumber: string;
    academicYear: string;
    advisorName: string;
    studentCount: number;
  }>({
    name: "",
    level: "ป.6",
    roomType: "single",
    roomNumber: "1",
    academicYear: "2568",
    advisorName: "นายพิชญุตม์ ประภาศิริ",
    studentCount: 20
  });

  // Load from Firestore
  const loadData = async () => {
    setLoading(true);
    try {
      let subList = await getAllSubjects();
      if (subList.length === 0) {
        // Seed initial default subjects from master curriculum (8 subjects + remediation)
        const defaultSubs: SubjectDoc[] = [
          ...(curriculumMaster as unknown as SubjectDoc[]),
          { id: "sub_rem_15901", code: "สป15901", name: "ซ่อมเสริม ป.5", learningArea: "กิจกรรมพัฒนาผู้เรียน", level: "ป.5", type: "additional", credits: 1.0, hours: 40, assignedRooms: ["ป.5"] }
        ];
        for (const s of defaultSubs) {
          await saveSubject(s);
        }
        subList = defaultSubs;
      }
      setSubjects(subList);

      let roomList = await getAllClassrooms();
      if (roomList.length === 0) {
        // Seed initial primary classrooms: ป.1 - ป.6
        const defaultRooms: ClassroomDoc[] = [
          { id: "room_p1", name: "ป.1", level: "ป.1", roomNumber: "1", academicYear: "2568", advisorName: "ครูประจำชั้น ป.1", studentCount: 20 },
          { id: "room_p2", name: "ป.2", level: "ป.2", roomNumber: "1", academicYear: "2568", advisorName: "ครูประจำชั้น ป.2", studentCount: 22 },
          { id: "room_p3", name: "ป.3", level: "ป.3", roomNumber: "1", academicYear: "2568", advisorName: "ครูประจำชั้น ป.3", studentCount: 24 },
          { id: "room_p4", name: "ป.4", level: "ป.4", roomNumber: "1", academicYear: "2568", advisorName: "ครูประจำชั้น ป.4", studentCount: 25 },
          { id: "room_p5", name: "ป.5", level: "ป.5", roomNumber: "1", academicYear: "2568", advisorName: "ครูประจำชั้น ป.5", studentCount: 28 },
          { id: "room_p6", name: "ป.6", level: "ป.6", roomNumber: "1", academicYear: "2568", advisorName: "นายพิชญุตม์ ประภาศิริ", studentCount: 6 },
        ];
        for (const r of defaultRooms) {
          await saveClassroom(r);
        }
        roomList = defaultRooms;
      }
      setClassrooms(roomList);

    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Add Subject Handler (Firestore)
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSub.code || !newSub.name) return;

    const targetLevel = newSub.level || "ม.4";
    // If assigned rooms is empty, check matching classrooms or fallback to targetLevel
    let assigned = newSub.assignedRooms && newSub.assignedRooms.length > 0
      ? newSub.assignedRooms
      : classrooms.filter(c => c.level === targetLevel).map(c => c.name);

    if (assigned.length === 0) {
      assigned = [targetLevel];
    }

    const id = `sub_${newSub.code.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now()}`;
    const subjectItem: SubjectDoc = {
      id,
      code: newSub.code.trim().toUpperCase(),
      name: newSub.name.trim(),
      learningArea: newSub.learningArea || "ศิลปะ",
      level: targetLevel,
      type: newSub.type || "basic",
      credits: Number(newSub.credits) || 1.0,
      hours: Number(newSub.hours) || 40,
      assignedRooms: assigned
    };

    try {
      await saveSubject(subjectItem);
      setSubjects(prev => [subjectItem, ...prev]);
      setShowAddSubjectModal(false);
      setNewSub({ 
        code: "", 
        name: "", 
        learningArea: "ศิลปะ", 
        level: targetLevel, 
        type: "basic", 
        credits: 1.0, 
        hours: 40, 
        assignedRooms: classrooms.filter(c => c.level === targetLevel).map(c => c.name) 
      });
      setCustomRoomInput("");
      showToast(`สร้างรายวิชา "${subjectItem.code} ${subjectItem.name}" (ชั้น ${targetLevel}) บันทึกขึ้น Cloud สำเร็จ ✅`);
    } catch (err: any) {
      console.error(err);
      showToast(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  // Delete Subject Handler (Firestore)
  const handleDeleteSubject = async (id: string, name: string) => {
    if (!confirm(`คุณครูต้องการลบรายวิชา "${name}" ใช่หรือไม่?`)) return;
    try {
      await deleteSubject(id);
      setSubjects(prev => prev.filter(s => s.id !== id));
      showToast(`ลบรายวิชาเรียบร้อยแล้ว`);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Add Classroom Handler (Firestore)
  const handleAddClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    let formattedName = newRoom.name?.trim();
    if (!formattedName) {
      if (newRoom.roomType === "single") {
        formattedName = newRoom.level; // e.g. "ป.6"
      } else {
        formattedName = `${newRoom.level}/${newRoom.roomNumber || "1"}`; // e.g. "ม.4/1"
      }
    }
    const id = `room_${formattedName.replace(/[\/\s]/g, "_")}`;

    const roomItem: ClassroomDoc = {
      id,
      name: formattedName,
      level: newRoom.level || "ป.6",
      roomNumber: newRoom.roomNumber || "1",
      academicYear: newRoom.academicYear || "2568",
      advisorName: newRoom.advisorName || "นายพิชญุตม์ ประภาศิริ",
      studentCount: Number(newRoom.studentCount) || 6
    };

    try {
      await saveClassroom(roomItem);
      setClassrooms(prev => [roomItem, ...prev]);
      setShowAddClassroomModal(false);
      setNewRoom({ 
        name: "", 
        level: newRoom.level || "ป.6", 
        roomType: "single", 
        roomNumber: "1", 
        academicYear: "2568", 
        advisorName: "นายพิชญุตม์ ประภาศิริ", 
        studentCount: 6 
      });
      showToast(`สร้างห้องเรียน "${formattedName}" (ระดับชั้น ${roomItem.level}) บันทึกขึ้น Cloud สำเร็จ ✅`);
    } catch (err: any) {
      console.error(err);
      showToast(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  // Delete Classroom Handler (Firestore)
  const handleDeleteClassroom = async (id: string, name: string) => {
    if (!confirm(`คุณครูต้องการลบห้องเรียน "${name}" ใช่หรือไม่?`)) return;
    try {
      await deleteClassroom(id);
      setClassrooms(prev => prev.filter(r => r.id !== id));
      showToast(`ลบห้องเรียนเรียบร้อยแล้ว`);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Filters
  const filteredSubjects = subjects.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.level.includes(searchQuery)
  );

  const filteredClassrooms = classrooms.filter(r =>
    r.name.includes(searchQuery) ||
    (r.advisorName && r.advisorName.includes(searchQuery))
  );

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-cyan-300 text-xs font-mono font-semibold mb-2 shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>โครงสร้างหลักสูตรและห้องเรียน • ซิงก์ Cloud Firestore</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            {activeTab === "subjects" ? `รายวิชาที่สอน (${subjects.length} วิชา)` : `ห้องเรียนทั้งหมด (${classrooms.length} ห้อง)`}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            จัดการโครงสร้างหน่วยการเรียนรู้ ตัวชี้วัด และการจัดห้องเรียนจริงในระบบ
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {notification && (
            <span className="px-3 py-1.5 rounded-xl bg-cyan-950/90 text-cyan-300 font-mono font-bold text-xs shadow-lg border border-cyan-400/30">
              {notification}
            </span>
          )}

          {activeTab === "subjects" ? (
            <button
              onClick={() => setShowAddSubjectModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs sm:text-sm border border-white/10 shadow-[0_0_16px_rgba(99,102,241,0.4)] transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-cyan-300" />
              <span>เพิ่มรายวิชาใหม่</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddClassroomModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs sm:text-sm border border-white/10 shadow-[0_0_16px_rgba(99,102,241,0.4)] transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-cyan-300" />
              <span>เพิ่มห้องเรียนใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Switcher */}
      <div className="flex items-center gap-2 pb-2">
        <button
          onClick={() => setActiveTab("subjects")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "subjects"
              ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-[0_0_16px_rgba(99,102,241,0.4)] scale-[1.02]"
              : "bg-slate-900/60 hover:bg-slate-900/90 text-slate-300 border border-white/5"
          }`}
        >
          <BookOpen className="w-4 h-4 text-cyan-300" />
          <span>รายวิชาที่สอน (Subjects)</span>
        </button>

        <button
          onClick={() => setActiveTab("classrooms")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "classrooms"
              ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-[0_0_16px_rgba(99,102,241,0.4)] scale-[1.02]"
              : "bg-slate-900/60 hover:bg-slate-900/90 text-slate-300 border border-white/5"
          }`}
        >
          <School className="w-4 h-4 text-indigo-300" />
          <span>ห้องเรียน (Classrooms)</span>
        </button>
      </div>

      {/* Main Bento Container */}
      <div className="bg-slate-900/80 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl p-6 space-y-6">
        
        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={activeTab === "subjects" ? "ค้นหารหัสวิชา หรือชื่อวิชา..." : "ค้นหาห้องเรียน หรือครูประจำชั้น..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 focus:border-cyan-400 font-medium text-xs sm:text-sm text-slate-100 outline-none transition-colors"
            />
          </div>
          <span className="text-xs font-mono font-semibold text-slate-400">
            {activeTab === "subjects" ? `พบ ${filteredSubjects.length} รายวิชา` : `พบ ${filteredClassrooms.length} ห้องเรียน`}
          </span>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="text-sm font-medium font-mono">กำลังโหลดข้อมูลจาก Cloud Firestore...</span>
          </div>
        ) : activeTab === "subjects" ? (
          /* ======================================================== */
          /* TAB 1: SUBJECTS GRID */
          /* ======================================================== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSubjects.map((sub) => (
              <div
                key={sub.id}
                className="group p-5 rounded-2xl bg-slate-950/80 hover:bg-slate-950 border border-white/10 hover:border-cyan-500/40 shadow-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-lg bg-indigo-500/15 text-cyan-300 border border-indigo-500/30 font-mono font-bold text-xs">
                      {sub.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-slate-400 border border-white/5 font-semibold text-[11px]">
                        {sub.type === "basic" ? "พื้นฐาน" : "เพิ่มเติม"}
                      </span>
                      <button
                        onClick={() => handleDeleteSubject(sub.id, `${sub.code} ${sub.name}`)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-opacity"
                        title="ลบรายวิชา"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span>สาระ: {sub.learningArea}</span>
                    <span>•</span>
                    <span>ระดับ {sub.level}</span>
                  </p>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        {sub.credits} หน่วยกิต
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {sub.hours} ชม.
                      </span>
                    </div>

                    {sub.units && sub.units.length > 0 && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 font-bold border border-cyan-500/30">
                        {sub.units.length} หน่วยเรียนรู้
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {sub.assignedRooms && sub.assignedRooms.map((r) => (
                      <span key={r} className="px-2 py-0.5 rounded-md bg-slate-900 border border-white/5 text-slate-300 font-mono font-bold text-[10px]">
                        ห้อง {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <Link
                    href={`/subjects/${sub.id}`}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <span>โครงสร้างหน่วย ({sub.code})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={`/scores?subjectId=${sub.id}&classId=${sub.assignedRooms?.[0] || "ป.6"}`}
                    className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors border border-white/10"
                  >
                    สมุด ปพ.5
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ======================================================== */
          /* TAB 2: CLASSROOMS GRID */
          /* ======================================================== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClassrooms.map((room) => (
              <div
                key={room.id}
                className="group p-5 rounded-2xl bg-slate-950/80 hover:bg-slate-950 border border-white/10 hover:border-cyan-500/40 shadow-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-sm">
                      ห้อง {room.name}
                    </span>
                    <button
                      onClick={() => handleDeleteClassroom(room.id, room.name)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-opacity"
                      title="ลบห้องเรียน"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mt-2">
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    <span>ครูประจำชั้น: {room.advisorName || "ยังไม่ระบุ"}</span>
                  </p>

                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      นักเรียนประมาณ {room.studentCount || 30} คน
                    </span>
                    <span>•</span>
                    <span>ปี {room.academicYear || "2568"}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <Link
                    href="/students"
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <span>ดูรายชื่อนักเรียน</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={`/attendance?classId=${room.name}`}
                    className="px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    เช็กชื่อห้องนี้
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal 1: Add Subject Modal (Spatial Dark Glass) */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900/95 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/10 max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-cyan-400 border border-indigo-500/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">เพิ่มรายวิชาใหม่</h3>
                  <p className="text-xs text-slate-400">กำหนดรหัสวิชา ระดับชั้น และห้องเรียนที่เปิดสอน</p>
                </div>
              </div>
              <button onClick={() => setShowAddSubjectModal(false)} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubject} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1">รหัสวิชา *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ส13101 หรือ ส14102"
                    value={newSub.code}
                    onChange={(e) => setNewSub({ ...newSub, code: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 font-mono text-xs uppercase outline-none focus:border-cyan-400 font-bold text-slate-100 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1">ระดับชั้น *</label>
                  <select
                    value={newSub.level}
                    onChange={(e) => {
                      const lvl = e.target.value;
                      const matched = classrooms.filter(c => c.level === lvl).map(c => c.name);
                      setNewSub({ 
                        ...newSub, 
                        level: lvl, 
                        assignedRooms: matched.length > 0 ? matched : [lvl] 
                      });
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-bold text-slate-100 outline-none focus:border-cyan-400"
                  >
                    {STANDARD_LEVEL_GROUPS.map((grp) => (
                      <optgroup key={grp.group} label={grp.group} className="bg-slate-950 text-slate-400">
                        {grp.levels.map((lvl) => (
                          <option key={lvl} value={lvl} className="bg-slate-900 text-slate-100">{lvl}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1">ชื่อรายวิชา *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สังคมศึกษา ศาสนา และวัฒนธรรม 3"
                  value={newSub.name}
                  onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-semibold text-slate-100 outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* Assigned Rooms Selector */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ห้องเรียนที่เปิดสอนในวิชานี้ (ชั้น {newSub.level || "ป.6"})</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    เลือกแล้ว {newSub.assignedRooms?.length || 0} ห้อง
                  </span>
                </div>

                {classrooms.filter(c => c.level === (newSub.level || "ป.6")).length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {classrooms.filter(c => c.level === (newSub.level || "ป.6")).map((c) => {
                      const isSelected = newSub.assignedRooms?.includes(c.name);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            const current = newSub.assignedRooms || [];
                            if (isSelected) {
                              setNewSub({ ...newSub, assignedRooms: current.filter(r => r !== c.name) });
                            } else {
                              setNewSub({ ...newSub, assignedRooms: [...current, c.name] });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                            isSelected 
                              ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white border-transparent shadow-[0_0_12px_rgba(99,102,241,0.4)]" 
                              : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/10"
                          }`}
                        >
                          {isSelected ? `✓ ห้อง ${c.name}` : `+ ห้อง ${c.name}`}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-2">
                    <p className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>ยังไม่มีห้องเรียนระดับชั้น {newSub.level} ในระบบ</span>
                    </p>
                    <p className="text-[11px] text-amber-400/80">
                      ระบบจะผูกห้อง &quot;{newSub.level}&quot; ให้อัตโนมัติ หรือคุณครูสามารถระบุชื่อห้องเรียนเพิ่มเติมได้ทันที:
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`เช่น ${newSub.level} หรือ ${newSub.level}/1`}
                        value={customRoomInput}
                        onChange={(e) => setCustomRoomInput(e.target.value)}
                        className="p-1.5 px-2.5 rounded-lg bg-slate-950 border border-amber-500/40 text-xs font-semibold text-slate-100 outline-none flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customRoomInput.trim()) {
                            const current = newSub.assignedRooms || [];
                            if (!current.includes(customRoomInput.trim())) {
                              setNewSub({ ...newSub, assignedRooms: [...current, customRoomInput.trim()] });
                              setCustomRoomInput("");
                            }
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-500"
                      >
                        เพิ่มห้อง
                      </button>
                    </div>
                  </div>
                )}

                {/* Display selected chips */}
                {newSub.assignedRooms && newSub.assignedRooms.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400">ห้องที่จะบันทึก:</span>
                    {newSub.assignedRooms.map((rm) => (
                      <span key={rm} className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-cyan-300 text-[10px] font-mono font-bold flex items-center gap-1">
                        <span>{rm}</span>
                        <button
                          type="button"
                          onClick={() => setNewSub({ ...newSub, assignedRooms: newSub.assignedRooms?.filter(r => r !== rm) })}
                          className="hover:text-rose-400 ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1">กลุ่มสาระการเรียนรู้</label>
                  <select
                    value={newSub.learningArea}
                    onChange={(e) => setNewSub({ ...newSub, learningArea: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-bold text-slate-100 outline-none focus:border-cyan-400"
                  >
                    <option value="ศิลปะ" className="bg-slate-900">ศิลปะ</option>
                    <option value="วิทยาศาสตร์และเทคโนโลยี" className="bg-slate-900">วิทยาศาสตร์และเทคโนโลยี</option>
                    <option value="คณิตศาสตร์" className="bg-slate-900">คณิตศาสตร์</option>
                    <option value="ภาษาไทย" className="bg-slate-900">ภาษาไทย</option>
                    <option value="ภาษาต่างประเทศ" className="bg-slate-900">ภาษาต่างประเทศ</option>
                    <option value="สังคมศึกษา ศาสนาฯ" className="bg-slate-900">สังคมศึกษา ศาสนาฯ</option>
                    <option value="สุขศึกษาและพลศึกษา" className="bg-slate-900">สุขศึกษาและพลศึกษา</option>
                    <option value="การงานอาชีพ" className="bg-slate-900">การงานอาชีพ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1">ประเภทวิชา</label>
                  <select
                    value={newSub.type}
                    onChange={(e) => setNewSub({ ...newSub, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-bold text-slate-100 outline-none focus:border-cyan-400"
                  >
                    <option value="basic" className="bg-slate-900">วิชาพื้นฐาน</option>
                    <option value="additional" className="bg-slate-900">วิชาเพิ่มเติม</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">หน่วยกิต</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newSub.credits}
                    onChange={(e) => setNewSub({ ...newSub, credits: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-bold text-center text-slate-100 outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">ชั่วโมงเรียน/ปี</label>
                  <input
                    type="number"
                    value={newSub.hours}
                    onChange={(e) => setNewSub({ ...newSub, hours: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-bold text-center text-slate-100 outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-bold text-xs transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  บันทึกรายวิชา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Classroom Modal (Spatial Dark Glass) */}
      {showAddClassroomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900/95 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-white/10 text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center">
                  <School className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">เพิ่มห้องเรียนใหม่</h3>
                  <p className="text-xs text-slate-400">รองรับทั้งห้องเดี่ยวและห้องย่อยตามหลักสูตรไทย</p>
                </div>
              </div>
              <button onClick={() => setShowAddClassroomModal(false)} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClassroom} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1">ระดับชั้น *</label>
                <select
                  value={newRoom.level}
                  onChange={(e) => setNewRoom({ ...newRoom, level: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-bold text-slate-100 outline-none focus:border-cyan-400"
                >
                  {STANDARD_LEVEL_GROUPS.map((grp) => (
                    <optgroup key={grp.group} label={grp.group} className="bg-slate-950 text-slate-400">
                      {grp.levels.map((lvl) => (
                        <option key={lvl} value={lvl} className="bg-slate-900 text-slate-100">{lvl}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Room Type Selector */}
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1.5">รูปแบบห้องเรียน</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRoom({ ...newRoom, roomType: "single" })}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      newRoom.roomType === "single"
                        ? "bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                        : "bg-slate-950 border-white/10 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <p className="font-bold">ห้องเดี่ยว (เช่น {newRoom.level})</p>
                    <p className="text-[10px] font-normal text-slate-500 mt-0.5">ชั้นละ 1 ห้อง</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRoom({ ...newRoom, roomType: "section" })}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      newRoom.roomType === "section"
                        ? "bg-cyan-950/60 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                        : "bg-slate-950 border-white/10 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <p className="font-bold">มีห้องย่อย (เช่น {newRoom.level}/1)</p>
                    <p className="text-[10px] font-normal text-slate-500 mt-0.5">ชั้นละหลายห้อง</p>
                  </button>
                </div>
              </div>

              {newRoom.roomType === "section" && (
                <div>
                  <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1">ห้องที่ (Room Number) *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 1 หรือ 2"
                    value={newRoom.roomNumber}
                    onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono font-bold text-center text-slate-100 outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              {/* Live Preview Box */}
              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs flex items-center justify-between">
                <span className="font-semibold text-slate-400 font-mono">ชื่อห้องที่จะบันทึก:</span>
                <span className="font-black text-cyan-300 text-sm bg-slate-900 px-3 py-1 rounded-xl shadow-xs border border-white/10 font-mono">
                  ห้อง {newRoom.roomType === "single" ? newRoom.level : `${newRoom.level}/${newRoom.roomNumber || "1"}`}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-400 mb-1">ชื่อครูประจำชั้น</label>
                <input
                  type="text"
                  placeholder="เช่น นายพิชญุตม์ ครูผู้สอน"
                  value={newRoom.advisorName}
                  onChange={(e) => setNewRoom({ ...newRoom, advisorName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-medium text-slate-100 outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">จำนวนนักเรียนโดยประมาณ</label>
                  <input
                    type="number"
                    value={newRoom.studentCount}
                    onChange={(e) => setNewRoom({ ...newRoom, studentCount: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-bold text-center text-slate-100 outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">ปีการศึกษา</label>
                  <input
                    type="text"
                    value={newRoom.academicYear}
                    onChange={(e) => setNewRoom({ ...newRoom, academicYear: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-bold text-center text-slate-100 outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddClassroomModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-bold text-xs transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  บันทึกห้องเรียน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
