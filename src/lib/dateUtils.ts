export const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

export const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export const THAI_DAYS = [
  "อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"
];

/**
 * Converts a Thai date string (e.g. "16 พ.ค. 2568" or "16 พฤษภาคม 2568") or ISO string to "YYYY-MM-DD".
 */
export function toIsoDate(input: string, fallbackBuddhistYear?: number): string {
  if (!input) return "";
  const trimmed = input.trim();
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle formats like "16 พ.ค. 2568" or "16 พฤษภาคม 2568" or "16/05/2568"
  if (trimmed.includes("/")) {
    const [d, m, y] = trimmed.split("/").map(Number);
    if (d && m && y) {
      const cYear = y > 2400 ? y - 543 : y;
      return `${cYear}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    const day = parseInt(parts[0], 10);
    const monthText = parts[1];
    let monthIdx = THAI_MONTHS_SHORT.findIndex(m => monthText.includes(m));
    if (monthIdx === -1) {
      monthIdx = THAI_MONTHS_FULL.findIndex(m => monthText.includes(m));
    }

    let bYear = parts[2] ? parseInt(parts[2], 10) : (fallbackBuddhistYear || 2568);
    if (!isNaN(day) && monthIdx !== -1 && !isNaN(bYear)) {
      const cYear = bYear > 2400 ? bYear - 543 : bYear;
      return `${cYear}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return "";
}

/**
 * Converts an ISO string "YYYY-MM-DD" to Thai date string "D ด.ด. พ.ศ."
 */
export function toThaiDateString(isoOrStr: string, format: "short" | "full" = "short"): string {
  if (!isoOrStr) return "";
  const iso = toIsoDate(isoOrStr);
  if (!iso) return isoOrStr;

  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return isoOrStr;

  const bYear = y < 2400 ? y + 543 : y;
  const monthName = format === "full" ? THAI_MONTHS_FULL[m - 1] : THAI_MONTHS_SHORT[m - 1];
  return `${d} ${monthName} ${bYear}`;
}

/**
 * Formats ISO string into "วันจันทร์ที่ 16 พ.ค. 2568"
 */
export function formatThaiDateWithDay(isoStr: string): string {
  if (!isoStr) return "";
  const iso = toIsoDate(isoStr);
  if (!iso) return isoStr;

  try {
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const bYear = y < 2400 ? y + 543 : y;
    const dayName = THAI_DAYS[date.getDay()];
    const monthName = THAI_MONTHS_SHORT[m - 1];
    return `วัน${dayName}ที่ ${d} ${monthName} ${bYear}`;
  } catch {
    return isoStr;
  }
}

/**
 * Calculates school days (Mon-Fri) and approximate weeks between two dates.
 */
export function calculateSchoolDays(startStr: string, endStr: string): {
  calendarDays: number;
  schoolDays: number;
  weeks: number;
} {
  const startIso = toIsoDate(startStr);
  const endIso = toIsoDate(endStr);
  if (!startIso || !endIso) return { calendarDays: 0, schoolDays: 0, weeks: 0 };

  const start = new Date(startIso);
  const end = new Date(endIso);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return { calendarDays: 0, schoolDays: 0, weeks: 0 };
  }

  const diffTime = end.getTime() - start.getTime();
  const calendarDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

  let schoolDays = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) {
      schoolDays++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  const weeks = Math.round((calendarDays / 7) * 10) / 10;

  return { calendarDays, schoolDays, weeks };
}

/**
 * Checks whether an ISO date falls within a given start and end date.
 */
export function isDateWithinTerm(dateIso: string, startStr: string, endStr: string): boolean {
  if (!dateIso || !startStr || !endStr) return true;
  const startIso = toIsoDate(startStr);
  const endIso = toIsoDate(endStr);
  if (!startIso || !endIso) return true;
  return dateIso >= startIso && dateIso <= endIso;
}
