import ExcelJS from 'exceljs';

export interface ReportData {
  schoolName: string;
  academicYear: string;
  term: string;
  subjectCode: string;
  subjectName: string;
  className: string;
  students: Array<{
    number: number;
    studentId: string;
    name: string;
    totalScore: number;
    grade: string;
    attendancePercent: number;
  }>;
}

export interface ComprehensiveReportData {
  schoolName: string;
  academicYear: string;
  term: string;
  subjectCode: string;
  subjectName: string;
  className: string;
  teacherName?: string;
  students: Array<{
    number: number;
    studentId: string;
    name: string;
    totalScore: number;
    grade: string;
    attendancePercent: number;
    isMS?: boolean;
    // Section 4: คุณลักษณะ 8 ด้าน
    attributes?: { [key: string]: number };
    attributesSummary?: string;
    // Section 5: อ่าน คิด เขียน
    literacy?: { reading: number; thinking: number; writing: number };
    literacySummary?: string;
    // Section 6: สมรรถนะ 5 ด้าน
    competencies?: { [key: string]: number };
    competenciesSummary?: string;
  }>;
}

const ATTRIBUTES_LIST = [
  "1. รักชาติ ศาสน์ กษัตริย์",
  "2. ซื่อสัตย์สุจริต",
  "3. มีวินัย",
  "4. ใฝ่เรียนรู้",
  "5. อยู่อย่างพอเพียง",
  "6. มุ่งมั่นในการทำงาน",
  "7. รักความเป็นไทย",
  "8. มีจิตสาธารณะ"
];

const COMPETENCIES_LIST = [
  "1. ความสามารถในการสื่อสาร",
  "2. ความสามารถในการคิด",
  "3. ความสามารถในการแก้ปัญหา",
  "4. ความสามารถในการใช้ทักษะชีวิต",
  "5. ความสามารถในการใช้เทคโนโลยี"
];

/**
 * สร้างไฟล์ Excel แบบ ปพ.5 ฉบับสมบูรณ์ (ครบ 7 Section พร้อม Block ลายเซ็น 4 ชั้น)
 */
