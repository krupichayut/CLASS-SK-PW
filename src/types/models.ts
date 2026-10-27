export interface School {
  id: string;
  nameTh: string;
  nameEn?: string;
  schoolCode?: string;
  address?: string;
  affiliation?: string; // สังกัด
  directorName?: string; // ชื่อผู้อำนวยการ
  headOfAcademicName?: string; // ชื่อหัวหน้าวิชาการ
  updatedAt: Date;
}

export interface AcademicYear {
  id: string; // e.g., "2568"
  year: number; // 2568
  isActive: boolean;
  createdAt: Date;
}

export interface Term {
  id: string; // e.g., "2568-1"
  academicYearId: string;
  termNumber: 1 | 2;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  isClosed: boolean; // ปิดภาคเรียน (ห้ามแก้ไขข้อมูลโดยไม่ได้รับอนุญาต)
}

export interface Classroom {
  id: string; // e.g., "P5-1"
  level: string; // "ป.5"
  roomNumber: string; // "1"
  academicYearId: string;
  advisorId?: string; // รหัสครูประจำชั้น
}

export interface Student {
  id: string; // document id
  studentId: string; // รหัสนักเรียน (โรงเรียน)
  nationalId?: string; // เลขประจำตัวประชาชน
  prefix: string; // ด.ช. / ด.ญ. / นาย / นางสาว
  firstName: string;
  lastName: string;
  status: 'active' | 'graduated' | 'transferred' | 'suspended';
  enrollmentDate?: Date;
  transferOutDate?: Date;
  note?: string;
  createdAt: Date;
}

// การนำนักเรียนเข้าห้อง (เพื่อให้ 1 คน อยู่ได้หลายห้องตามปีการศึกษา)
export interface Enrollment {
  id: string;
  studentId: string;
  classroomId: string;
  academicYearId: string;
  studentNumber: number; // เลขที่
}

export interface Subject {
  id: string;
  code: string; // รหัสวิชา เช่น ศ15101
  name: string; // ชื่อวิชา เช่น ศิลปะ 5
  type: 'basic' | 'additional'; // พื้นฐาน / เพิ่มเติม
  learningArea: string; // กลุ่มสาระฯ (เช่น ศิลปะ)
  level: string; // ระดับชั้น
  credits?: number; // หน่วยกิต
  hours: number; // ชั่วโมงเรียน
}

// รายวิชาที่เปิดสอนในเทอมนั้นๆ + ครูผู้สอน
export interface CourseOffering {
  id: string;
  subjectId: string;
  termId: string;
  classroomId: string;
  teacherId: string;
  // การตั้งค่าคะแนนเฉพาะเทอม/วิชา
  scoreSettings: {
    maxTotalScore: number; // 100
    passingScore: number; // 50
    ratioPattern?: string; // "70:30" หรือ "80:20"
  };
}
