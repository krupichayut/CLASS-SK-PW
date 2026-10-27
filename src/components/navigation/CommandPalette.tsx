"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  CalendarCheck, 
  FileSpreadsheet, 
  Users, 
  BookOpen, 
  Settings, 
  LayoutGrid, 
  Sparkles, 
  X, 
  Command, 
  CalendarDays,
  Clock,
  ShieldAlert,
  ArrowRight,
  School,
  CornerDownLeft,
  GraduationCap
} from "lucide-react";
import { 
  getAllStudents, 
  getAllSubjects, 
  getAllClassrooms,
  StudentRecord,
  SubjectDoc,
  ClassroomDoc
} from "@/lib/firebase/services";

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "navigation" | "classroom" | "subject" | "student" | "action";
  icon: any;
  action: () => void;
  badge?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent?: (student: StudentRecord) => void;
}

export function CommandPalette({ isOpen, onClose, onSelectStudent }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cached data for instant search
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectDoc[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomDoc[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadSearchData = async () => {
      try {
        const [stuList, subList, roomList] = await Promise.all([
          getAllStudents(),
          getAllSubjects(),
          getAllClassrooms()
        ]);
        if (isMounted) {
          setStudents(stuList);
          setSubjects(subList);
          setClassrooms(roomList);
        }
      } catch (err) {
        console.error("Error loading command palette data:", err);
      }
    };

    if (isOpen) {
      loadSearchData();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Build command item list based on query
  const buildCommands = useCallback((): CommandItem[] => {
    const list: CommandItem[] = [];
    const q = query.trim().toLowerCase();

    // 1. Navigation Commands
    const navItems = [
      { id: "nav-dash", title: "ภาพรวมแดชบอร์ด", subtitle: "หน้าหลักสรุปข้อมูลประจำวัน", href: "/", icon: LayoutGrid },
      { id: "nav-att", title: "บันทึกเวลาเรียน (Smart Attendance)", subtitle: "เช็กชื่อรายคาบ & รายวัน", href: "/attendance", icon: CalendarCheck },
      { id: "nav-timetable", title: "ตารางสอน เทอม 2/2569", subtitle: "ตารางสอนรายสัปดาห์ 28 ชั่วโมง และตรวจคาบสอนสด", href: "/timetable", icon: Clock },
      { id: "nav-scores", title: "สมุดคะแนน & ตัดเกรด ปพ.5", subtitle: "บันทึกคะแนนเก็บ กลางภาค ปลายภาค", href: "/scores", icon: FileSpreadsheet },
      { id: "nav-students", title: "ทะเบียนนักเรียน", subtitle: "ข้อมูลนักเรียน 6 ระดับชั้น & นำเข้า Excel", href: "/students", icon: Users },
      { id: "nav-subs", title: "วิชาที่สอน & ห้องเรียน", subtitle: "โครงสร้าง 7 วิชา และห้อง ป.1-ป.6", href: "/subjects", icon: BookOpen },
      { id: "nav-years", title: "ปีการศึกษา & วันเปิด-ปิดภาคเรียน", subtitle: "กำหนดช่วงเวลาเปิด-ปิดเทอม", href: "/academic-years", icon: CalendarDays },
      { id: "nav-settings", title: "การตั้งค่าระบบ & Audit Log", subtitle: "ประวัติการแก้ไขและข้อมูลโรงเรียน", href: "/settings", icon: Settings },
    ];

    navItems.forEach(n => {
      if (!q || n.title.toLowerCase().includes(q) || n.subtitle.toLowerCase().includes(q)) {
        list.push({
          id: n.id,
          title: n.title,
          subtitle: n.subtitle,
          category: "navigation",
          icon: n.icon,
          action: () => {
            router.push(n.href);
            onClose();
          }
        });
      }
    });

    // 2. Classrooms Quick Jumper
    const primaryRooms = ["ป.6", "ป.5", "ป.4", "ป.3", "ป.2", "ป.1"];
    primaryRooms.forEach(roomName => {
      if (!q || roomName.toLowerCase().includes(q) || `ห้อง ${roomName}`.includes(q) || `เช็กชื่อ ${roomName}`.includes(q)) {
        list.push({
          id: `room-jump-${roomName}`,
          title: `เช็กชื่อห้อง ${roomName}`,
          subtitle: `เปิดหน้าระบบบันทึกเวลาเรียนของชั้น ${roomName}`,
          category: "classroom",
          icon: School,
          badge: "ห้องเรียน",
          action: () => {
            router.push(`/attendance?classId=${encodeURIComponent(roomName)}`);
            onClose();
          }
        });
      }
    });

    // 3. Subjects Quick Jumper
    subjects.forEach(sub => {
      const match = !q || 
        sub.name.toLowerCase().includes(q) || 
        sub.code.toLowerCase().includes(q) || 
        sub.level.toLowerCase().includes(q);

      if (match) {
        list.push({
          id: `sub-jump-${sub.id}`,
          title: `${sub.code} ${sub.name}`,
          subtitle: `ชั้น ${sub.level} • ${sub.hours} ชั่วโมง (${sub.credits} นก.)`,
          category: "subject",
          icon: GraduationCap,
          badge: sub.level,
          action: () => {
            router.push(`/scores?subjectId=${encodeURIComponent(sub.id)}&classId=${encodeURIComponent(sub.assignedRooms?.[0] || sub.level)}`);
            onClose();
          }
        });
      }
    });

    // 4. Students Live Search
    if (q.length > 0) {
      students.forEach(stu => {
        const fullName = `${stu.prefix || ""} ${stu.firstName} ${stu.lastName || ""}`.trim();
        const match = fullName.toLowerCase().includes(q) || 
          stu.studentCode.includes(q) || 
          (stu.nickname && stu.nickname.toLowerCase().includes(q));

        if (match) {
          list.push({
            id: `stu-${stu.id}`,
            title: `เลขที่ ${stu.number} ${fullName}`,
            subtitle: `รหัส ${stu.studentCode} • ชั้น ${stu.room || "ป.6"}`,
            category: "student",
            icon: Users,
            badge: stu.room || "ป.6",
            action: () => {
              if (onSelectStudent) {
                onSelectStudent(stu);
              } else {
                router.push(`/attendance?classId=${encodeURIComponent(stu.room || "ป.6")}`);
              }
              onClose();
            }
          });
        }
      });
    }

    return list;
  }, [query, subjects, students, router, onClose, onSelectStudent]);

  const filteredCommands = buildCommands();

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-stone-900/95 dark:bg-[#121417]/95 text-stone-100 rounded-[28px] border border-stone-800 dark:border-white/[0.12] shadow-[0_25px_70px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150 specular-border"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-800 dark:border-white/10 bg-stone-950/40">
          <Search className="w-5 h-5 text-[#D96B43] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="ค้นหาหน้า, ห้องเรียน, รายวิชา หรือพิมพ์ชื่อนักเรียน (เช่น ป.6, สมชาย)..."
            className="w-full bg-transparent text-sm sm:text-base font-semibold text-stone-100 placeholder-stone-500 outline-none"
          />
          {query ? (
            <button 
              onClick={() => setQuery("")}
              className="p-1 rounded-full hover:bg-white/10 text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-800 dark:bg-white/10 text-[11px] font-mono text-stone-400">
              <span>ESC ปิด</span>
            </div>
          )}
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-2.5 space-y-1 divide-y divide-white/5">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-stone-600 opacity-60" />
              <p className="text-sm font-semibold">ไม่พบผลลัพธ์สำหรับ &quot;{query}&quot;</p>
              <p className="text-xs text-stone-500 mt-1">ลองค้นหาด้วยคำอื่น เช่น ป.6, ส16101 หรือชื่อนักเรียน</p>
            </div>
          ) : (
            filteredCommands.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-stone-800 dark:bg-white/[0.08] text-white shadow-md translate-x-0.5 border border-stone-700/80 dark:border-white/10"
                      : "text-stone-300 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-[#D96B43] text-white" : "bg-stone-800 dark:bg-white/10 text-[#C5A059]"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold truncate">{item.title}</span>
                        {item.badge && (
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                            isSelected ? "bg-white/20 text-white" : "bg-white/10 text-[#C5A059]"
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className={`text-[11px] truncate ${
                          isSelected ? "text-indigo-100" : "text-slate-400"
                        }`}>
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pl-2">
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-white/90">
                        <span>เลือก</span>
                        <CornerDownLeft className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">↑</span>
              <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">↓</span>
              <span>เลื่อน</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">↵</span>
              <span>ตกลง</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-teal-400 font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>Classroom OS Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
}
