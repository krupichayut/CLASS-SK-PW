// อิงตามหลักสูตรแกนกลางฯ
export interface Indicator {
  id: string;
  subjectId: string; // อ้างอิงวิชาหลัก (ไม่ใช่ CourseOffering เพราะตัวชี้วัดผูกกับวิชา)
  code: string; // เช่น "ศ 1.1 ป.5/1"
  description: string;
  standardId?: string; // มาตรฐาน เช่น "ศ 1.1"
  weight?: number; // น้ำหนักคะแนนที่จัดสรรให้ตัวชี้วัดนี้
  passingCriteria?: number; // เกณฑ์ผ่าน (เช่น ร้อยละ 50)
  createdAt: Date;
}

export interface LearningUnit {
  id: string;
  courseOfferingId: string; // ผูกกับวิชาที่เปิดสอนในเทอมนั้น
  unitNumber: number; // หน่วยที่ 1
  name: string;
  description?: string;
  hours: number;
  totalScore: number; // คะแนนเก็บของหน่วยนี้
  indicatorIds: string[]; // ตัวชี้วัดที่ประเมินในหน่วยนี้
}

export interface AssessmentActivity {
  id: string;
  courseOfferingId: string;
  learningUnitId?: string; // อาจจะไม่มีถ้าเป็นการสอบปลายภาค
  type: 'worksheet' | 'project' | 'participation' | 'midterm' | 'final' | 'other';
  name: string; // เช่น "ใบงานสีน้ำ"
  maxScore: number; // คะแนนเต็มดิบ
  weightScore: number; // น้ำหนักคะแนนจริงที่จะนำไปรวม
  indicatorIds: string[]; // กิจกรรมนี้ประเมินตัวชี้วัดไหนบ้าง
  assignedDate?: Date;
  dueDate?: Date;
  status: 'draft' | 'active' | 'closed';
}

export interface Score {
  id: string;
  studentId: string;
  activityId: string;
  rawScore: number; // คะแนนดิบที่ได้ (ทศนิยมได้)
  status: 'graded' | 'missing' | 'late' | 'excused' | 'pending';
  updatedAt: Date;
  updatedBy: string; // Teacher ID
}
