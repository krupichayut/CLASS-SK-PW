"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AttendanceStatus } from "@/lib/calculations/attendance";
import { StudentRecord } from "@/lib/firebase/services";

export interface VoiceActionResult {
  type: "single" | "all" | "unknown";
  student?: StudentRecord;
  studentNumber?: number;
  status?: AttendanceStatus;
  rawText: string;
  message: string;
  timestamp: number;
}

const thaiNumberWordMap: Record<string, number> = {
  "หนึ่ง": 1, "เอ็ด": 1,
  "สอง": 2, "ยี่": 2,
  "สาม": 3,
  "สี่": 4,
  "ห้า": 5,
  "หก": 6,
  "เจ็ด": 7,
  "แปด": 8,
  "เก้า": 9,
  "สิบ": 10,
  "สิบเอ็ด": 11,
  "สิบสอง": 12,
  "สิบสาม": 13,
  "สิบสี่": 14,
  "สิบห้า": 15,
  "สิบหก": 16,
  "สิบเจ็ด": 17,
  "สิบแปด": 18,
  "สิบเก้า": 19,
  "ยี่สิบ": 20,
  "ยี่สิบเอ็ด": 21,
  "ยี่สิบสอง": 22,
  "ยี่สิบสาม": 23,
  "ยี่สิบสี่": 24,
  "ยี่สิบห้า": 25,
  "ยี่สิบหก": 26,
  "ยี่สิบเจ็ด": 27,
  "ยี่สิบแปด": 28,
  "ยี่สิบเก้า": 29,
  "สามสิบ": 30,
  "สามสิบเอ็ด": 31,
  "สามสิบสอง": 32,
  "สามสิบสาม": 33,
  "สามสิบสี่": 34,
  "สามสิบห้า": 35,
  "สามสิบหก": 36,
  "สามสิบเจ็ด": 37,
  "สามสิบแปด": 38,
  "สามสิบเก้า": 39,
  "สี่สิบ": 40
};

// Thai numerals ๑ - ๙
const thaiDigitMap: Record<string, string> = {
  "๐": "0", "๑": "1", "๒": "2", "๓": "3", "๔": "4",
  "๕": "5", "๖": "6", "๗": "7", "๘": "8", "๙": "9"
};

function normalizeDigits(text: string): string {
  let res = text;
  for (const [tDigit, aDigit] of Object.entries(thaiDigitMap)) {
    res = res.replaceAll(tDigit, aDigit);
  }
  return res;
}

export function parseThaiNumberFromSpeech(text: string): number | null {
  const normalized = normalizeDigits(text);

  // 1. Check for Arabic digits like "เลขที่ 5", "เบอร์ 12", "5"
  const digitMatch = normalized.match(/(?:เลขที่|เบอร์|คนที่|ลำดับที่)?\s*(\d+)/);
  if (digitMatch && digitMatch[1]) {
    const num = parseInt(digitMatch[1], 10);
    if (!isNaN(num) && num > 0 && num <= 60) {
      return num;
    }
  }

  // 2. Check for exact Thai words in dictionary
  for (const [word, val] of Object.entries(thaiNumberWordMap).sort((a, b) => b[0].length - a[0].length)) {
    if (normalized.includes(word)) {
      return val;
    }
  }

  return null;
}

export function parseStatusFromSpeech(text: string): AttendanceStatus | null {
  const t = text.trim();

  // Absent
  if (t.includes("ขาด") || t.includes("ไม่มา") || t.includes("ไม่เห็น")) {
    return "absent";
  }
  // Leave
  if (t.includes("ลา") || t.includes("ป่วย") || t.includes("ธุระ")) {
    return "leave";
  }
  // Late
  if (t.includes("สาย") || t.includes("เข้าสาย")) {
    return "late";
  }
  // Activity
  if (t.includes("กิจกรรม") || t.includes("ไปแข่ง") || t.includes("ซ้อม")) {
    return "activity";
  }
  // Present
  if (t.includes("มา") || t.includes("อยู่") || t.includes("ถึง")) {
    return "present";
  }

  return null;
}

interface UseThaiVoiceCheckInProps {
  students: StudentRecord[];
  onUpdateStatus: (studentId: string, status: AttendanceStatus) => void;
  onMarkAllPresent?: () => void;
}

