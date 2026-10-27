"use client";

import React from "react";

interface OrbitalAttendanceGaugeProps {
  percent: number; // 0 - 100
  size?: number;   // diameter in px
  strokeWidth?: number;
  isMS?: boolean;
  isRisk?: boolean;
  remainingQuota?: number;
  label?: string;
  className?: string;
}

export function OrbitalAttendanceGauge({
  percent,
  size = 120,
  strokeWidth = 8,
  isMS = false,
  isRisk = false,
  remainingQuota,
  label,
  className = ""
}: OrbitalAttendanceGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  // 80% Threshold Position (OBEC Criteria)
  // 80% mark in radians from top (-90 deg)
  const thresholdAngle = (0.8 * 360) - 90;
  const thresholdRad = (thresholdAngle * Math.PI) / 180;
  const cx = size / 2;
  const cy = size / 2;
  const markerRadius = radius;
  const markerX = cx + markerRadius * Math.cos(thresholdRad);
  const markerY = cy + markerRadius * Math.sin(thresholdRad);

  // Spatial Dark Color Selection
  let strokeColor = "#10B981"; // Neon Emerald (Safe > 85%)
  let glowColor = "rgba(16, 185, 129, 0.4)";

  if (isMS) {
    strokeColor = "#F43F5E"; // Neon Rose (Failed < 80%)
    glowColor = "rgba(244, 63, 94, 0.5)";
  } else if (isRisk) {
    strokeColor = "#F59E0B"; // Neon Amber (At Risk 80 - 85%)
    glowColor = "rgba(245, 158, 11, 0.45)";
  }

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 origin-center transition-all duration-700 ease-out"
        >
          {/* Subtle Outer Dial Track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-white/10"
          />

          {/* Active Attendance Arc */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 10px ${glowColor})`
            }}
          />

          {/* Precision 80% OBEC Marker Tick (Subtle Cyan Notch) */}
          <line
            x1={cx + (radius - 5) * Math.cos(thresholdRad)}
            y1={cy + (radius - 5) * Math.sin(thresholdRad)}
            x2={cx + (radius + 5) * Math.cos(thresholdRad)}
            y2={cy + (radius + 5) * Math.sin(thresholdRad)}
            stroke="#06B6D4"
            strokeWidth={2}
            className="opacity-90 drop-shadow-[0_0_6px_#06b6d4]"
          />
        </svg>

        {/* Center Typographic Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="font-mono text-2xl font-black tracking-tight text-white leading-none drop-shadow-sm">
            {clampedPercent}<span className="text-xs font-normal text-slate-400">%</span>
          </span>
          <span 
            className="text-[9px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded-full border border-current shadow-xs"
            style={{
              color: strokeColor,
              backgroundColor: isMS ? "rgba(244, 63, 94, 0.15)" : isRisk ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)"
            }}
          >
            {isMS ? "ม.ส." : isRisk ? "เฝ้าระวัง" : "ปกติ"}
          </span>
        </div>
      </div>

      {/* Auxiliary Label or Remaining Quota */}
      {(label || remainingQuota !== undefined) && (
        <div className="mt-2 text-center">
          {label && (
            <span className="text-[11px] font-semibold text-slate-400 block">
              {label}
            </span>
          )}
          {remainingQuota !== undefined && (
            <span className="text-[10px] font-mono text-slate-300 block">
              โควตาขาดได้อีก: <strong className={remainingQuota <= 1 ? "text-rose-400" : "text-cyan-300"}>{remainingQuota}</strong> คาบ
            </span>
          )}
        </div>
      )}
    </div>
  );
}
