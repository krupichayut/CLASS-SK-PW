"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowUpRight, 
  CheckCircle2, 
  ChevronRight, 
  FileSpreadsheet, 
  MoreHorizontal, 
  Sparkles, 
  UserCheck, 
  CalendarCheck, 
  Clock, 
  BookOpen, 
  School,
  Award
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { 
  getAllStudents, 
  getAllSubjects, 
  getAllClassrooms, 
  getScoresBySubject,
  getAttendanceHistory,
  getTerm1Vault,
  StudentRecord,
  ScoreRecord
} from "@/lib/firebase/services";
import { calculateAttendanceSummaries } from "@/lib/calculations/attendance";

export default function BentoDashboard() {
  const { user } = useAuth();
  const teacherName = user ? (user.displayName || user.email?.split("@")[0] || "ครูเบนซ์") : "ครูเบนซ์";

  const [studentCount, setStudentCount] = useState<number>(6);
  const [subjectCount, setSubjectCount] = useState<number>(7);
  const [classroomCount, setClassroomCount] = useState<number>(6);
  const [p6Students, setP6Students] = useState<StudentRecord[]>([]);
  const [scoresMap, setScoresMap] = useState<Record<string, { a1: string; a2: string; mid: string; grade: string; hasScore: boolean }>>({});
  const [attendanceRate, setAttendanceRate] = useState<number>(100);
  const [atRiskAttendanceCount, setAtRiskAttendanceCount] = useState<number>(0);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [stus, subs, rooms, scores, attHistory, vault] = await Promise.all([
          getAllStudents(),
          getAllSubjects(),
          getAllClassrooms(),
          getScoresBySubject("sub_soc_16101"),
          getAttendanceHistory("ป.6", "sub_soc_16101"),
          getTerm1Vault("ป.6", "sub_soc_16101")
        ]);

        const p6 = stus.filter(s => s.room === "ป.6");
        const activeStudents = p6.length > 0 ? p6 : stus;
        setP6Students(activeStudents);
        setStudentCount(stus.length || 6);
        setSubjectCount(subs.length || 7);
        setClassroomCount(rooms.length || 6);

        // Calculate attendance integrating Term 1 Baseline Vault
        const summaries = calculateAttendanceSummaries(
          activeStudents, 
          attHistory || [], 
          80, 
          vault?.students
        );
        const totalAttended = summaries.reduce((acc, s) => acc + s.attendedPeriods, 0);
        const totalPeriods = summaries.reduce((acc, s) => acc + s.totalPeriods, 0);
        const rate = totalPeriods > 0 ? Math.round((totalAttended / totalPeriods) * 100) : 100;
        const atRisk = summaries.filter(s => s.isRisk || s.isMS).length;
        setAttendanceRate(rate);
        setAtRiskAttendanceCount(atRisk);

        // Build score mapping - unrecorded scores display as "-"
        const map: Record<string, { a1: string; a2: string; mid: string; grade: string; hasScore: boolean }> = {};
        activeStudents.forEach(stu => {
          const s1 = scores.find(sc => sc.studentId === stu.id && sc.activityId.includes("a1"))?.rawScore;
          const s2 = scores.find(sc => sc.studentId === stu.id && sc.activityId.includes("a2"))?.rawScore;
          const sMid = scores.find(sc => sc.studentId === stu.id && sc.activityId.includes("mid"))?.rawScore;
          const hasScore = s1 !== undefined || s2 !== undefined || sMid !== undefined;

          if (hasScore) {
            const total = (s1 || 0) + (s2 || 0) + (sMid || 0);
            let grade = "-";
            if (total >= 80) grade = "4";
            else if (total >= 75) grade = "3.5";
            else if (total >= 70) grade = "3";
            else if (total >= 65) grade = "2.5";
            else if (total >= 60) grade = "2";
            else if (total >= 55) grade = "1.5";
            else if (total >= 50) grade = "1";
            else grade = "0";

            map[stu.id] = { 
              a1: s1 !== undefined ? String(s1) : "-", 
              a2: s2 !== undefined ? String(s2) : "-", 
              mid: sMid !== undefined ? String(sMid) : "-", 
              grade, 
              hasScore: true 
            };
          } else {
            map[stu.id] = { a1: "-", a2: "-", mid: "-", grade: "-", hasScore: false };
          }
        });
        setScoresMap(map);
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Welcome Micro-Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/80 border border-white/10 text-cyan-300 text-xs font-semibold mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>ปีการศึกษา 2568 • โรงเรียนบ้านควนเนียง (สพป.สุราษฎร์ธานี เขต 3)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            สวัสดีครับ, คุณครู{teacherName}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            ภาพรวมชั้นเรียนประจำวัน (ระดับประถมศึกษา ป.1 - ป.6) • ซิงก์ Cloud Firestore เรียลไทม์
          </p>
        </div>

        {/* Quick Action Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/timetable"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 font-bold text-sm border border-indigo-500/40 shadow-xs transition-all hover:scale-[1.02]"
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>ตารางสอน 2/2569 (28 ชม.)</span>
          </Link>
          <Link
            href="/subjects"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 text-slate-200 font-semibold text-sm border border-white/10 shadow-xs transition-all hover:scale-[1.02]"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>วิชา & ห้อง ({subjectCount} วิชา / 6 ห้อง)</span>
          </Link>
          <Link
            href="/scores?classId=ป.6&subjectId=sub_soc_16101"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-sm border border-cyan-500/30 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <span>เปิดสมุด ปพ.5 (ส16101 ป.6)</span>
          </Link>
          <Link
            href="/attendance?classId=ป.6&subjectId=sub_soc_16101"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <CalendarCheck className="w-4 h-4 text-white" />
            <span>เช็กชื่อคาบนี้ (ห้อง ป.6)</span>
          </Link>
        </div>
      </div>

      {/* Row 1: The Primary Bento Trio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bento 1: ภาพรวมชั้นเรียน & วงแหวนสถิติ (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col justify-between hover:border-indigo-500/40 transition-all text-slate-100">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">ภาพรวมชั้นเรียน</h2>
                <p className="text-xs text-slate-400">
                  ชั้นประถมศึกษาปีที่ 6 • {p6Students.length > 0 ? p6Students.length : 6} คน (6 ระดับชั้น ป.1-ป.6)
                </p>
              </div>
              <button className="p-1.5 rounded-full hover:bg-white/10 text-slate-400">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Concentric Progress Rings Visual */}
            <div className="relative flex items-center justify-center my-4">
              <svg className="w-48 h-48 -rotate-90" viewBox="0 0 160 160">
                {/* Background tracks */}
                <circle cx="80" cy="80" r="68" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-800" />
                <circle cx="80" cy="80" r="52" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-800" />
                <circle cx="80" cy="80" r="36" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-800" />

                {/* Outer Ring: Attendance (Neon Emerald) */}
                <circle
                  cx="80" cy="80" r="68" fill="none" stroke="#10B981" strokeWidth="10"
                  strokeDasharray="427" strokeDashoffset={427 - Math.round((427 * attendanceRate) / 100)} strokeLinecap="round"
                  className="transition-all duration-1000 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                />
                {/* Middle Ring: Waiting for submissions */}
                <circle
                  cx="80" cy="80" r="52" fill="none" stroke="#334155" strokeWidth="10"
                  strokeDasharray="326" strokeDashoffset="326" strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                {/* Inner Ring: Waiting for scores */}
                <circle
                  cx="80" cy="80" r="36" fill="none" stroke="#1e293b" strokeWidth="10"
                  strokeDasharray="226" strokeDashoffset="226" strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>

              {/* Center Counter */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-white tracking-tight">{attendanceRate}%</span>
                <span className="text-[11px] font-medium text-slate-400">อัตราเข้าเรียน ป.6</span>
              </div>
            </div>

            {/* Metric Legends */}
            <div className="space-y-2 mt-4 px-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                  มาเรียนสม่ำเสมอ
                </span>
                <span className="text-emerald-400 font-bold">{attendanceRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                  ส่งภาระงาน/การบ้าน
                </span>
                <span className="text-slate-500 font-medium">ยังไม่มีการบันทึก (-)</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                  ประเมินผลตัวชี้วัด ปพ.5
                </span>
                <span className="text-slate-500 font-medium">ยังไม่มีการลงคะแนน (-)</span>
              </div>
            </div>
          </div>

          {/* Bottom Stat Micro-Pills */}
          <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-white/10 text-center">
            <div className="p-2 rounded-2xl bg-slate-950/60 border border-white/5">
              <p className="text-[10px] text-slate-400 font-medium">เกรดเฉลี่ย</p>
              <p className="text-sm font-bold text-slate-500 mt-0.5">-</p>
            </div>
            <div className="p-2 rounded-2xl bg-slate-950/60 border border-white/5">
              <p className="text-[10px] text-slate-400 font-medium">ชั่วโมงเรียน</p>
              <p className="text-sm font-bold text-cyan-300 mt-0.5">80 ชม.</p>
            </div>
            <div className="p-2 rounded-2xl bg-slate-950/60 border border-white/5">
              <p className="text-[10px] text-slate-400 font-medium">งานที่ตรวจแล้ว</p>
              <p className="text-sm font-bold text-slate-500 mt-0.5">0 ชิ้น</p>
            </div>
          </div>
        </div>

        {/* Bento 2: บันทึกเวลาเรียน & เรดาร์สมดุล (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col justify-between hover:border-cyan-500/40 transition-all text-slate-100">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">บันทึกเวลาเรียน (Smart Attendance)</h2>
                <p className="text-xs text-slate-400">มิติพฤติกรรมการเข้าชั้นเรียน • ห้อง ป.6 (ส16101)</p>
              </div>
              {atRiskAttendanceCount > 0 ? (
                <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30 flex items-center gap-1 animate-pulse">
                  เสี่ยง ม.ส. {atRiskAttendanceCount} คน
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-xs border border-emerald-500/30">
                  เวลาเรียน {attendanceRate}% • ผ่านเกณฑ์
                </span>
              )}
            </div>

            {/* Radar Visual */}
            <div className="relative flex items-center justify-center my-4 py-2">
              <svg className="w-48 h-48" viewBox="0 0 200 200">
                {/* Radar Grid Pentagons */}
                <polygon points="100,20 176,75 147,165 53,165 24,75" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-800" />
                <polygon points="100,50 148,85 129,145 71,145 52,85" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-800/60" />
                <polygon points="100,75 124,92 115,122 85,122 76,92" fill="none" stroke="currentColor" strokeWidth="1" className="text-slate-800/40" />
                
                {/* Axis lines */}
                <line x1="100" y1="100" x2="100" y2="20" stroke="currentColor" strokeDasharray="3 3" className="text-slate-700" />
                <line x1="100" y1="100" x2="176" y2="75" stroke="currentColor" strokeDasharray="3 3" className="text-slate-700" />
                <line x1="100" y1="100" x2="147" y2="165" stroke="currentColor" strokeDasharray="3 3" className="text-slate-700" />
                <line x1="100" y1="100" x2="53" y2="165" stroke="currentColor" strokeDasharray="3 3" className="text-slate-700" />
                <line x1="100" y1="100" x2="24" y2="75" stroke="currentColor" strokeDasharray="3 3" className="text-slate-700" />

                {/* Radar Value Shape (Cyan & Indigo Neon) */}
                <polygon
                  points="100,26 172,78 143,158 58,158 28,78"
                  fill="rgba(6, 182, 212, 0.2)"
                  stroke="#06B6D4"
                  strokeWidth="2"
                  className="drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                />

                {/* Vertices */}
                <circle cx="100" cy="26" r="3.5" fill="#06B6D4" />
                <circle cx="172" cy="78" r="3.5" fill="#6366F1" />
                <circle cx="143" cy="158" r="3.5" fill="#10B981" />
                <circle cx="58" cy="158" r="3.5" fill="#F59E0B" />
                <circle cx="28" cy="78" r="3.5" fill="#06B6D4" />
              </svg>

              {/* Labels overlay */}
              <span className="absolute top-0 text-[10px] font-mono font-bold text-cyan-300">ตรงเวลา ({attendanceRate}%)</span>
              <span className="absolute right-0 top-1/3 text-[10px] font-mono font-bold text-indigo-300">มีส่วนร่วม (95%)</span>
              <span className="absolute right-4 bottom-2 text-[10px] font-mono font-bold text-emerald-300">ส่งงาน (100%)</span>
              <span className="absolute left-4 bottom-2 text-[10px] font-mono font-bold text-amber-300">กิจกรรม (95%)</span>
              <span className="absolute left-0 top-1/3 text-[10px] font-mono font-bold text-cyan-300">วินัย (98%)</span>
            </div>

            {/* Quick Room Stats */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                เช็กชื่อด่วนใน 1 คลิก
              </span>
              <span className="font-bold text-emerald-400">
                {atRiskAttendanceCount === 0 ? "ทุกคนผ่านเกณฑ์ 80%" : `เสี่ยง ม.ส. ${atRiskAttendanceCount} คน`}
              </span>
            </div>
          </div>

          <Link
            href="/attendance?classId=ป.6&subjectId=sub_soc_16101"
            className="w-full mt-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-white/10"
          >
            <span>เปิดหน้าต่างเช็กชื่อฉบับเต็ม (ห้อง ป.6)</span>
            <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
          </Link>
        </div>

        {/* Bento 3: สมุดคะแนน ปพ.5 มินิสเปรดชีต (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col justify-between hover:border-indigo-500/40 transition-all text-slate-100">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">สมุดคะแนน ปพ.5</h2>
                <p className="text-xs text-slate-400">วิชาสังคมศึกษา 6 (ส16101) • ห้อง ป.6</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono text-[11px] border border-white/10">
                ยังไม่มีการลงคะแนน
              </span>
            </div>

            {/* Mini Interactive Grade Table with Real Students */}
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-slate-950/70 shadow-xs mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-white/10 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">ชื่อนักเรียน (ป.6)</th>
                    <th className="py-2.5 px-2 text-center">ใบงาน</th>
                    <th className="py-2.5 px-2 text-center">กลางภาค</th>
                    <th className="py-2.5 px-3 text-center">เกรด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {p6Students.length > 0 ? (
                    p6Students.slice(0, 6).map((stu) => {
                      const sc = scoresMap[stu.id] || { a1: "-", a2: "-", mid: "-", grade: "-", hasScore: false };
                      return (
                        <tr key={stu.id} className="hover:bg-white/[0.03]">
                          <td className="py-2 px-3 font-medium text-slate-200 truncate max-w-[130px]">
                            {stu.number}. {stu.name}
                          </td>
                          <td className="py-2 px-2 text-center text-slate-400 font-medium">
                            {sc.a1}
                          </td>
                          <td className="py-2 px-2 text-center text-slate-400 font-medium">
                            {sc.mid}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold text-[11px]">
                              {sc.grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-500">
                        กำลังโหลดข้อมูล ป.6...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 mt-3 px-1">
              <span>บันทึกคะแนนแล้ว 0 จาก {p6Students.length || 6} คน</span>
              <span className="font-semibold text-amber-400">ยังไม่มีการลงคะแนน (-)</span>
            </div>
          </div>

          <Link
            href="/scores?classId=ป.6&subjectId=sub_soc_16101"
            className="w-full mt-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.01]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-200" />
            <span>เข้าสู่สมุดคะแนนแบบเต็มจอ (ห้อง ป.6)</span>
          </Link>
        </div>

      </div>

      {/* Row 2: Secondary Bento Pair */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bento 4: กิจกรรมล่าสุด & กำหนดส่ง (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl hover:border-indigo-500/40 transition-all text-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">กิจกรรม & แผนการจัดการเรียนรู้</h2>
              <p className="text-xs text-slate-400">ลำดับการจัดกิจกรรมกลุ่มสาระสังคมศึกษาฯ ชั้น ป.6</p>
            </div>
            <Link href="/subjects" className="text-xs font-semibold text-cyan-400 cursor-pointer hover:underline">
              ดูรายวิชาทั้งหมด (7 วิชา)
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-950/90 border border-white/5 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs">
                  ใบงาน
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">ใบงานที่ 1: พระพุทธศาสนาและหลักธรรมในการดำเนินชีวิต</h4>
                  <p className="text-xs text-slate-400">ตัวชี้วัด ส 1.1 ป.6/1 • แผนการจัดการเรียนรู้ที่ 1</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-semibold text-xs border border-white/5">
                  ยังไม่ลงคะแนน
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-950/90 border border-white/5 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs">
                  ชิ้นงาน
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">ชิ้นงานสืบค้น: แหล่งโบราณคดีและประวัติศาสตร์ท้องถิ่น</h4>
                  <p className="text-xs text-slate-400">ตัวชี้วัด ส 4.1/4.2 • การจัดการเรียนรู้เชิงรุก (Active Learning)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold text-xs">
                  Active Learning
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-950/90 border border-white/5 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  กิจกรรม
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">กิจกรรมซ่อมเสริม: ฝึกทักษะการคิดวิเคราะห์และแก้ปัญหา</h4>
                  <p className="text-xs text-slate-400">ซ่อมเสริม ป.5 (สป15901) • กิจกรรมพัฒนาผู้เรียน</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs">
                  รอดำเนินการ
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Bento 5: ประกาศ & สื่อสารด่วน (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col justify-between hover:border-cyan-500/40 transition-all text-slate-100">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">ประกาศประจำห้อง</h2>
                <p className="text-xs text-slate-400">โรงเรียนบ้านควนเนียง • สพป.สุราษฎร์ธานี เขต 3</p>
              </div>
              <span className="text-[11px] font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                7 รายวิชา
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs mb-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8] animate-pulse" />
                  การบันทึกคะแนน ปพ.5
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ระบบสมุดคะแนนในโปรเจกต์นี้เปิดว่างไว้ ไม่มีการลงคะแนนจำลอง โดยการประเมินผลทางการสามารถดำเนินการผ่าน por-por-5-app
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs mb-1">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  ภาระงานสอนจริง 7 รายวิชา
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  สังคมศึกษา ป.3-ป.6 (4 วิชา), ประวัติศาสตร์ ป.3-ป.4 (2 วิชา), และซ่อมเสริม ป.5 (1 วิชา) ครบถ้วนตามโครงสร้างเวลาเรียน
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                ✓
              </div>
              <span className="text-xs text-slate-400 font-medium">เชื่อมต่อ Cloud Firestore เรียบร้อย</span>
            </div>
            <Link href="/settings" className="text-xs font-semibold text-cyan-400 hover:underline">
              ตั้งค่าโรงเรียน →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
