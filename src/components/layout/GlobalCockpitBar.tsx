"use client";

import React, { useRef, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  BookOpen, 
  School, 
  Sparkles, 
  Lock, 
  Unlock, 
  Mic, 
  Scale, 
  Users, 
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock
} from "lucide-react";
import { useCockpit, CockpitLens } from "@/context/CockpitContext";
import { getCurrentPeriodSlot, TimetableSlot } from "@/lib/data/timetableData";

const STANDARD_ROOMS = ["ป.3", "ป.4", "ป.5", "ป.6"];

const LENS_TABS: { id: CockpitLens; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "checkin", label: "สอนสด & เช็คชื่อ", icon: Mic },
  { id: "continuity", label: "50:50 รอยต่อคะแนน", icon: Scale },
  { id: "profile", label: "ข้อมูลนักเรียน", icon: Users },
];

export function GlobalCockpitBar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    selectedRoom,
    setSelectedRoom,
    selectedSubjectId,
    setSelectedSubjectId,
    activeLens,
    setActiveLens,
    subjects,
    classrooms,
    currentSubject,
    relevantClassrooms,
    vaultDoc,
    toggleLock
  } = useCockpit();

  // Sliding pill position state for 16-tabs-sliding (transitions-dev)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0
  });

  const activeIndex = LENS_TABS.findIndex(t => t.id === activeLens);

  useEffect(() => {
    const currentBtn = tabRefs.current[activeIndex];
    if (currentBtn) {
      setPillStyle({
        left: currentBtn.offsetLeft,
        width: currentBtn.offsetWidth,
        opacity: 1
      });
    }
  }, [activeIndex]);

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => {
      const currentBtn = tabRefs.current[activeIndex];
      if (currentBtn) {
        setPillStyle({
          left: currentBtn.offsetLeft,
          width: currentBtn.offsetWidth,
          opacity: 1
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIndex]);

  const isRelayStudioPage = pathname === "/" || pathname === "/attendance" || pathname === "/scores";

  const handleRoomSelect = (room: string) => {
    setSelectedRoom(room);
    // Auto-align subject if current subject doesn't match this room
    const matchingSubject = subjects.find(s => {
      if (s.assignedRooms && s.assignedRooms.length > 0) return s.assignedRooms.includes(room);
      return s.level === room;
    });
    if (matchingSubject && matchingSubject.id !== selectedSubjectId) {
      setSelectedSubjectId(matchingSubject.id);
    }
  };

  const handleSubjectSelect = (subId: string) => {
    setSelectedSubjectId(subId);
    const sub = subjects.find(s => s.id === subId);
    if (sub) {
      const validRooms = classrooms.filter(c => {
        if (sub.assignedRooms && sub.assignedRooms.length > 0) return sub.assignedRooms.includes(c.name);
        return c.level === sub.level;
      });
      if (validRooms.length > 0 && !validRooms.some(r => r.name === selectedRoom)) {
        setSelectedRoom(validRooms[0].name);
      }
    }
  };

  return (
    <div className="w-full max-w-[1520px] mx-auto mb-6 px-2">
      <div className="rounded-2xl bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-3 sm:p-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        
        {/* Cluster 1: Room Pills & Subject Dropdown */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Brand Relay Emblem */}
          <div className="flex items-center gap-2 pl-1 pr-2.5 py-1 border-r border-white/10 shrink-0">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.5)]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[11px] uppercase tracking-wider font-mono text-slate-100 leading-tight">
                Relay Cockpit
              </span>
              <span className="text-[9px] font-mono text-cyan-400 leading-tight">
                50:50 Dual-Term
              </span>
            </div>
          </div>

          {/* Grade / Room Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-white/10">
            {STANDARD_ROOMS.map((room) => {
              const isSelected = selectedRoom === room;
              return (
                <button
                  key={room}
                  type="button"
                  onClick={() => handleRoomSelect(room)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all relative ${
                    isSelected
                      ? "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)] scale-105"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  <span>{room}</span>
                  {isSelected && (
                    <span className="w-1 h-1 rounded-full bg-cyan-300 absolute bottom-0.5 left-1/2 -translate-x-1/2 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Subject Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-slate-200">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSubjectSelect(e.target.value)}
              className="bg-transparent outline-none cursor-pointer pr-1 text-slate-200 max-w-[190px] sm:max-w-[240px] truncate"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                  {s.code} - {s.name} ({s.level})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cluster 2: Lens Switcher (16-tabs-sliding Motion from transitions-dev) */}
        {isRelayStudioPage && (
          <div className="relative inline-flex items-center p-1 rounded-xl bg-slate-950/90 border border-white/10 self-center xl:self-auto">
            {/* Sliding Pill Indicator */}
            <span
              className="absolute top-1 h-[calc(100%-8px)] rounded-lg bg-gradient-to-r from-indigo-600/90 to-cyan-600/90 shadow-[0_0_16px_rgba(99,102,241,0.4)] border border-cyan-400/30 transition-all duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none"
              style={{
                transform: `translateX(${pillStyle.left}px)`,
                width: `${pillStyle.width}px`,
                opacity: pillStyle.opacity
              }}
              aria-hidden="true"
            />

            {LENS_TABS.map((tab, idx) => {
              const Icon = tab.icon;
              const isSelected = activeLens === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => { tabRefs.current[idx] = el; }}
                  type="button"
                  onClick={() => {
                    setActiveLens(tab.id);
                    if (pathname !== "/attendance" && pathname !== "/") {
                      router.push("/attendance");
                    }
                  }}
                  className={`relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors duration-200 ${
                    isSelected ? "text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Cluster 3: Relay Epoch & Vault Lock Status */}
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {/* Quick Timetable Navigation */}
          <button
            type="button"
            onClick={() => router.push("/timetable")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/10 hover:border-indigo-500/40 text-xs font-mono font-bold text-slate-300 hover:text-white transition-all shadow-xs"
            title="ดูตารางสอน ภาคเรียนที่ 2/2569 (28 ชั่วโมง/สัปดาห์)"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">ตารางสอน 2/2569</span>
          </button>

          {/* Term 2 Runway Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 text-xs font-mono text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-pulse" />
            <span className="font-bold">เทอม 2/2568 (รันเวย์สอนจริง)</span>
          </div>

          {/* Term 1 Vault Lock / Unlock Button */}
          <button
            type="button"
            onClick={toggleLock}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              vaultDoc?.isLocked
                ? "bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300"
                : "bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300"
            }`}
            title={vaultDoc?.isLocked ? "คลิกเพื่อปลดล็อกแก้ไขคะแนนทุนเทอม 1" : "คลิกเพื่อล็อกป้องกันการแก้ไขคะแนนทุนเทอม 1"}
          >
            {vaultDoc?.isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">ล็อกทุนเทอม 1</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">ปลดล็อกแก้ไข</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
