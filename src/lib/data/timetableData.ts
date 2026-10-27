/**
 * ตารางสอน คุณครูพิชญุตม์ ประภาศิริ
 * โรงเรียนบ้านควนเนียง ภาคเรียนที่ 2 ปีการศึกษา 2569
 * สังกัดสำนักงานเขตพื้นที่การศึกษาประถมศึกษาสุราษฎร์ธานี เขต 3
 */

export interface TimetablePeriod {
  periodNumber: number; // 1 to 7
  timeLabel: string;    // "08.30-09.30"
  startTime: string;    // "08:30"
  endTime: string;      // "09:30"
  isLunch?: boolean;
}

export interface TimetableSlot {
  id: string;
  dayIndex: number;     // 1=จันทร์, 2=อังคาร, 3=พุธ, 4=พฤหัสบดี, 5=ศุกร์
  dayName: string;      // "จันทร์", "อังคาร", ...
  periodNumber: number; // 1 to 7
  timeLabel: string;
  subjectName: string;  // "สังคมศึกษา", "ศิลปะ", "ประวัติศาสตร์", etc.
  subjectCode?: string; // "ส15101", etc.
  subjectId?: string;   // "sub_soc_15101", etc.
  room: string;         // "ป.3", "ป.4", "ป.5", "ป.6", "ป.1", "ป.2", or "ทุกระดับชั้น"
  category: "core_social" | "core_history" | "art" | "development" | "plc" | "empty";
  note?: string;
}

export const TIMETABLE_PERIODS: TimetablePeriod[] = [
  { periodNumber: 1, timeLabel: "08.30-09.30", startTime: "08:30", endTime: "09:30" },
  { periodNumber: 2, timeLabel: "09.30-10.30", startTime: "09:30", endTime: "10:30" },
  { periodNumber: 3, timeLabel: "10.30-11.30", startTime: "10:30", endTime: "11:30" },
  { periodNumber: 4, timeLabel: "12.30-13.30", startTime: "12:30", endTime: "13:30" },
  { periodNumber: 5, timeLabel: "13.30-14.30", startTime: "13:30", endTime: "14:30" },
  { periodNumber: 6, timeLabel: "14.30-15.30", startTime: "14:30", endTime: "15:30" },
  { periodNumber: 7, timeLabel: "15.30-16.30", startTime: "15:30", endTime: "16:30" },
];

export const TIMETABLE_DAYS = [
  { dayIndex: 1, name: "จันทร์", colorName: "yellow", bgClass: "bg-amber-400/10 border-amber-400/30 text-amber-300" },
  { dayIndex: 2, name: "อังคาร", colorName: "pink", bgClass: "bg-pink-400/10 border-pink-400/30 text-pink-300" },
  { dayIndex: 3, name: "พุธ", colorName: "green", bgClass: "bg-emerald-400/10 border-emerald-400/30 text-emerald-300" },
  { dayIndex: 4, name: "พฤหัสบดี", colorName: "orange", bgClass: "bg-orange-400/10 border-orange-400/30 text-orange-300" },
  { dayIndex: 5, name: "ศุกร์", colorName: "blue", bgClass: "bg-sky-400/10 border-sky-400/30 text-sky-300" },
];

