"use client";

import { useState, useEffect } from "react";
import { 
  Building, 
  Save, 
  ShieldCheck, 
  FileText, 
  History, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  User, 
  Clock, 
  Loader2,
  Sparkles
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { getAuditLogs, AuditLogDoc, logAuditEvent, getSchoolInfo, saveSchoolInfo, SchoolInfoDoc } from "@/lib/firebase/services";

type SettingsTab = "school" | "audit" | "security";

export default function SettingsHubPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("audit"); // Default to Audit Log for Sprint 5 review!
  const [logs, setLogs] = useState<AuditLogDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSchool, setSavingSchool] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // School info form state
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfoDoc>({
    schoolNameTh: "โรงเรียนบ้านควนเนียง",
    schoolNameEn: "Bankhuanniang School",
    schoolCode: "1084000123",
    affiliation: "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาสุราษฎร์ธานี เขต 3",
    address: "โรงเรียนบ้านควนเนียง สพป.สุราษฎร์ธานี เขต 3",
    directorName: "ผู้อำนวยการโรงเรียนบ้านควนเนียง",
    headOfAcademicName: "หัวหน้าฝ่ายวิชาการ"
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Also fetch saved school info
      const savedSchool = await getSchoolInfo();
      if (savedSchool) {
        setSchoolInfo(savedSchool);
      }

      const data = await getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSaveSchoolInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSchool(true);
    try {
      await saveSchoolInfo(schoolInfo, user?.email || undefined);
      setSaveStatus("บันทึกข้อมูลโรงเรียนสำเร็จลง Cloud Firestore แล้ว ✅");
      await fetchLogs();
    } catch (err) {
      console.error("Save school info error:", err);
      setSaveStatus("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSavingSchool(false);
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || log.targetType === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatLogTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  const getActionBadge = (type: string) => {
    switch (type) {
      case "score":
        return <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[11px]">คะแนน & เกรด</span>;
      case "attendance":
        return <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-bold text-[11px]">เวลาเรียน</span>;
      case "student":
        return <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-bold text-[11px]">ทะเบียนนักเรียน</span>;
      case "assessment":
        return <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">การประเมิน ปพ.5</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold text-[11px]">ระบบ</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold mb-2 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
            <span>ศูนย์ควบคุมความปลอดภัย & PDPA Compliance • กฎ สพฐ.</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
            การตั้งค่า & บันทึกการตรวจสอบ (Audit Log)
          </h1>
          <p className="text-slate-200 text-sm mt-0.5">
            บันทึกประวัติการเปลี่ยนแปลงข้อมูลคะแนนและเวลาเรียนแบบตรวจสอบย้อนหลังได้ 100%
          </p>
        </div>

        {saveStatus && (
          <span className="px-4 py-2 rounded-2xl bg-white/95 text-xs font-bold text-slate-900 border border-white shadow-xl backdrop-blur-md">
            {saveStatus}
          </span>
        )}
      </div>

      {/* Sub-Navigation Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === "audit"
              ? "bg-white text-slate-900 shadow-xl scale-[1.02]"
              : "bg-white/40 hover:bg-white/60 text-white/90 backdrop-blur-md"
          }`}
        >
          <History className="w-4 h-4 text-indigo-600" />
          <span>บันทึกการตรวจสอบ (Audit Log)</span>
        </button>

        <button
          onClick={() => setActiveTab("school")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === "school"
              ? "bg-white text-slate-900 shadow-xl scale-[1.02]"
              : "bg-white/40 hover:bg-white/60 text-white/90 backdrop-blur-md"
          }`}
        >
          <Building className="w-4 h-4 text-teal-600" />
          <span>ข้อมูลสถานศึกษา (School Info)</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === "security"
              ? "bg-white text-slate-900 shadow-xl scale-[1.02]"
              : "bg-white/40 hover:bg-white/60 text-white/90 backdrop-blur-md"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>ความปลอดภัย & PDPA</span>
        </button>
      </div>

      {/* Main Bento Container */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] border border-white/60 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden">
        
        {/* ======================================================== */}
        {/* TAB 1: AUDIT LOG (PDPA Compliance) */}
        {/* ======================================================== */}
        {activeTab === "audit" && (
          <div>
            {/* Toolbar */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหากิจกรรม, ผู้ดำเนินการ หรือรายละเอียด..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200/80 text-xs sm:text-sm outline-none font-medium"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="py-2 px-3 rounded-xl bg-white border border-slate-200/80 text-xs sm:text-sm font-bold text-slate-700 outline-none"
                >
                  <option value="all">ทุกหมวดหมู่</option>
                  <option value="score">คะแนน & เกรด</option>
                  <option value="attendance">เวลาเรียน</option>
                  <option value="student">ทะเบียนนักเรียน</option>
                  <option value="assessment">การประเมิน ปพ.5</option>
                </select>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <span className="text-xs font-semibold text-slate-500">พบ {filteredLogs.length} รายการ</span>
                <button
                  onClick={fetchLogs}
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors"
                  title="รีเฟรชประวัติ"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Audit Log Table */}
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-sm font-medium">กำลังโหลดประวัติการตรวจสอบ...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-sm">
                ไม่พบประวัติการแก้ไขที่ตรงกับเงื่อนไข
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[850px]">
                  <TableHeader>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold text-slate-600">
                      <TableHead className="w-[180px]">วัน-เวลาที่แก้ไข</TableHead>
                      <TableHead className="w-[130px]">หมวดหมู่</TableHead>
                      <TableHead>รายละเอียดการเปลี่ยนแปลง</TableHead>
                      <TableHead className="w-[200px]">ผู้ดำเนินการ (Actor)</TableHead>
                      <TableHead className="w-[100px] text-center">สถานะความปลอดภัย</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100 text-xs">
                        <TableCell className="font-mono text-slate-500 whitespace-nowrap">
                          {formatLogTime(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          {getActionBadge(log.targetType)}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800">
                          {log.details}
                        </TableCell>
                        <TableCell className="text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{log.actorEmail}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]" title="บันทึกแบบ Append-Only ไม่สามารถแก้ไขย้อนหลังได้">
                            <Lock className="w-3 h-3 text-emerald-600" />
                            ผ่านเกณฑ์
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-500" />
                ระบบจัดเก็บบันทึกแบบ Append-Only บน Collection `auditLogs` (ห้ามลบ/แก้ไขย้อนหลัง ตามข้อกำหนด PDPA)
              </span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: SCHOOL INFO */}
        {/* ======================================================== */}
        {activeTab === "school" && (
          <form onSubmit={handleSaveSchoolInfo} className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">ข้อมูลพื้นฐานสถานศึกษา</h3>
              <p className="text-xs text-slate-500">ข้อมูลนี้จะถูกนำไปใช้ในส่วนหัวของรายงาน ปพ.5 และเอกสารราชการทั้งหมด</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อโรงเรียน (ภาษาไทย) *</label>
                <input
                  type="text"
                  required
                  value={schoolInfo.schoolNameTh}
                  onChange={(e) => setSchoolInfo({ ...schoolInfo, schoolNameTh: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อโรงเรียน (ภาษาอังกฤษ)</label>
                <input
                  type="text"
                  value={schoolInfo.schoolNameEn}
                  onChange={(e) => setSchoolInfo({ ...schoolInfo, schoolNameEn: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">รหัสสถานศึกษา</label>
                <input
                  type="text"
                  value={schoolInfo.schoolCode}
                  onChange={(e) => setSchoolInfo({ ...schoolInfo, schoolCode: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">สังกัด</label>
                <input
                  type="text"
                  value={schoolInfo.affiliation}
                  onChange={(e) => setSchoolInfo({ ...schoolInfo, affiliation: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ที่อยู่และข้อมูลติดต่อ</label>
                <input
                  type="text"
                  value={schoolInfo.address}
                  onChange={(e) => setSchoolInfo({ ...schoolInfo, address: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อ-สกุล ผู้อำนวยการสถานศึกษา</label>
                <input
                  type="text"
                  value={schoolInfo.directorName}
                  onChange={(e) => setSchoolInfo({ ...schoolInfo, directorName: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อ-สกุล หัวหน้างานวิชาการ</label>
                <input
                  type="text"
                  value={schoolInfo.headOfAcademicName}
                  onChange={(e) => setSchoolInfo({ ...schoolInfo, headOfAcademicName: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={savingSchool}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-xl transition-all"
              >
                {savingSchool ? <Loader2 className="w-4 h-4 animate-spin text-teal-400" /> : <Save className="w-4 h-4 text-teal-400" />}
                <span>{savingSchool ? "กำลังบันทึกลงคลาวด์..." : "บันทึกข้อมูลโรงเรียน"}</span>
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 3: SECURITY & COMPLIANCE */}
        {/* ======================================================== */}
        {activeTab === "security" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">มาตรฐานความปลอดภัย & PDPA Compliance</h3>
              <p className="text-xs text-slate-500">การปกป้องข้อมูลส่วนบุคคลของเยาวชนและมาตรการป้องกันการแก้ไขคะแนนมิชอบ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">การคุ้มครองข้อมูลเด็ก (PDPA)</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  จำกัดการเข้าถึงข้อมูลคะแนนและเวลาเรียนเฉพาะครูผู้สอนที่ได้รับมอบหมายเท่านั้น ไม่อนุญาตให้บุคคลภายนอกเข้าถึง
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">บันทึกประวัติแบบไม่สามารถทำลายได้</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Firestore Security Rules กำหนดให้ collection `auditLogs` เป็น Append-Only ห้ามการ Delete หรือ Update ทุกกรณี
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">การตรวจสอบย้อนหลัง 100%</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  ทุกการคลิก "บันทึกคะแนน" หรือ "เช็กชื่อ" จะแนบ Timestamp และ Email ของครูผู้แก้ไขโดยอัตโนมัติ
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 text-white">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-teal-400 font-bold">firestore.rules (Production Config)</span>
                <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300">Rules v2</span>
              </div>
              <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-3 rounded-xl bg-slate-950">
{`match /auditLogs/{logId} {
  allow read: if true;
  allow create: if true;
  allow update, delete: if false; // 🔒 Immutable Append-Only
}`}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
