"use client";

import { useState, useEffect } from "react";
import { Sun, Sparkles, Moon, Activity } from "lucide-react";

export type CircadianPhase = "morning" | "afternoon" | "evening";

interface CircadianState {
  phase: CircadianPhase;
  label: string;
  timeString: string;
  glowColor1: string;
  glowColor2: string;
  glowColor3: string;
  accentColor: string;
}

export function CircadianAmbience() {
  const [circadian, setCircadian] = useState<CircadianState>({
    phase: "afternoon",
    label: "Spatial Daylight Focus",
    timeString: "",
    glowColor1: "rgba(99, 102, 241, 0.12)", // Electric Indigo
    glowColor2: "rgba(6, 182, 212, 0.10)", // Cyber Cyan
    glowColor3: "rgba(168, 85, 247, 0.08)", // Deep Violet
    accentColor: "#6366F1"
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const timeStr = `${hours}:${minutes}`;

      if (hours >= 6 && hours < 12) {
        setCircadian({
          phase: "morning",
          label: "Morning Command Session",
          timeString: timeStr,
          glowColor1: "rgba(99, 102, 241, 0.14)", // Indigo
          glowColor2: "rgba(6, 182, 212, 0.12)", // Cyan
          glowColor3: "rgba(16, 185, 129, 0.08)", // Emerald
          accentColor: "#06B6D4"
        });
      } else if (hours >= 12 && hours < 17) {
        setCircadian({
          phase: "afternoon",
          label: "Afternoon Studio Focus",
          timeString: timeStr,
          glowColor1: "rgba(99, 102, 241, 0.12)", // Indigo
          glowColor2: "rgba(6, 182, 212, 0.10)", // Cyan
          glowColor3: "rgba(168, 85, 247, 0.08)", // Violet
          accentColor: "#6366F1"
        });
      } else {
        setCircadian({
          phase: "evening",
          label: "Night Deep Archive",
          timeString: timeStr,
          glowColor1: "rgba(99, 102, 241, 0.10)", // Indigo
          glowColor2: "rgba(168, 85, 247, 0.10)", // Violet
          glowColor3: "rgba(6, 182, 212, 0.06)", // Cyan
          accentColor: "#A855F7"
        });
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden -z-10 transition-colors duration-1000 ease-in-out"
      aria-hidden="true"
    >
      {/* Soft Spatial Atmospheric Orbs */}
      <div 
        className="absolute -top-48 -left-48 w-[650px] h-[650px] rounded-full blur-[150px] transition-all duration-1000"
        style={{ background: circadian.glowColor1 }}
      />
      <div 
        className="absolute top-1/4 -right-48 w-[600px] h-[600px] rounded-full blur-[160px] transition-all duration-1000"
        style={{ background: circadian.glowColor2 }}
      />
      <div 
        className="absolute -bottom-48 left-1/3 w-[700px] h-[700px] rounded-full blur-[170px] transition-all duration-1000"
        style={{ background: circadian.glowColor3 }}
      />

      {/* Subtle Micro Starfield Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.035] mix-blend-screen"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)`,
          backgroundSize: '28px 28px'
        }}
      />
    </div>
  );
}

export function CircadianHeaderBadge() {
  const [time, setTime] = useState("");
  const [phase, setPhase] = useState<CircadianPhase>("afternoon");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes().toString().padStart(2, "0");
      setTime(`${h}:${m}`);
      if (h >= 6 && h < 12) setPhase("morning");
      else if (h >= 12 && h < 17) setPhase("afternoon");
      else setPhase("evening");
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-white/10 text-[11px] font-mono tracking-wide text-slate-300 backdrop-blur-md shadow-xs">
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
      <span className="font-bold text-slate-100">{time} น.</span>
      <span className="text-slate-600">•</span>
      <span className="font-sans flex items-center gap-1 text-[11px] text-slate-300">
        {phase === "morning" && <Sun className="w-3 h-3 text-cyan-400" />}
        {phase === "afternoon" && <Sparkles className="w-3 h-3 text-indigo-400" />}
        {phase === "evening" && <Moon className="w-3 h-3 text-purple-400" />}
        {phase === "morning" ? "ช่วงเช้า" : phase === "afternoon" ? "ช่วงบ่าย" : "ช่วงค่ำ"}
      </span>
    </div>
  );
}