export function useThaiVoiceCheckIn({
  students,
  onUpdateStatus,
  onMarkAllPresent
}: UseThaiVoiceCheckInProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastAction, setLastAction] = useState<VoiceActionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
        const recognizer = new SpeechRecognition();
        recognizer.continuous = true;
        recognizer.interimResults = false;
        recognizer.lang = "th-TH";

        recognizer.onstart = () => {
          setIsListening(true);
          setErrorMessage(null);
        };

        recognizer.onend = () => {
          setIsListening(false);
        };

        recognizer.onerror = (event: any) => {
          console.warn("Speech Recognition Error:", event.error);
          if (event.error === "not-allowed") {
            setErrorMessage("โปรดอนุญาตให้เข้าถึงไมโครโฟนในเบราว์เซอร์");
          } else {
            setErrorMessage(`เกิดข้อผิดพลาด: ${event.error}`);
          }
          setIsListening(false);
        };

        recognizer.onresult = (event: any) => {
          const resultsLength = event.results.length;
          const currentText = event.results[resultsLength - 1][0].transcript.trim();
          setTranscript(currentText);
          handleSpeechResult(currentText);
        };

        recognitionRef.current = recognizer;
      } else {
        setIsSupported(false);
      }
    }
  }, [students]);

  const handleSpeechResult = useCallback((raw: string) => {
    const text = raw.trim();

    // Check Global "All Present" Commands
    if (
      text.includes("มาครบ") ||
      text.includes("มาทุกคน") ||
      text.includes("มาหมด") ||
      text.includes("เช็คมาทั้งหมด")
    ) {
      if (onMarkAllPresent) {
        onMarkAllPresent();
      } else {
        students.forEach((s) => onUpdateStatus(s.id, "present"));
      }
      setLastAction({
        type: "all",
        rawText: text,
        message: "เช็คชื่อนักเรียนทุกคนเป็น 'มาเรียน' สำเร็จ",
        timestamp: Date.now()
      });
      return;
    }

    const detectedStatus = parseStatusFromSpeech(text);
    if (!detectedStatus) {
      setLastAction({
        type: "unknown",
        rawText: text,
        message: `ได้ยิน: "${text}" (ไม่พบคำระบุสถานะ เช่น มา, ขาด, ลา, สาย)`,
        timestamp: Date.now()
      });
      return;
    }

    // Attempt 1: Match by Student Number (1-37)
    const detectedNumber = parseThaiNumberFromSpeech(text);
    let matchedStudent: StudentRecord | undefined;

    if (detectedNumber !== null) {
      matchedStudent = students.find((s) => s.number === detectedNumber);
    }

    // Attempt 2: Match by Student Name (First name or full name match)
    if (!matchedStudent) {
      matchedStudent = students.find((s) => {
        const cleanName = s.name.replace(/^(ด\.ช\.|ด\.ญ\.|นาย|นางสาว)\s*/, "").trim();
        const firstName = s.firstName?.trim() || cleanName.split(" ")[0];
        return text.includes(firstName) || text.includes(cleanName);
      });
    }

    if (matchedStudent) {
      onUpdateStatus(matchedStudent.id, detectedStatus);

      const statusThaiNames: Record<AttendanceStatus, string> = {
        present: "มาเรียน",
        absent: "ขาดเรียน",
        leave: "ลา",
        late: "มาสาย",
        activity: "กิจกรรม"
      };

      setLastAction({
        type: "single",
        student: matchedStudent,
        studentNumber: matchedStudent.number,
        status: detectedStatus,
        rawText: text,
        message: `เลขที่ ${matchedStudent.number} (${matchedStudent.name}) ➔ ${statusThaiNames[detectedStatus]}`,
        timestamp: Date.now()
      });
    } else {
      setLastAction({
        type: "unknown",
        rawText: text,
        message: `ได้ยิน: "${text}" (ไม่พบเลขที่หรือชื่อนักเรียนในห้อง)`,
        timestamp: Date.now()
      });
    }
  }, [students, onUpdateStatus, onMarkAllPresent]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Recognition start error:", err);
      }
    }
  };

  return {
    isSupported,
    isListening,
    transcript,
    lastAction,
    errorMessage,
    toggleListening
  };
}
