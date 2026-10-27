"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutGrid, 
  BookOpen, 
  Users, 
  CalendarCheck, 
  Clock,
  FileSpreadsheet, 
  Settings, 
  Sparkles, 
  LogIn, 
  LogOut, 
  CalendarDays,
  Search,
  Activity
} from "lucide-react";
import { CircadianHeaderBadge } from "@/components/layout/CircadianAmbience";

interface FloatingDockProps {
  onOpenCommandPalette?: () => void;
}

const navItems = [
  { href: "/", label: "แดชบอร์ด", icon: LayoutGrid },
  { href: "/attendance", label: "เวลาเรียน", icon: CalendarCheck },
  { href: "/timetable", label: "ตารางสอน", icon: Clock },
  { href: "/subjects", label: "รายวิชา", icon: BookOpen },
  { href: "/students", label: "นักเรียน", icon: Users },
  { href: "/scores", label: "สมุดคะแนน ปพ.5", icon: FileSpreadsheet },
  { href: "/academic-years", label: "ปีการศึกษา", icon: CalendarDays },
  { href: "/settings", label: "ตั้งค่า", icon: Settings },
];

export function FloatingDock({ onOpenCommandPalette }: FloatingDockProps = {}) {
  const pathname = usePathname();
  const { user, logOut } = useAuth();

  return (
    <header className="sticky top-4 z-50 flex justify-center w-full px-4 pointer-events-none mb-6">
      <nav className="pointer-events-auto flex items-center gap-1.5 p-1.5 bg-slate-900/80 backdrop-blur-2xl rounded-full border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.7)] transition-all">
        
        {/* Brand Spatial Emblem */}
        <Link 
          href="/" 
          className="flex items-center gap-2 pl-3 pr-3 py-1 text-slate-100 font-bold text-sm tracking-tight border-r border-white/10 mr-1 hover:opacity-90 transition-opacity"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 text-white flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.5)]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xs tracking-wider uppercase font-mono leading-none text-slate-100">
              Command OS
            </span>
            <span className="text-[9px] font-sans text-cyan-400 font-medium leading-none mt-0.5">
              Classroom Studio
            </span>
          </div>
        </Link>

        {/* Command Palette Trigger Pill */}
        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs font-semibold mr-1 border border-white/5 hover:border-white/10"
            title="ค้นหาหรือพิมพ์คำสั่งด่วน (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline font-mono text-[11px] text-slate-400">Command</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Navigation Items */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_0_16px_rgba(99,102,241,0.4)] border border-indigo-400/30 scale-[1.02]"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-300" : ""}`} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Circadian Pill */}
        <div className="hidden lg:flex items-center ml-1 border-l border-white/10 pl-2">
          <CircadianHeaderBadge />
        </div>

        {/* User / Authentication Pill */}
        <div className="flex items-center ml-1 border-l border-white/10 pl-2">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs font-medium text-slate-300 px-2 py-1 rounded-full bg-white/5 border border-white/5">
                {user.email?.split("@")[0] || "ครูผู้สอน"}
              </span>
              <button
                type="button"
                onClick={logOut}
                className="p-1.5 rounded-full bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors border border-white/5"
                title="ออกจากระบบ"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-xs font-bold shadow-[0_0_14px_rgba(99,102,241,0.4)] hover:brightness-110 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบ</span>
            </Link>
          )}
        </div>

      </nav>
    </header>
  );
}
