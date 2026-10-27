"use client";

import React from "react";
import { StudentRecord, Term1VaultDoc } from "@/lib/firebase/services";
import { AttendanceStatus, StudentAttendanceSummary } from "@/lib/calculations/attendance";
import { DualEpochStudentNode, CockpitLens } from "@/components/students/DualEpochStudentNode";

interface ClassroomSeatingGridProps {
  students: StudentRecord[];
  attendance: { [studentId: string]: AttendanceStatus };
  summaries: StudentAttendanceSummary[];
  activeLens?: CockpitLens;
  vaultDoc?: Term1VaultDoc | null;
  scoresTerm2?: { [studentId: string]: number | null };
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onSelectStudent: (studentSummary: StudentAttendanceSummary) => void;
  onUpdateTerm1Score?: (studentId: string, studentCode: string, score: number | null) => void;
  onShareLineAlert?: (student: StudentRecord) => void;
}

export function ClassroomSeatingGrid({
  students,
  attendance,
  summaries,
  activeLens = "checkin",
  vaultDoc,
  scoresTerm2,
  onStatusChange,
  onSelectStudent,
  onUpdateTerm1Score,
  onShareLineAlert
}: ClassroomSeatingGridProps) {
  return (
    <div className="space-y-6 my-4">
      {/* Front Stage Indicator: Spatial Dark Pill */}
      <div className="w-full max-w-md mx-auto py-2 px-6 rounded-full bg-slate-900/80 backdrop-blur-xl text-slate-100 border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
          <span className="text-[11px] font-mono tracking-widest uppercase text-slate-300">
            FRONT STAGE • หน้ากระดานห้องเรียน
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <span className="font-bold text-slate-200">{students.length} นักเรียน</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 uppercase">{activeLens} MODE</span>
        </div>
      </div>

      {/* Spatial Student Cards Grid (Dual-Epoch Student Nodes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {students.map((student, idx) => {
          const currentStatus: AttendanceStatus = attendance[student.id] || "present";
          const summary = summaries.find(s => s.studentId === student.id);
          const t1Score = vaultDoc?.students?.[student.id]?.score ?? null;
          const t2Score = scoresTerm2?.[student.id] ?? null;

          return (
            <DualEpochStudentNode
              key={student.id}
              index={idx}
              student={student}
              activeLens={activeLens}
              currentStatus={currentStatus}
              attendanceSummary={summary}
              term1Score={t1Score}
              term2Score={t2Score}
              isVaultLocked={vaultDoc?.isLocked ?? false}
              onStatusChange={onStatusChange}
              onUpdateTerm1Score={onUpdateTerm1Score}
              onOpenInspector={() => {
                if (summary) {
                  onSelectStudent(summary);
                }
              }}
              onShareLineAlert={onShareLineAlert}
            />
          );
        })}
      </div>
    </div>
  );
}