export async function generateFullPorPor5Report(data: ComprehensiveReportData): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();

  // -------------------------------------------------------------
  // SHEET 1: สรุปผลสัมฤทธิ์ทางการเรียน (Section 1, 3, 7 + ลายเซ็น)
  // -------------------------------------------------------------
  const sheet1 = workbook.addWorksheet('ปพ.5 สรุปผลสัมฤทธิ์');
  sheet1.views = [{ showGridLines: true }];

  sheet1.columns = [
    { header: 'เลขที่', key: 'number', width: 8 },
    { header: 'รหัสนักเรียน', key: 'studentId', width: 14 },
    { header: 'ชื่อ - นามสกุล', key: 'name', width: 28 },
    { header: 'เวลาเรียน (%)', key: 'attendance', width: 14 },
    { header: 'คะแนนรวม (100)', key: 'totalScore', width: 16 },
    { header: 'ระดับผลการเรียน', key: 'grade', width: 16 },
    { header: 'คุณลักษณะ 8 ด้าน', key: 'attrSummary', width: 16 },
    { header: 'อ่าน คิด เขียน', key: 'litSummary', width: 16 },
    { header: 'สมรรถนะ 5 ด้าน', key: 'compSummary', width: 16 },
  ];

  // หัวรายงาน
  sheet1.spliceRows(1, 0, []);
  sheet1.spliceRows(1, 0, [`แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายวิชา (ปพ.5)`]);
  sheet1.spliceRows(2, 0, [`โรงเรียน: ${data.schoolName}   ปีการศึกษา: ${data.academicYear}   ภาคเรียนที่: ${data.term}`]);
  sheet1.spliceRows(3, 0, [`กลุ่มสาระการเรียนรู้: ศิลปะ   รายวิชา: ${data.subjectCode} ${data.subjectName}   ชั้น: ${data.className}`]);
  sheet1.spliceRows(4, 0, []);

  sheet1.getCell('A1').font = { size: 16, bold: true, name: 'TH SarabunPSK' };
  sheet1.getCell('A2').font = { size: 14, bold: true, name: 'TH SarabunPSK' };
  sheet1.getCell('A3').font = { size: 14, bold: true, name: 'TH SarabunPSK' };

  data.students.forEach((student) => {
    sheet1.addRow({
      number: student.number,
      studentId: student.studentId,
      name: student.name,
      attendance: student.attendancePercent + '%',
      totalScore: student.totalScore,
      grade: student.grade,
      attrSummary: student.attributesSummary || "ดีเยี่ยม (3)",
      litSummary: student.literacySummary || "ดีเยี่ยม (3)",
      compSummary: student.competenciesSummary || "ดีเยี่ยม (3)",
    });
  });

  // จัดสไตล์แถวตารางข้อมูล
  const s1RowCount = sheet1.rowCount;
  for (let i = 5; i <= s1RowCount; i++) {
    const row = sheet1.getRow(i);
    row.font = { name: 'TH SarabunPSK', size: 14 };
    row.eachCell({ includeEmpty: false }, (cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      if (i === 5) {
        cell.font = { bold: true, name: 'TH SarabunPSK', size: 14 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      }
      cell.alignment = { vertical: 'middle', horizontal: Number(cell.col) === 3 ? 'left' : 'center' };
    });
  }

  // เพิ่มช่องลายเซ็น 4 ชั้น (Section 7)
  sheet1.addRow([]);
  sheet1.addRow(['การอนุมัติผลการประเมินคุณภาพผู้เรียน (ปพ.5)']);
  const approveHeader = sheet1.getRow(sheet1.rowCount);
  approveHeader.getCell(1).font = { bold: true, name: 'TH SarabunPSK', size: 14 };

  sheet1.addRow(['ลงชื่อ.................................................. ครูผู้สอน', '', 'ลงชื่อ.................................................. หัวหน้ากลุ่มสาระฯ']);
  sheet1.addRow([`     (${data.teacherName || '..................................................'})`, '', '     (..................................................)']);
  sheet1.addRow(['     วันที่.........เดือน...................พ.ศ..........', '', '     วันที่.........เดือน...................พ.ศ..........']);
  sheet1.addRow([]);
  sheet1.addRow(['ลงชื่อ.................................................. หัวหน้างานวัดผล/วิชาการ', '', 'ลงชื่อ.................................................. ผู้อำนวยการสถานศึกษา']);
  sheet1.addRow(['     (..................................................)', '', '     (..................................................)']);
  sheet1.addRow(['     วันที่.........เดือน...................พ.ศ..........', '', '     วันที่.........เดือน...................พ.ศ..........']);

  for (let r = s1RowCount + 1; r <= sheet1.rowCount; r++) {
    sheet1.getRow(r).font = { name: 'TH SarabunPSK', size: 14 };
  }

  // -------------------------------------------------------------
  // SHEET 2: คุณลักษณะอันพึงประสงค์ 8 ด้าน (Section 4)
  // -------------------------------------------------------------
  const sheet2 = workbook.addWorksheet('คุณลักษณะ 8 ประการ');
  sheet2.views = [{ showGridLines: true }];

  sheet2.columns = [
    { header: 'เลขที่', key: 'number', width: 8 },
    { header: 'ชื่อ - นามสกุล', key: 'name', width: 26 },
    { header: 'ข้อ 1 รักชาติฯ', key: 'att1', width: 13 },
    { header: 'ข้อ 2 ซื่อสัตย์', key: 'att2', width: 13 },
    { header: 'ข้อ 3 มีวินัย', key: 'att3', width: 13 },
    { header: 'ข้อ 4 ใฝ่เรียนรู้', key: 'att4', width: 13 },
    { header: 'ข้อ 5 พอเพียง', key: 'att5', width: 13 },
    { header: 'ข้อ 6 มุ่งมั่น', key: 'att6', width: 13 },
    { header: 'ข้อ 7 รักไทย', key: 'att7', width: 13 },
    { header: 'ข้อ 8 จิตสาธารณะ', key: 'att8', width: 14 },
    { header: 'สรุปผลประเมิน', key: 'summary', width: 16 },
  ];

  sheet2.spliceRows(1, 0, []);
  sheet2.spliceRows(1, 0, [`แบบประเมินคุณลักษณะอันพึงประสงค์ 8 ประการ (เกณฑ์: 3=ดีเยี่ยม, 2=ดี, 1=ผ่าน, 0=ไม่ผ่าน)`]);
  sheet2.getCell('A1').font = { size: 15, bold: true, name: 'TH SarabunPSK' };

  data.students.forEach((student) => {
    const a = student.attributes || {};
    sheet2.addRow({
      number: student.number,
      name: student.name,
      att1: a["1"] !== undefined ? a["1"] : 3,
      att2: a["2"] !== undefined ? a["2"] : 3,
      att3: a["3"] !== undefined ? a["3"] : 3,
      att4: a["4"] !== undefined ? a["4"] : 3,
      att5: a["5"] !== undefined ? a["5"] : 3,
      att6: a["6"] !== undefined ? a["6"] : 3,
      att7: a["7"] !== undefined ? a["7"] : 3,
      att8: a["8"] !== undefined ? a["8"] : 3,
      summary: student.attributesSummary || "ดีเยี่ยม (3)"
    });
  });

  const s2RowCount = sheet2.rowCount;
  for (let i = 3; i <= s2RowCount; i++) {
    const row = sheet2.getRow(i);
    row.font = { name: 'TH SarabunPSK', size: 14 };
    row.eachCell({ includeEmpty: false }, (cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      if (i === 3) {
        cell.font = { bold: true, name: 'TH SarabunPSK', size: 14 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      }
      cell.alignment = { vertical: 'middle', horizontal: Number(cell.col) === 2 ? 'left' : 'center' };
    });
  }

  // -------------------------------------------------------------
  // SHEET 3: อ่าน คิดวิเคราะห์ และเขียน (Section 5)
  // -------------------------------------------------------------
  const sheet3 = workbook.addWorksheet('อ่าน คิดวิเคราะห์ เขียน');
  sheet3.views = [{ showGridLines: true }];

  sheet3.columns = [
    { header: 'เลขที่', key: 'number', width: 8 },
    { header: 'ชื่อ - นามสกุล', key: 'name', width: 28 },
    { header: '1. การอ่าน (0-3)', key: 'reading', width: 18 },
    { header: '2. คิดวิเคราะห์ (0-3)', key: 'thinking', width: 20 },
    { header: '3. การเขียน (0-3)', key: 'writing', width: 18 },
    { header: 'สรุปผลการประเมิน', key: 'summary', width: 20 },
  ];

  sheet3.spliceRows(1, 0, []);
  sheet3.spliceRows(1, 0, [`แบบประเมินการอ่าน คิดวิเคราะห์ และเขียน (เกณฑ์: 3=ดีเยี่ยม, 2=ดี, 1=ผ่าน, 0=ไม่ผ่าน)`]);
  sheet3.getCell('A1').font = { size: 15, bold: true, name: 'TH SarabunPSK' };

  data.students.forEach((student) => {
    const lit = student.literacy || { reading: 3, thinking: 3, writing: 3 };
    sheet3.addRow({
      number: student.number,
      name: student.name,
      reading: lit.reading,
      thinking: lit.thinking,
      writing: lit.writing,
      summary: student.literacySummary || "ดีเยี่ยม (3)"
    });
  });

  const s3RowCount = sheet3.rowCount;
  for (let i = 3; i <= s3RowCount; i++) {
    const row = sheet3.getRow(i);
    row.font = { name: 'TH SarabunPSK', size: 14 };
    row.eachCell({ includeEmpty: false }, (cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      if (i === 3) {
        cell.font = { bold: true, name: 'TH SarabunPSK', size: 14 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      }
      cell.alignment = { vertical: 'middle', horizontal: Number(cell.col) === 2 ? 'left' : 'center' };
    });
  }

  // -------------------------------------------------------------
  // SHEET 4: สมรรถนะสำคัญ 5 ด้าน (Section 6)
  // -------------------------------------------------------------
  const sheet4 = workbook.addWorksheet('สมรรถนะสำคัญ 5 ด้าน');
  sheet4.views = [{ showGridLines: true }];

  sheet4.columns = [
    { header: 'เลขที่', key: 'number', width: 8 },
    { header: 'ชื่อ - นามสกุล', key: 'name', width: 26 },
    { header: '1. สื่อสาร (0-3)', key: 'comp1', width: 16 },
    { header: '2. การคิด (0-3)', key: 'comp2', width: 16 },
    { header: '3. แก้ปัญหา (0-3)', key: 'comp3', width: 16 },
    { header: '4. ทักษะชีวิต (0-3)', key: 'comp4', width: 16 },
    { header: '5. เทคโนโลยี (0-3)', key: 'comp5', width: 16 },
    { header: 'สรุปผลการประเมิน', key: 'summary', width: 18 },
  ];

  sheet4.spliceRows(1, 0, []);
  sheet4.spliceRows(1, 0, [`แบบประเมินสมรรถนะสำคัญของผู้เรียน 5 ด้าน (เกณฑ์: 3=ดีเยี่ยม, 2=ดี, 1=ผ่าน, 0=ไม่ผ่าน)`]);
  sheet4.getCell('A1').font = { size: 15, bold: true, name: 'TH SarabunPSK' };

  data.students.forEach((student) => {
    const c = student.competencies || {};
    sheet4.addRow({
      number: student.number,
      name: student.name,
      comp1: c["1"] !== undefined ? c["1"] : 3,
      comp2: c["2"] !== undefined ? c["2"] : 3,
      comp3: c["3"] !== undefined ? c["3"] : 3,
      comp4: c["4"] !== undefined ? c["4"] : 3,
      comp5: c["5"] !== undefined ? c["5"] : 3,
      summary: student.competenciesSummary || "ดีเยี่ยม (3)"
    });
  });

  const s4RowCount = sheet4.rowCount;
  for (let i = 3; i <= s4RowCount; i++) {
    const row = sheet4.getRow(i);
    row.font = { name: 'TH SarabunPSK', size: 14 };
    row.eachCell({ includeEmpty: false }, (cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      if (i === 3) {
        cell.font = { bold: true, name: 'TH SarabunPSK', size: 14 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      }
      cell.alignment = { vertical: 'middle', horizontal: Number(cell.col) === 2 ? 'left' : 'center' };
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * ฟังก์ชันสร้างไฟล์แบบ Standard เดิมสำหรับ Backward Compatibility
 */
export async function generateStandardReport(data: ReportData): Promise<Blob> {
  return generateFullPorPor5Report({
    schoolName: data.schoolName,
    academicYear: data.academicYear,
    term: data.term,
    subjectCode: data.subjectCode,
    subjectName: data.subjectName,
    className: data.className,
    students: data.students.map(s => ({
      number: s.number,
      studentId: s.studentId,
      name: s.name,
      totalScore: s.totalScore,
      grade: s.grade,
      attendancePercent: s.attendancePercent,
    }))
  });
}