export const TIMETABLE_SLOTS: TimetableSlot[] = [
  // ==========================================
  // วันจันทร์ (Monday)
  // ==========================================
  {
    id: "mon-p1",
    dayIndex: 1,
    dayName: "จันทร์",
    periodNumber: 1,
    timeLabel: "08.30-09.30",
    subjectName: "สังคมศึกษา",
    subjectCode: "ส15101",
    subjectId: "sub_soc_15101",
    room: "ป.5",
    category: "core_social"
  },
  {
    id: "mon-p2",
    dayIndex: 1,
    dayName: "จันทร์",
    periodNumber: 2,
    timeLabel: "09.30-10.30",
    subjectName: "ศิลปะ",
    subjectCode: "ศ15101",
    room: "ป.5",
    category: "art"
  },
  {
    id: "mon-p3",
    dayIndex: 1,
    dayName: "จันทร์",
    periodNumber: 3,
    timeLabel: "10.30-11.30",
    subjectName: "ศิลปะ",
    subjectCode: "ศ14101",
    room: "ป.4",
    category: "art"
  },
  {
    id: "mon-p4",
    dayIndex: 1,
    dayName: "จันทร์",
    periodNumber: 4,
    timeLabel: "12.30-13.30",
    subjectName: "(ว่าง)",
    room: "-",
    category: "empty"
  },
  {
    id: "mon-p5",
    dayIndex: 1,
    dayName: "จันทร์",
    periodNumber: 5,
    timeLabel: "13.30-14.30",
    subjectName: "ประวัติศาสตร์",
    subjectCode: "ส13102",
    subjectId: "sub_his_13102",
    room: "ป.3",
    category: "core_history"
  },
  {
    id: "mon-p6",
    dayIndex: 1,
    dayName: "จันทร์",
    periodNumber: 6,
    timeLabel: "14.30-15.30",
    subjectName: "ศิลปะ",
    subjectCode: "ศ13101",
    room: "ป.3",
    category: "art"
  },
  {
    id: "mon-p7",
    dayIndex: 1,
    dayName: "จันทร์",
    periodNumber: 7,
    timeLabel: "15.30-16.30",
    subjectName: "ชั่วโมง PLC",
    room: "คณะครู",
    category: "plc",
    note: "ชุมชนแห่งการเรียนรู้ทางวิชาชีพ"
  },

  // ==========================================
  // วันอังคาร (Tuesday)
  // ==========================================
  {
    id: "tue-p1",
    dayIndex: 2,
    dayName: "อังคาร",
    periodNumber: 1,
    timeLabel: "08.30-09.30",
    subjectName: "สังคมศึกษา",
    subjectCode: "ส15101",
    subjectId: "sub_soc_15101",
    room: "ป.5",
    category: "core_social"
  },
  {
    id: "tue-p2",
    dayIndex: 2,
    dayName: "อังคาร",
    periodNumber: 2,
    timeLabel: "09.30-10.30",
    subjectName: "สังคมศึกษา",
    subjectCode: "ส16101",
    subjectId: "sub_soc_16101",
    room: "ป.6",
    category: "core_social"
  },
  {
    id: "tue-p3",
    dayIndex: 2,
    dayName: "อังคาร",
    periodNumber: 3,
    timeLabel: "10.30-11.30",
    subjectName: "(ว่าง)",
    room: "-",
    category: "empty"
  },
  {
    id: "tue-p4",
    dayIndex: 2,
    dayName: "อังคาร",
    periodNumber: 4,
    timeLabel: "12.30-13.30",
    subjectName: "สังคมศึกษา",
    subjectCode: "ส13101",
    subjectId: "sub_soc_13101",
    room: "ป.3",
    category: "core_social"
  },
  {
    id: "tue-p5",
    dayIndex: 2,
    dayName: "อังคาร",
    periodNumber: 5,
    timeLabel: "13.30-14.30",
    subjectName: "ศิลปะ",
    subjectCode: "ศ16101",
    room: "ป.6",
    category: "art"
  },
  {
    id: "tue-p6",
    dayIndex: 2,
    dayName: "อังคาร",
    periodNumber: 6,
    timeLabel: "14.30-15.30",
    subjectName: "(ว่าง)",
    room: "-",
    category: "empty"
  },
  {
    id: "tue-p7",
    dayIndex: 2,
    dayName: "อังคาร",
    periodNumber: 7,
    timeLabel: "15.30-16.30",
    subjectName: "ชั่วโมง PLC",
    room: "คณะครู",
    category: "plc"
  },

  // ==========================================
  // วันพุธ (Wednesday)
  // ==========================================
  {
    id: "wed-p1",
    dayIndex: 3,
    dayName: "พุธ",
    periodNumber: 1,
    timeLabel: "08.30-09.30",
    subjectName: "(ว่าง)",
    room: "-",
    category: "empty"
  },
  {
    id: "wed-p2",
    dayIndex: 3,
    dayName: "พุธ",
    periodNumber: 2,
    timeLabel: "09.30-10.30",
    subjectName: "สังคมศึกษา",
    subjectCode: "ส16101",
    subjectId: "sub_soc_16101",
    room: "ป.6",
    category: "core_social"
  },
  {
    id: "wed-p3",
    dayIndex: 3,
    dayName: "พุธ",
    periodNumber: 3,
    timeLabel: "10.30-11.30",
    subjectName: "(ว่าง)",
    room: "-",
    category: "empty"
  },
  {
    id: "wed-p4",
    dayIndex: 3,
    dayName: "พุธ",
    periodNumber: 4,
    timeLabel: "12.30-13.30",
    subjectName: "ประวัติศาสตร์",
    subjectCode: "ส14102",
    subjectId: "sub_his_14102",
    room: "ป.4",
    category: "core_history"
  },
  {
    id: "wed-p5",
    dayIndex: 3,
    dayName: "พุธ",
    periodNumber: 5,
    timeLabel: "13.30-14.30",
    subjectName: "แนะแนว",
    room: "ป.5",
    category: "development"
  },
  {
    id: "wed-p6",
    dayIndex: 3,
    dayName: "พุธ",
    periodNumber: 6,
    timeLabel: "14.30-15.30",
    subjectName: "ลูกเสือ",
    room: "ทุกระดับชั้น",
    category: "development"
  },
  {
    id: "wed-p7",
    dayIndex: 3,
    dayName: "พุธ",
    periodNumber: 7,
    timeLabel: "15.30-16.30",
    subjectName: "ชั่วโมง PLC",
    room: "คณะครู",
    category: "plc"
  },

  // ==========================================
  // วันพฤหัสบดี (Thursday)
  // ==========================================
  {
    id: "thu-p1",
    dayIndex: 4,
    dayName: "พฤหัสบดี",
    periodNumber: 1,
    timeLabel: "08.30-09.30",
    subjectName: "สังคมศึกษา",
    subjectCode: "ส14101",
    subjectId: "sub_soc_14101",
    room: "ป.4",
    category: "core_social"
  },
  {
    id: "thu-p2",
    dayIndex: 4,
    dayName: "พฤหัสบดี",
    periodNumber: 2,
    timeLabel: "09.30-10.30",
    subjectName: "ศิลปะ",
    subjectCode: "ศ11101",
    room: "ป.1",
    category: "art"
  },
  {
    id: "thu-p3",
    dayIndex: 4,
    dayName: "พฤหัสบดี",
    periodNumber: 3,
    timeLabel: "10.30-11.30",
    subjectName: "ศิลปะ",
    subjectCode: "ศ12101",
    room: "ป.2",
    category: "art"
  },
  {
    id: "thu-p4",
    dayIndex: 4,
    dayName: "พฤหัสบดี",
    periodNumber: 4,
    timeLabel: "12.30-13.30",
    subjectName: "(ว่าง)",
    room: "-",
    category: "empty"
  },
  {
    id: "thu-p5",
    dayIndex: 4,
    dayName: "พฤหัสบดี",
    periodNumber: 5,
    timeLabel: "13.30-14.30",
    subjectName: "ซ่อมเสริม",
    subjectCode: "ส15901",
    subjectId: "sub_rem_15901",
    room: "ป.5",
    category: "development"
  },
  {
    id: "thu-p6",
    dayIndex: 4,
    dayName: "พฤหัสบดี",
    periodNumber: 6,
    timeLabel: "14.30-15.30",
    subjectName: "ชุมนุม",
    room: "ทุกระดับชั้น",
    category: "development"
  },
  {
    id: "thu-p7",
    dayIndex: 4,
    dayName: "พฤหัสบดี",
    periodNumber: 7,
    timeLabel: "15.30-16.30",
    subjectName: "ชั่วโมง PLC",
    room: "คณะครู",
    category: "plc"
  },

  // ==========================================
  // วันศุกร์ (Friday)
  // ==========================================
  {
    id: "fri-p1",
    dayIndex: 5,
    dayName: "ศุกร์",
    periodNumber: 1,
    timeLabel: "08.30-09.30",
    subjectName: "สังคมศึกษา",
    subjectCode: "ส14101",
    subjectId: "sub_soc_14101",
    room: "ป.4",
    category: "core_social"
  },
  {
    id: "fri-p2",
    dayIndex: 5,
    dayName: "ศุกร์",
    periodNumber: 2,
    timeLabel: "09.30-10.30",
    subjectName: "(ว่าง)",
    room: "-",
    category: "empty"
  },
  {
    id: "fri-p3",
    dayIndex: 5,
    dayName: "ศุกร์",
    periodNumber: 3,
    timeLabel: "10.30-11.30",
    subjectName: "สังคมศึกษา",
    subjectCode: "ส13101",
    subjectId: "sub_soc_13101",
    room: "ป.3",
    category: "core_social"
  },
  {
    id: "fri-p4",
    dayIndex: 5,
    dayName: "ศุกร์",
    periodNumber: 4,
    timeLabel: "12.30-13.30",
    subjectName: "ซ่อมเสริม",
    subjectCode: "ส15901",
    subjectId: "sub_rem_15901",
    room: "ป.5",
    category: "development"
  },
  {
    id: "fri-p5",
    dayIndex: 5,
    dayName: "ศุกร์",
    periodNumber: 5,
    timeLabel: "13.30-14.30",
    subjectName: "แนะแนว",
    room: "ป.4",
    category: "development"
  },
  {
    id: "fri-p6",
    dayIndex: 5,
    dayName: "ศุกร์",
    periodNumber: 6,
    timeLabel: "14.30-15.30",
    subjectName: "อบรมคุณธรรม",
    room: "ทุกระดับชั้น",
    category: "development"
  },
  {
    id: "fri-p7",
    dayIndex: 5,
    dayName: "ศุกร์",
    periodNumber: 7,
    timeLabel: "15.30-16.30",
    subjectName: "ชั่วโมง PLC",
    room: "คณะครู",
    category: "plc"
  }
];

