import { generateStandardReport } from './generator';
import fs from 'fs';
import path from 'path';

async function runExcelTest() {
  console.log('Testing Excel Generator...');
  const mockData = {
    schoolName: "โรงเรียนทดสอบวิทยา",
    academicYear: "2568",
    term: "1",
    subjectCode: "ศ15101",
    subjectName: "ศิลปะ 5",
    className: "ป.5/1",
    students: [
      { number: 1, studentId: "12345", name: "ด.ช. รักเรียน เพียรศึกษา", totalScore: 85, grade: "4", attendancePercent: 95 },
      { number: 2, studentId: "12346", name: "ด.ญ. ใจดี มีน้ำใจ", totalScore: 78, grade: "3.5", attendancePercent: 100 },
    ]
  };

  try {
    const blob = await generateStandardReport(mockData);
    const buffer = Buffer.from(await blob.arrayBuffer());
    const outputPath = path.join(__dirname, 'test_report.xlsx');
    fs.writeFileSync(outputPath, buffer);
    console.log('✅ Excel generated successfully at:', outputPath);
  } catch (error) {
    console.error('❌ Excel generation failed:', error);
    process.exit(1);
  }
}

runExcelTest();
