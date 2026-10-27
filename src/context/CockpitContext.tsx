"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { 
  getAllSubjects, 
  getAllClassrooms, 
  SubjectDoc, 
  ClassroomDoc, 
  Term1VaultDoc, 
  getTerm1Vault, 
  saveTerm1StudentScore, 
  toggleTerm1VaultLock 
} from "@/lib/firebase/services";

export type CockpitLens = "checkin" | "continuity" | "profile";

interface CockpitContextType {
  // Navigation & Session Selection
  selectedRoom: string;
  setSelectedRoom: (room: string) => void;
  selectedSubjectId: string;
  setSelectedSubjectId: (subjectId: string) => void;
  activeLens: CockpitLens;
  setActiveLens: (lens: CockpitLens) => void;
  activeTerm: number;
  setActiveTerm: (term: number) => void;

  // Metadata Lists
  subjects: SubjectDoc[];
  classrooms: ClassroomDoc[];
  currentSubject: SubjectDoc | null;
  currentClassroom: ClassroomDoc | null;
  relevantClassrooms: ClassroomDoc[];
  isLoadingMetadata: boolean;

  // Term 1 Baseline Vault (50:50 Relay)
  vaultDoc: Term1VaultDoc | null;
  isVaultLoading: boolean;
  updateVaultScore: (studentId: string, studentCode: string, score: number | null, attendedPeriods?: number | null) => Promise<void>;
  updateStudentScore: (studentId: string, studentCode: string, score: number | null, attendedPeriods?: number | null) => Promise<void>;
  toggleLock: () => Promise<void>;
  refreshVault: () => Promise<void>;
}

const CockpitContext = createContext<CockpitContextType | undefined>(undefined);

const STORAGE_ROOM_KEY = "cockpit_selected_room";
const STORAGE_SUB_KEY = "cockpit_selected_subject_id";
const STORAGE_LENS_KEY = "cockpit_active_lens";

