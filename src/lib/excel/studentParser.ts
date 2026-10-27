import ExcelJS from "exceljs";
import { StudentRecord } from "@/lib/firebase/services";

/**
 * สร้างและดาวน์โหลดไฟล์ Template Excel สำหรับกรอกรายชื่อนักเรียน
 */
export async function downloadStudentTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("รายชื่อนักเรียน");

  // กำหนดคอลัมน์
  worksheet.columns = [
    { header: "เลขที่", key: "number", width: 10 },
    { header: "รหัสนักเรียน", key: "studentCode", width: 16 },
    { header: "คำนำหน้า", key: "prefix", width: 12 },
    { header: "ชื่อ", key: "firstName", width: 22 },
    { header: "นามสกุล", key: "lastName", width: 24 },
    { header: "ห้องเรียน", key: "room", width: 14 },
    { header: "สถานะ", key: "status", width: 14 },
  ];

  // สไตล์แถวหัวตาราง
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, name: "TH SarabunPSK", size: 14 };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E7FF" }, // Indigo light
  };

  // ข้อมูลตัวอย่าง
  worksheet.addRow({
    number: 1,
    studentCode: "10001",
    prefix: "ด.ช.",
    firstName: "ปัณณวัฒน์",
    lastName: "ชูเมือง",
    room: "ป.6",
    status: "active",
  });
  worksheet.addRow({
    number: 2,
    studentCode: "10002",
    prefix: "ด.ญ.",
    firstName: "นันทกานต์",
    lastName: "สันทวงศ์",
    room: "ป.6",
    status: "active",
  });

  // กำหนดฟอนต์และเส้นขอบทุกช่อง
  worksheet.eachRow((row) => {
    row.font = { name: "TH SarabunPSK", size: 14 };
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "แบบฟอร์มนำเข้ารายชื่อนักเรียน_ClassroomOS.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * อ่านไฟล์ Excel ที่อัปโหลด และแปลงเป็น StudentRecord[]
 */
export async function parseStudentsExcel(file: File, defaultRoom: string = "ป.6"): Promise<StudentRecord[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("ไม่พบแผ่นงาน (Worksheet) ในไฟล์ Excel");
  }

  const students: StudentRecord[] = [];
  const headerMap: { [key: string]: number } = {};

  // ตรวจสอบหัวตารางที่แถว 1
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    const val = cell.value?.toString().trim().toLowerCase() || "";
    if (val.includes("เลขที่") || val === "no" || val === "number") headerMap["number"] = colNumber;
    else if (val.includes("รหัส") || val.includes("code") || val === "id") headerMap["studentCode"] = colNumber;
    else if (val.includes("คำนำหน้า") || val.includes("prefix")) headerMap["prefix"] = colNumber;
    else if (val.includes("ชื่อ") && !val.includes("สกุล")) headerMap["firstName"] = colNumber;
    else if (val.includes("สกุล") || val.includes("lastname")) headerMap["lastName"] = colNumber;
    else if (val.includes("ชื่อ-สกุล") || val.includes("ชื่อ - สกุล") || val === "name") headerMap["fullName"] = colNumber;
    else if (val.includes("ห้อง") || val.includes("room") || val.includes("class")) headerMap["room"] = colNumber;
    else if (val.includes("สถานะ") || val.includes("status")) headerMap["status"] = colNumber;
  });

  // วนลูปอ่านข้อมูลตั้งแต่แถวที่ 2 เป็นต้นไป
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // ข้าม Header

    const getVal = (key: string): string => {
      const col = headerMap[key];
      if (!col) return "";
      const cellVal = row.getCell(col).value;
      if (cellVal === null || cellVal === undefined) return "";
      if (typeof cellVal === "object") {
        if ("text" in cellVal) return (cellVal as any).text.toString().trim();
        if ("result" in cellVal) return (cellVal as any).result?.toString().trim() || "";
        if ("richText" in cellVal && Array.isArray((cellVal as any).richText)) {
          return (cellVal as any).richText.map((rt: any) => rt.text).join("").trim();
        }
      }
      return cellVal.toString().trim();
    };

    let numberVal = parseInt(getVal("number")) || rowNumber - 1;
    let studentCode = getVal("studentCode") || `STD${numberVal.toString().padStart(4, "0")}`;
    let prefix = getVal("prefix") || "";
    let firstName = getVal("firstName");
    let lastName = getVal("lastName");
    let room = getVal("room") || defaultRoom;
    let statusStr = getVal("status").toLowerCase();

    // กรณีมีคอลัมน์ชื่อเต็มคอลัมน์เดียว
    if (!firstName && headerMap["fullName"]) {
      const fullName = getVal("fullName");
      const parts = fullName.split(" ").filter(Boolean);
      if (parts.length > 0) {
        firstName = parts[0];
        lastName = parts.slice(1).join(" ");
      }
    }

    if (!firstName && !studentCode) {
      // แถวว่าง ข้าม
      return;
    }

    const name = `${prefix} ${firstName} ${lastName}`.trim();
    const id = studentCode || `std_${Date.now()}_${rowNumber}`;

    students.push({
      id,
      studentCode,
      number: numberVal,
      prefix,
      firstName: firstName || `นักเรียนคนที่ ${numberVal}`,
      lastName: lastName || "",
      name: name || `นักเรียนคนที่ ${numberVal}`,
      room,
      classroomId: room,
      status: (statusStr === "transferred" || statusStr === "ย้ายออก") ? "transferred" : "active",
    });
  });

  return students;
}
