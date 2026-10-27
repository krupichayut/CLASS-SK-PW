"use client";

import { useState, useEffect } from "react";
import { FloatingDock } from "@/components/layout/FloatingDock";
import { CommandPalette } from "@/components/navigation/CommandPalette";
import { CircadianAmbience } from "@/components/layout/CircadianAmbience";
import { GlobalCockpitBar } from "@/components/layout/GlobalCockpitBar";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Global Keyboard Shortcut: Ctrl + K / Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#090A0F] text-slate-100 overflow-x-hidden antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Spatial Atmospheric Lighting & Subtle Starfield Noise */}
      <CircadianAmbience />

      {/* Floating Spatial Command Dock */}
      <FloatingDock onOpenCommandPalette={() => setIsCommandOpen(true)} />

      {/* Global Command Palette */}
      <CommandPalette 
        isOpen={isCommandOpen} 
        onClose={() => setIsCommandOpen(false)} 
      />

      {/* Main Command Center Canvas */}
      <main className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-4">
        {/* Global Cockpit Relay Bar (50:50 Continuity & Room/Subject Selector) */}
        <GlobalCockpitBar />
        {children}
      </main>
    </div>
  );
}