export function CockpitProvider({ children }: { children: React.ReactNode }) {
  const [subjects, setSubjects] = useState<SubjectDoc[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomDoc[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  // Read initial from localStorage safely
  const [selectedRoom, setSelectedRoomState] = useState<string>("ป.6");
  const [selectedSubjectId, setSelectedSubjectIdState] = useState<string>("sub_soc_16101");
  const [activeLens, setActiveLensState] = useState<CockpitLens>("checkin");
  const [activeTerm, setActiveTerm] = useState<number>(2); // Default to Term 2 (The Relay)

  // Term 1 Baseline Vault
  const [vaultDoc, setVaultDoc] = useState<Term1VaultDoc | null>(null);
  const [isVaultLoading, setIsVaultLoading] = useState(false);

  // 1. Initial Load of Metadata
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const [subList, roomList] = await Promise.all([
          getAllSubjects(),
          getAllClassrooms()
        ]);
        if (!isMounted) return;

        setSubjects(subList);
        setClassrooms(roomList);

        // Restore saved preference if exists
        const savedRoom = localStorage.getItem(STORAGE_ROOM_KEY);
        const savedSub = localStorage.getItem(STORAGE_SUB_KEY);
        const savedLens = localStorage.getItem(STORAGE_LENS_KEY) as CockpitLens | null;

        if (savedRoom && (roomList.some(r => r.name === savedRoom) || ["ป.3", "ป.4", "ป.5", "ป.6"].includes(savedRoom))) {
          setSelectedRoomState(savedRoom);
        } else if (roomList.length > 0) {
          setSelectedRoomState(roomList.find(r => r.name === "ป.6")?.name || roomList[0].name);
        }

        if (savedSub && subList.some(s => s.id === savedSub)) {
          setSelectedSubjectIdState(savedSub);
        } else if (subList.length > 0) {
          setSelectedSubjectIdState(subList.find(s => s.code === "ส16101")?.id || subList[0].id);
        }

        if (savedLens && ["checkin", "continuity", "profile"].includes(savedLens)) {
          setActiveLensState(savedLens);
        }
      } catch (err) {
        console.error("CockpitContext: Error loading metadata", err);
      } finally {
        if (isMounted) setIsLoadingMetadata(false);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Setters with LocalStorage persistence
  const setSelectedRoom = useCallback((room: string) => {
    setSelectedRoomState(room);
    try {
      localStorage.setItem(STORAGE_ROOM_KEY, room);
    } catch {}
  }, []);

  const setSelectedSubjectId = useCallback((subId: string) => {
    setSelectedSubjectIdState(subId);
    try {
      localStorage.setItem(STORAGE_SUB_KEY, subId);
    } catch {}
  }, []);

  const setActiveLens = useCallback((lens: CockpitLens) => {
    setActiveLensState(lens);
    try {
      localStorage.setItem(STORAGE_LENS_KEY, lens);
    } catch {}
  }, []);

  // Compute Current Active Subject & Classroom
  const currentSubject = useMemo(() => {
    return subjects.find(s => s.id === selectedSubjectId) || subjects[0] || null;
  }, [subjects, selectedSubjectId]);

  const currentClassroom = useMemo(() => {
    return classrooms.find(c => c.name === selectedRoom) || classrooms[0] || null;
  }, [classrooms, selectedRoom]);

  // Filter classrooms relevant to current subject
  const relevantClassrooms = useMemo(() => {
    if (!currentSubject) return classrooms;
    if (currentSubject.assignedRooms && currentSubject.assignedRooms.length > 0) {
      return classrooms.filter(c => currentSubject.assignedRooms.includes(c.name));
    }
    return classrooms.filter(c => c.level === currentSubject.level);
  }, [classrooms, currentSubject]);

  // 2. Fetch Term 1 Baseline Vault whenever (selectedRoom, selectedSubjectId) changes
  const fetchVault = useCallback(async () => {
    if (!selectedRoom || !selectedSubjectId) return;
    setIsVaultLoading(true);
    try {
      const doc = await getTerm1Vault(selectedRoom, selectedSubjectId);
      setVaultDoc(doc);
    } catch (err) {
      console.error("CockpitContext: Error fetching Term 1 Vault", err);
    } finally {
      setIsVaultLoading(false);
    }
  }, [selectedRoom, selectedSubjectId]);

  useEffect(() => {
    fetchVault();
  }, [fetchVault]);

  // Update a single student's score in the vault
  const updateVaultScore = useCallback(async (
    studentId: string, 
    studentCode: string, 
    score: number | null, 
    attendedPeriods?: number | null
  ) => {
    if (!selectedRoom || !selectedSubjectId) return;
    try {
      // Optimistic update
      setVaultDoc(prev => {
        const updatedStudents = { ...(prev?.students || {}) };
        updatedStudents[studentId] = {
          studentId,
          studentCode,
          score,
          maxScore: 50,
          attendedPeriods: attendedPeriods !== undefined ? attendedPeriods : (updatedStudents[studentId]?.attendedPeriods ?? null),
          totalPeriods: updatedStudents[studentId]?.totalPeriods || 40,
          updatedAt: new Date().toISOString()
        };
        return {
          id: `${selectedRoom}_${selectedSubjectId}`,
          classroomId: selectedRoom,
          subjectId: selectedSubjectId,
          isLocked: prev?.isLocked || false,
          maxScore: 50,
          students: updatedStudents
        };
      });

      await saveTerm1StudentScore(
        selectedRoom,
        selectedSubjectId,
        studentId,
        studentCode,
        score,
        attendedPeriods,
        50
      );
    } catch (err) {
      console.error("CockpitContext: Error updating student vault score", err);
      await fetchVault(); // Revert on failure
    }
  }, [selectedRoom, selectedSubjectId, fetchVault]);

  // Toggle Vault Lock
  const toggleLock = useCallback(async () => {
    if (!selectedRoom || !selectedSubjectId) return;
    const nextLocked = !vaultDoc?.isLocked;
    try {
      // Optimistic update
      setVaultDoc(prev => prev ? { ...prev, isLocked: nextLocked } : null);
      await toggleTerm1VaultLock(selectedRoom, selectedSubjectId, nextLocked);
    } catch (err) {
      console.error("CockpitContext: Error toggling vault lock", err);
      await fetchVault();
    }
  }, [selectedRoom, selectedSubjectId, vaultDoc?.isLocked, fetchVault]);

  const value = useMemo(() => ({
    selectedRoom,
    setSelectedRoom,
    selectedSubjectId,
    setSelectedSubjectId,
    activeLens,
    setActiveLens,
    activeTerm,
    setActiveTerm,
    subjects,
    classrooms,
    currentSubject,
    currentClassroom,
    relevantClassrooms,
    isLoadingMetadata,
    vaultDoc,
    isVaultLoading,
    updateVaultScore,
    updateStudentScore: updateVaultScore,
    toggleLock,
    refreshVault: fetchVault
  }), [
    selectedRoom,
    setSelectedRoom,
    selectedSubjectId,
    setSelectedSubjectId,
    activeLens,
    setActiveLens,
    activeTerm,
    setActiveTerm,
    subjects,
    classrooms,
    currentSubject,
    currentClassroom,
    relevantClassrooms,
    isLoadingMetadata,
    vaultDoc,
    isVaultLoading,
    updateVaultScore,
    toggleLock,
    fetchVault
  ]);

  return (
    <CockpitContext.Provider value={value}>
      {children}
    </CockpitContext.Provider>
  );
}

export function useCockpit() {
  const context = useContext(CockpitContext);
  if (!context) {
    throw new Error("useCockpit must be used within a CockpitProvider");
  }
  return context;
}
