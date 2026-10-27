"use client";

import React, { useState, useEffect } from "react";

interface DynamicIslandProps {
  statusIcon?: React.ReactNode;
  statusText?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function DynamicIsland({
  statusIcon,
  statusText,
  badge,
  actions,
  children,
  className = ""
}: DynamicIslandProps) {
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-collapse when scrolling down rapidly, reappear when scrolling up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 200 && currentScrollY > lastScrollY + 15) {
        setIsScrolledDown(true);
      } else if (currentScrollY < lastScrollY - 10 || currentScrollY < 100) {
        setIsScrolledDown(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div 
      className={`fixed bottom-6 inset-x-0 mx-auto w-fit z-40 max-w-[95vw] pointer-events-auto transition-all duration-300 transform ${
        isScrolledDown ? "translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      } ${className}`}
    >
      <div className="flex items-center gap-3 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-slate-900/90 backdrop-blur-2xl border border-white/15 text-slate-100 shadow-[0_24px_60px_rgba(0,0,0,0.6)] ring-1 ring-cyan-500/20 hover:border-cyan-500/40 transition-all">
        {/* Custom Children or Standard Slot */}
        {children ? (
          children
        ) : (
          <>
            {/* Status Section */}
            <div className="flex items-center gap-2.5 pr-2.5 border-r border-white/10">
              {statusIcon || (
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-pulse shrink-0" />
              )}
              {statusText && (
                <div className="text-xs font-bold whitespace-nowrap text-slate-200 flex items-center gap-1.5 font-mono">
                  {statusText}
                </div>
              )}
              {badge}
            </div>

            {/* Quick Actions Slot */}
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