/**
 * ดึง Slot สำหรับวันและคาบที่ระบุ
 */
export function getSlot(dayIndex: number, periodNumber: number): TimetableSlot | undefined {
  return TIMETABLE_SLOTS.find(s => s.dayIndex === dayIndex && s.periodNumber === periodNumber);
}

/**
 * ดึง Slots ทั้งหมดของวันที่ระบุ
 */
export function getSlotsByDay(dayIndex: number): TimetableSlot[] {
  return TIMETABLE_SLOTS.filter(s => s.dayIndex === dayIndex).sort((a, b) => a.periodNumber - b.periodNumber);
}

/**
 * ตรวจสอบคาบเรียนปัจจุบันตามเวลาจริงของเครื่อง (Local Time)
 */
export function getCurrentPeriodSlot(date: Date = new Date()): {
  slot: TimetableSlot | null;
  status: "active" | "before_school" | "after_school" | "lunch" | "weekend";
  currentPeriodNumber: number | null;
} {
  const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  if (day === 0 || day === 6) {
    return { slot: null, status: "weekend", currentPeriodNumber: null };
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const currentTotalMin = hours * 60 + minutes;

  // School Hours: 08:30 (510 min) to 16:30 (990 min)
  if (currentTotalMin < 510) {
    return { slot: null, status: "before_school", currentPeriodNumber: null };
  }
  if (currentTotalMin >= 990) {
    return { slot: null, status: "after_school", currentPeriodNumber: null };
  }

  // Lunch: 11:30 - 12:30 (690 - 750 min)
  if (currentTotalMin >= 690 && currentTotalMin < 750) {
    return { slot: null, status: "lunch", currentPeriodNumber: null };
  }

  const periodRanges = [
    { period: 1, start: 510, end: 570 }, // 08:30 - 09:30
    { period: 2, start: 570, end: 630 }, // 09:30 - 10:30
    { period: 3, start: 630, end: 690 }, // 10:30 - 11:30
    { period: 4, start: 750, end: 810 }, // 12:30 - 13:30
    { period: 5, start: 810, end: 870 }, // 13:30 - 14:30
    { period: 6, start: 870, end: 930 }, // 14:30 - 15:30
    { period: 7, start: 930, end: 990 }, // 15:30 - 16:30
  ];

  const matched = periodRanges.find(p => currentTotalMin >= p.start && currentTotalMin < p.end);
  if (!matched) {
    return { slot: null, status: "after_school", currentPeriodNumber: null };
  }

  const slot = getSlot(day, matched.period) || null;
  return {
    slot,
    status: "active",
    currentPeriodNumber: matched.period
  };
}

/**
 * สรุปชั่วโมงสอนแยกตามกลุ่มสาระ
 */
export function getTimetableSummaryStats() {
  const activeTeaching = TIMETABLE_SLOTS.filter(s => s.category !== "empty" && s.category !== "plc");
  const coreSocial = TIMETABLE_SLOTS.filter(s => s.category === "core_social");
  const coreHistory = TIMETABLE_SLOTS.filter(s => s.category === "core_history");
  const art = TIMETABLE_SLOTS.filter(s => s.category === "art");
  const development = TIMETABLE_SLOTS.filter(s => s.category === "development");
  const plc = TIMETABLE_SLOTS.filter(s => s.category === "plc");

  return {
    totalTeachingHours: activeTeaching.length, // 23
    plcHours: plc.length,                     // 5
    totalWeeklyHours: activeTeaching.length + plc.length, // 28
    coreSocialHours: coreSocial.length,       // 8
    coreHistoryHours: coreHistory.length,     // 2
    artHours: art.length,                     // 6
    developmentHours: development.length,     // 7
  };
}
