"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Users, 
  Upload, 
  UserPlus, 
  Search, 
  FileDown, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Loader2, 
  Filter,
  X,
  FileSpreadsheet,
  LayoutGrid,
  Table as TableIcon
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  getAllStudents, 
  getAllClassrooms,
  saveStudent, 
  saveStudentsBatch, 
  deleteStudent, 
  StudentRecord,
  ClassroomDoc
} from "@/lib/firebase/services";
import { downloadStudentTemplate, parseStudentsExcel } from "@/lib/excel/studentParser";
import { DynamicIsland } from "@/components/ui/DynamicIsland";

export default function StudentsManagementPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  
  // Status notifications
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [previewStudents, setPreviewStudents] = useState<StudentRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Student Form State
  const [newStudent, setNewStudent] = useState<Partial<StudentRecord>>({
    number: 1,
    studentCode: "",
    prefix: "ด.ช.",
    firstName: "",
    lastName: "",
    room: "ป.6",
    status: "active"
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load students and classrooms from Firestore
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const [data, roomList] = await Promise.all([
        getAllStudents(),
        getAllClassrooms()
      ]);
      setStudents(data);
      setClassrooms(roomList);
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: "error", text: "ไม่สามารถดึงข้อมูลนักเรียนได้ โปรดตรวจสอบการเชื่อมต่อ" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const showNotification = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Handle Excel File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSubmitting(true);
      const parsed = await parseStudentsExcel(file, selectedRoom === "all" ? "ป.6" : selectedRoom);
      if (parsed.length === 0) {
        showNotification("error", "ไม่พบข้อมูลนักเรียนที่ถูกต้องในไฟล์");
        return;
      }
      setPreviewStudents(parsed);
      setShowImportPreview(true);
    } catch (err: any) {
      console.error(err);
      showNotification("error", `อ่านไฟล์ไม่สำเร็จ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Confirm Import Batch
  const handleConfirmImport = async () => {
    setIsSubmitting(true);
    try {
      const count = await saveStudentsBatch(previewStudents);
      showNotification("success", `นำเข้านักเรียน ${count} คน ขึ้น Cloud Firestore สำเร็จแล้ว ✅`);
      setShowImportPreview(false);
      setPreviewStudents([]);
      await fetchStudents();
    } catch (err: any) {
      console.error(err);
      showNotification("error", `บันทึกไม่สำเร็จ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Single Student
  const handleAddSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.firstName || !newStudent.studentCode) {
      showNotification("error", "กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setIsSubmitting(true);
    try {
      const fullName = `${newStudent.prefix || ""} ${newStudent.firstName} ${newStudent.lastName || ""}`.trim();
      const studentData: StudentRecord = {
        id: newStudent.studentCode!,
        studentCode: newStudent.studentCode!,
        number: Number(newStudent.number) || (students.length + 1),
        prefix: newStudent.prefix || "",
        firstName: newStudent.firstName!,
        lastName: newStudent.lastName || "",
        name: fullName,
        room: newStudent.room || "ป.6",
        classroomId: newStudent.room || "ป.6",
        status: (newStudent.status as any) || "active"
      };

      await saveStudent(studentData);
      showNotification("success", `เพิ่มนักเรียน "${fullName}" สำเร็จแล้ว ✅`);
      setShowAddModal(false);
      setNewStudent({
        number: students.length + 2,
        studentCode: "",
        prefix: "ด.ช.",
        firstName: "",
        lastName: "",
        room: newStudent.room || "ป.6",
        status: "active"
      });
      await fetchStudents();
    } catch (err: any) {
      console.error(err);
      showNotification("error", `บันทึกไม่สำเร็จ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Student
  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`คุณครูต้องการลบข้อมูล "${name}" ใช่หรือไม่?`)) return;

    try {
      await deleteStudent(id);
      showNotification("success", `ลบข้อมูลนักเรียนเรียบร้อยแล้ว`);
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      console.error(err);
      showNotification("error", `ลบไม่สำเร็จ: ${err.message}`);
    }
  };

  // Seed Default Demo Students (if empty)
  const handleSeedDemo = async () => {
    setIsSubmitting(true);
    const demoStudents: StudentRecord[] = [
      { id: "10001", studentCode: "10001", number: 1, prefix: "ด.ช.", firstName: "ปัณณวัฒน์", lastName: "ชูเมือง", name: "ด.ช. ปัณณวัฒน์ ชูเมือง", room: "ป.6", classroomId: "ป.6", status: "active" },
      { id: "10002", studentCode: "10002", number: 2, prefix: "ด.ช.", firstName: "สันติสุข", lastName: "เสนสรสัง", name: "ด.ช. สันติสุข เสนสรสัง", room: "ป.6", classroomId: "ป.6", status: "active" },
      { id: "10003", studentCode: "10003", number: 3, prefix: "ด.ช.", firstName: "กิตตินัน", lastName: "นาคแก้ว", name: "ด.ช. กิตตินัน นาคแก้ว", room: "ป.6", classroomId: "ป.6", status: "active" },
      { id: "10004", studentCode: "10004", number: 4, prefix: "ด.ช.", firstName: "กฤษณพล", lastName: "พัฒนศิลป์", name: "ด.ช. กฤษณพล พัฒนศิลป์", room: "ป.6", classroomId: "ป.6", status: "active" },
      { id: "10005", studentCode: "10005", number: 5, prefix: "ด.ญ.", firstName: "นันทกานต์", lastName: "สันทวงศ์", name: "ด.ญ. นันทกานต์ สันทวงศ์", room: "ป.6", classroomId: "ป.6", status: "active" },
      { id: "10006", studentCode: "10006", number: 6, prefix: "ด.ญ.", firstName: "น้อง", lastName: "พม่า", name: "ด.ญ. น้อง พม่า", room: "ป.6", classroomId: "ป.6", status: "active" },
    ];

    try {
      await saveStudentsBatch(demoStudents);
      showNotification("success", "สร้างข้อมูลนักเรียน ป.6 ทั้ง 6 คนขึ้น Firestore สำเร็จ ✅");
      await fetchStudents();
    } catch (err: any) {
      showNotification("error", `เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.number.toString().includes(searchQuery);
    const matchesRoom = selectedRoom === "all" || s.room === selectedRoom;
    return matchesSearch && matchesRoom;
  });

  // Extract unique rooms (merged from created classrooms and students)
  const rooms = Array.from(new Set([
    ...classrooms.map(c => c.name),
    ...students.map(s => s.room)
  ].filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/80 border border-white/10 text-cyan-300 text-xs font-semibold mb-2 shadow-xs">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>ทะเบียนนักเรียน • ซิงก์ Cloud Firestore</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            จัดการนักเรียน ({students.length} คน)
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            นำเข้าไฟล์ Excel รายชื่อทั้งห้องในคลิกเดียว พร้อมจัดการสถานะนักเรียนรายบุคคล
          </p>
        </div>

        {/* Global Action Hub */}
        <div className="flex flex-wrap items-center gap-2.5">
          {statusMsg && (
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border shadow-md backdrop-blur-md ${
              statusMsg.type === "success" 
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" 
                : "bg-rose-500/15 text-rose-300 border-rose-500/30"
            }`}>
              {statusMsg.text}
            </span>
          )}

          <button
            onClick={() => downloadStudentTemplate()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-slate-200 font-bold text-xs sm:text-sm border border-white/10 shadow-sm transition-all hover:scale-[1.02]"
            title="ดาวน์โหลดแบบฟอร์มเปล่าเพื่อนำไปกรอก"
          >
            <FileDown className="w-4 h-4 text-emerald-400" />
            <span>โหลด Template</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Upload className="w-4 h-4 text-white" />
            <span>นำเข้า Excel</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs sm:text-sm border border-cyan-500/30 shadow-md transition-all hover:scale-[1.02]"
          >
            <UserPlus className="w-4 h-4 text-cyan-400" />
            <span>เพิ่มนักเรียน</span>
          </button>
        </div>
      </div>

      {/* Main Spatial Container */}
      <div className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden text-slate-100">
        
        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, เลขที่ หรือรหัสนักเรียน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-white/10 focus:border-cyan-400 text-xs sm:text-sm font-medium outline-none transition-all text-slate-100"
              />
            </div>

            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="py-2 px-3 rounded-xl bg-slate-950 border border-white/10 text-xs sm:text-sm font-bold text-slate-200 outline-none focus:border-cyan-400"
            >
              <option value="all" className="bg-slate-900 text-slate-200">ทุกห้องเรียน ({students.length})</option>
              {rooms.map(r => (
                <option key={r} value={r} className="bg-slate-900 text-slate-200">ห้อง {r}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400 w-full sm:w-auto justify-end">
            <span className="font-mono">แสดงผล {filteredStudents.length} คน</span>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "cards"
                    ? "bg-slate-800 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)] border border-cyan-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                <span>การ์ดนักเรียน</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "table"
                    ? "bg-slate-800 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)] border border-cyan-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>ตารางข้อมูล</span>
              </button>
            </div>

            {students.length === 0 && !loading && (
              <button
                onClick={handleSeedDemo}
                disabled={isSubmitting}
                className="ml-2 px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold transition-all"
              >
                + เติมข้อมูลตัวอย่าง 6 คน (ป.6)
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-sm font-medium">กำลังโหลดรายชื่อนักเรียนจาก Cloud...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">ยังไม่มีรายชื่อนักเรียนในระบบ</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1">
              คุณครูสามารถกดปุ่ม "นำเข้า Excel" เพื่ออัปโหลดไฟล์รายชื่อทั้งห้อง หรือกด "โหลด Template" เพื่อรับแบบฟอร์ม
            </p>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>นำเข้าไฟล์ Excel ทันที</span>
              </button>
              <button
                onClick={handleSeedDemo}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
              >
                เติมข้อมูลตัวอย่าง 6 คน (ป.6)
              </button>
            </div>
          </div>
        ) : viewMode === "cards" ? (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 bg-slate-50/30 dark:bg-slate-900/30">
            {filteredStudents.map((s) => (
              <div
                key={s.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                      #{s.number}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[11px]">
                      ห้อง {s.room || "ป.6"}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-0.5">
                    {s.name}
                  </h4>
                  <p className="text-xs font-mono text-slate-400">
                    รหัสประจำตัว: {s.studentCode}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-700/60">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-100 dark:border-emerald-800">
                    {s.status === "active" ? "กำลังศึกษา" : "ย้ายออก"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteStudent(s.id, s.name)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title="ลบนักเรียน"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold text-slate-600">
                  <TableHead className="w-[80px] text-center">เลขที่</TableHead>
                  <TableHead className="w-[140px]">รหัสนักเรียน</TableHead>
                  <TableHead>ชื่อ - นามสกุล</TableHead>
                  <TableHead className="w-[120px] text-center">ห้องเรียน</TableHead>
                  <TableHead className="w-[120px] text-center">สถานะ</TableHead>
                  <TableHead className="w-[100px] text-right pr-6">จัดการ</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((s) => (
                  <TableRow key={s.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                    <TableCell className="text-center font-bold text-slate-800">
                      {s.number}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-slate-600">
                      {s.studentCode}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      {s.name}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs">
                        {s.room}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {s.status === "active" ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">
                          กำลังศึกษา
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-bold text-xs">
                          ย้ายออก
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <button
                        onClick={() => handleDeleteStudent(s.id, s.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="ลบนักเรียน"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Modal 1: Import Excel Preview */}
      {showImportPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-white max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">ตรวจสอบข้อมูลก่อนนำเข้า</h3>
                  <p className="text-xs text-slate-500">พบนักเรียนทั้งหมด {previewStudents.length} คน จากไฟล์ Excel</p>
                </div>
              </div>
              <button 
                onClick={() => setShowImportPreview(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview List */}
            <div className="flex-1 overflow-y-auto my-4 rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="border-b border-slate-100 font-bold text-slate-600">
                    <th className="py-2.5 px-3 text-center">เลขที่</th>
                    <th className="py-2.5 px-3">รหัส</th>
                    <th className="py-2.5 px-3">ชื่อ-สกุล</th>
                    <th className="py-2.5 px-3 text-center">ห้อง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {previewStudents.slice(0, 50).map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-center font-bold">{p.number}</td>
                      <td className="py-2 px-3 font-mono">{p.studentCode}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-2 px-3 text-center">{p.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewStudents.length > 50 && (
                <div className="p-3 text-center text-xs text-slate-400 bg-slate-50">
                  ... และอีก {previewStudents.length - 50} คน
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowImportPreview(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-2xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/20"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>ยืนยันบันทึก {previewStudents.length} คนขึ้น Cloud</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Add Single Student */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-white">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">เพิ่มนักเรียนใหม่</h3>
                  <p className="text-xs text-slate-500">บันทึกตรงสู่ Cloud Firestore</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSingleStudent} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">เลขที่</label>
                  <input
                    type="number"
                    required
                    value={newStudent.number}
                    onChange={(e) => setNewStudent({ ...newStudent, number: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-center text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">รหัสนักเรียน</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 10001"
                    value={newStudent.studentCode}
                    onChange={(e) => setNewStudent({ ...newStudent, studentCode: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">คำนำหน้า</label>
                  <select
                    value={newStudent.prefix}
                    onChange={(e) => setNewStudent({ ...newStudent, prefix: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-xs outline-none"
                  >
                    <option value="ด.ช.">ด.ช.</option>
                    <option value="ด.ญ.">ด.ญ.</option>
                    <option value="นาย">นาย</option>
                    <option value="น.ส.">น.ส.</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">ชื่อจริง</label>
                  <input
                    type="text"
                    required
                    placeholder="สมชาย"
                    value={newStudent.firstName}
                    onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">นามสกุล</label>
                <input
                  type="text"
                  placeholder="รักเรียน"
                  value={newStudent.lastName}
                  onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">ห้องเรียน *</label>
                  <select
                    required
                    value={newStudent.room}
                    onChange={(e) => {
                      const selRoom = e.target.value;
                      const isHigh = selRoom.startsWith("ม.4") || selRoom.startsWith("ม.5") || selRoom.startsWith("ม.6");
                      setNewStudent({ 
                        ...newStudent, 
                        room: selRoom,
                        prefix: isHigh 
                          ? (newStudent.prefix === "ด.ญ." ? "น.ส." : "นาย") 
                          : (newStudent.prefix === "น.ส." ? "ด.ญ." : "ด.ช.")
                      });
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs outline-none focus:border-indigo-500"
                  >
                    {rooms.map(r => (
                      <option key={r} value={r}>ห้อง {r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">สถานะ</label>
                  <select
                    value={newStudent.status}
                    onChange={(e) => setNewStudent({ ...newStudent, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-xs outline-none"
                  >
                    <option value="active">กำลังศึกษา</option>
                    <option value="transferred">ย้ายออก</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-2xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-lg transition-all"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกนักเรียน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Dynamic Context Island for Students */}
      <DynamicIsland
        statusIcon={
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
        }
        statusText={
          <span>
            ทะเบียนนักเรียน • {selectedRoom === "all" ? `ทั้งหมด ${students.length} คน` : `ห้อง ${selectedRoom} (${filteredStudents.length} คน)`}
          </span>
        }
        actions={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode(prev => prev === "cards" ? "table" : "cards")}
              className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              title="สลับมุมมองการ์ด / ตาราง"
            >
              {viewMode === "cards" ? (
                <>
                  <TableIcon className="w-3.5 h-3.5 text-teal-300" />
                  <span className="hidden sm:inline">ดูตาราง</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="w-3.5 h-3.5 text-indigo-300" />
                  <span className="hidden sm:inline">ดูการ์ด</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all flex items-center gap-1.5"
              title="นำเข้าไฟล์ Excel"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden sm:inline">นำเข้า Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 hover:scale-[1.03] active:scale-[0.98]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>เพิ่มนักเรียน</span>
            </button>
          </div>
        }
      />
    </div>
  );
}
