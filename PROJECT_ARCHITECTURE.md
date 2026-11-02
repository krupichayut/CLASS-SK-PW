# 🏛️ Classroom OS (CLASS-SK-PW) — Project Architecture & Developer Guide

> **Document Type:** System Architecture & AI Context Specification  
> **Repository:** [https://github.com/krupichayut/CLASS-SK-PW](https://github.com/krupichayut/CLASS-SK-PW)  
> **Production Live URL:** [https://sangkommm.vercel.app](https://sangkommm.vercel.app)  
> **Target Audience:** AI Assistants, Software Engineers, and Handover Developers  

---

## 🤖 1. AI Assistant Directive & Persona Guide
หากคุณคือ AI ที่กำลังอ่านเอกสารชุดนี้เพื่อช่วยพัฒนาหรือปรับปรุงระบบ จงปฏิบัติตามแนวทางต่อไปนี้อย่างเคร่งครัด:
- **UI/UX Aesthetics:** เรียบหรู สะอาดตา ดูพรีเมียม สไตล์ Modern / Apple / Vercel (White-space กว้างขอบมน `rounded-xl` หรือ `rounded-2xl`, โทนสี Light Slate, ห้ามใช้สีสดแปร๋นหรือแอนิเมชันที่ทำให้ตาลาย)
- **Architecture Philosophy:** Component-driven, Modular design, และ Separation of Concerns (แยก UI ออกจาก Data Fetching & Calculation Engine อย่างเด็ดขาด)
- **Type Safety:** ทุกฟังก์ชันและข้อมูลต้องมี Type ใน TypeScript (`src/types/` หรือใน services) ห้ามใช้ `any` โดยไม่จำเป็น
- **Thai Typography & Encoding:** ห้ามทำ Character Slicing บนภาษาไทยแบบ naive (เช่น ตัดวรรณยุกต์/สระ) และการจัดทำเอกสารราชการต้องยึดฟอนต์ `TH SarabunPSK`
- **Zero Blind Execution:** ทำความเข้าใจ Context และผลกระทบต่อ Collection อื่นๆ ก่อนแก้ไข Schema หรือ State

---

## 🚀 2. System Overview & Core Capabilities
**Classroom OS** เป็นระบบสารสนเทศเพื่อการจัดการชั้นเรียน บันทึกเวลาเรียน และรายงานผล ปพ.5 สำหรับครูผู้สอน ออกแบบมาเพื่อทดแทนสมุดจดกระดาษและเอ็กเซลแบบดั้งเดิม

### Core Modules:
1. **Attendance Engine (ระบบเช็กชื่อ):** บันทึกการเข้าเรียนรายคาบ/รายวัน (มา, สาย, ลา, ขาด, กิจกรรม) และคำนวณร้อยละเวลาเรียน 80% อัตโนมัติ พร้อมแจ้งเตือนสถานะ ม.ส.
2. **Scorebook Engine (สมุดคะแนนและตัดเกรด):** บันทึกคะแนนแบบ Spreadsheet รองรับคะแนนเก็บรายหน่วย, สอบกลางภาค, สอบปลายภาค และตัดเกรด 8 ระดับ (0 - 4) พร้อมสรุปสถิติกราฟ
3. **ปพ.5 Excel Generator:** สร้างและดาวน์โหลดไฟล์รายงานผลการเรียน (.xlsx) ตามแบบฟอร์มมาตรฐานของกระทรวงศึกษาธิการ/สพฐ. พร้อมจัดหน้าและใส่สูตรพร้อมพิมพ์
4. **Cockpit Command Center:** สลับดูข้อมูลตามปีการศึกษา ภาคเรียน และห้องเรียนได้อย่างรวดเร็วผ่าน Global Cockpit Context
5. **Authentication & Multi-Tenant Support:** เข้าสู่ระบบอย่างปลอดภัยผ่าน Google OAuth และ Email/Password ด้วย Firebase Auth

---

## 🛠️ 3. Technology Stack & Key Dependencies

| หมวดหมู่ | เทคโนโลยี / ไลบรารี | วัตถุประสงค์การใช้งาน |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router) | สถาปัตยกรรม React Server/Client Components |
| **Language** | TypeScript 5 & React 19 | พัฒนาระบบด้วย Type-checking และ React 19 API |
| **Styling** | Tailwind CSS v4 + tw-animate-css | จัดแต่งสไตล์แบบ Utility-first และ Animation นุ่มนวล |
| **UI Components** | shadcn/ui, @base-ui/react, Lucide React | ชุดคอมโพเนนต์มาตรฐานและไอคอน |
| **Database & Auth** | Google Firebase (Auth + Cloud Firestore) | ระบบ Authentication และฐานข้อมูล NoSQL แบบ Real-time |
| **Form & Validation** | React Hook Form + Zod | จัดการแบบฟอร์มและตรวจสอบความถูกต้องของ Schema |
| **Table & Data Grid** | @tanstack/react-table | จัดการตารางคะแนนและตารางเช็กชื่อประสิทธิภาพสูง |
| **Document Export** | ExcelJS | สร้างไฟล์รายงาน ปพ.5 (.xlsx) กำหนดเส้นตารางและฟอนต์ |
| **Data Visualization**| Recharts | แสดงกราฟการกระจายของเกรด (Grade Distribution Bar Chart) |

---

## 📂 4. Project Directory Structure

```text
classroom-app/
├── public/                       # Static Assets & Icons
├── src/
│   ├── app/                      # Next.js App Router (Routing Tree)
│   │   ├── (dashboard)/          # Dashboard Route Group (ครอบด้วย Sidebar & Header Layout)
│   │   │   ├── layout.tsx        # Dashboard Shell (สลับห้อง, แสดงโปรไฟล์ผู้ใช้)
│   │   │   ├── page.tsx          # แดชบอร์ดสรุปภาพรวมชั้นเรียน
│   │   │   ├── academic-years/   # จัดการปีการศึกษาและภาคเรียน
│   │   │   ├── attendance/       # ระบบเช็กชื่อ บันทึกเวลาเรียนรายคาบ
│   │   │   ├── scores/           # ตารางบันทึกคะแนนและตัดเกรด ปพ.5
│   │   │   ├── students/         # ข้อมูลทะเบียนนักเรียนและประวัติส่วนตัว
│   │   │   ├── subjects/         # รายวิชาและกำหนดสัดส่วนคะแนน
│   │   │   │   └── [id]/         # หน้ารายละเอียดและตัวชี้วัดของวิชานั้นๆ
│   │   │   ├── timetable/        # ตารางสอนประจำสัปดาห์
│   │   │   └── settings/         # ตั้งค่าข้อมูลโรงเรียนและข้อมูลครูผู้สอน
│   │   │
│   │   ├── api/                  # Backend Route Handlers (Next.js API)
│   │   │   ├── check-db/         # ตรวจสอบการเชื่อมต่อฐานข้อมูล
│   │   │   ├── seed-term1/       # สคริปต์เตรียมข้อมูลเริ่มต้นสำหรับเทอม 1
│   │   │   └── verify-continuity/# ตรวจสอบความถูกต้องและสอดคล้องของข้อมูล
│   │   │
│   │   ├── login/                # หน้าเข้าสู่ระบบ (Google Login / Email & Password)
│   │   │   └── page.tsx
│   │   ├── globals.css           # Global Theme & Tailwind Directives
│   │   └── layout.tsx            # Root HTML Layout ครอบ AuthProvider & CockpitProvider
│   │
│   ├── components/               # UI Components
│   │   ├── attendance/           # คอมโพเนนต์เฉพาะระบบเช็กชื่อ (DailyTable, StatusButtons)
│   │   ├── students/             # คอมโพเนนต์จัดการนักเรียน (StudentModal, ImportExcel)
│   │   ├── layout/               # Header, Sidebar, CockpitBar, UserDropdown
│   │   ├── navigation/           # เมนูนำทางแบบ Responsive
│   │   └── ui/                   # Reusable Primitive Components (Button, Dialog, Card, Input)
│   │
│   ├── context/                  # Global State Providers
│   │   ├── AuthContext.tsx       # ตรวจสอบสถานะการล็อกอิน Firebase User
│   │   └── CockpitContext.tsx    # Context ศูนย์ควบคุม: จัดเก็บห้องเรียน, เทอม และวิชาที่กำลังเลือก
│   │
│   ├── lib/                      # Core Logic & Infrastructure Services
│   │   ├── calculations/         # Pure Calculation Engines (มี Unit Tests รับรอง)
│   │   │   ├── engine.ts         # สูตรตัดเกรด 8 ระดับ, คำนวณคะแนนถ่วงน้ำหนัก, Grade Distribution
│   │   │   ├── attendance.ts     # คำนวณร้อยละเวลาเรียน และตรวจสอบเงื่อนไข ม.ส. (ต่ำกว่า 80%)
│   │   │   └── continuity.ts     # ตรวจสอบความต่อเนื่องของข้อมูลคะแนนระหว่างเทอม
│   │   ├── excel/                # ระบบส่งออกเอกสาร
│   │   │   ├── generator.ts      # สร้างไฟล์ ปพ.5 (.xlsx) กำหนดฟอนต์ TH SarabunPSK และกรอบตาราง
│   │   │   └── studentParser.ts  # แปลงไฟล์ Excel รายชื่อนักเรียนเพื่อนำเข้าสู่ระบบ
│   │   ├── firebase/             # Data Layer เชื่อมต่อ Firestore
│   │   │   ├── client.ts         # การตั้งค่า Firebase App, Auth, Firestore Client Instance
│   │   │   └── services.ts       # Service Functions สำหรับ Read/Write Collections ทั้งหมด
│   │   └── speech/               # ระบบคำสั่งเสียง (ฟีเจอร์ช่วยอำนวยความสะดวกในการเช็กชื่อ)
│   │
│   └── types/                    # TypeScript Data Contracts
│       ├── models.ts             # โครงสร้าง School, Student, Classroom, Term, Subject, Score
│       └── curriculum.ts         # โครงสร้างตัวชี้วัด (Indicators), กลุ่มสาระฯ และผลการเรียนรู้
│
├── firestore.rules               # Security Rules สำหรับ Firestore
├── firestore.indexes.json        # Composite Indexes สำหรับการคิวรี
├── .env.example                  # Template สำหรับ Environment Variables
├── package.json                  # Scripts และ Dependencies ทั้งหมด
├── tsconfig.json                 # TypeScript Configuration
└── next.config.ts                # Next.js Runtime Settings
```

---

## 🗄️ 5. Firestore Data Model & Schema

ระบบจัดเก็บข้อมูลใน Cloud Firestore โดยแบ่ง Collections ดังนี้:

### 1. `schools` (ข้อมูลสถานศึกษา)
```typescript
interface School {
  id: string;
  nameTh: string;           // เช่น "โรงเรียนวัดโพธิ์"
  schoolCode?: string;      // รหัสสถานศึกษา 10 หลัก
  affiliation?: string;     // สังกัด (สพป./สพม.)
  directorName?: string;    // ชื่อผู้อำนวยการ
  headOfAcademicName?: string; // ชื่อหัวหน้าฝ่ายวิชาการ
  updatedAt: Date;
}
```

### 2. `classrooms` (ห้องเรียน)
```typescript
interface Classroom {
  id: string;               // เช่น "P5-1"
  name: string;             // "ชั้นประถมศึกษาปีที่ 5/1"
  level: string;            // "ป.5"
  roomNumber: string;       // "1"
  academicYearId: string;   // "2568"
}
```

### 3. `students` (ประวัตินักเรียน)
```typescript
interface StudentRecord {
  id: string;               // Document ID
  studentCode: string;      // รหัสประจำตัวนักเรียน
  number: number;           // เลขที่ในห้องเรียน
  prefix: string;           // "ด.ช." / "ด.ญ." / "นาย" / "นางสาว"
  firstName: string;        // ชื่อ
  lastName: string;         // นามสกุล
  name: string;             // ชื่อ-สกุลรวม
  room: string;             // เช่น "5/1"
  classroomId: string;      // Foreign key ชี้ไปที่ classrooms
  status: "active" | "transferred" | "dropped";
}
```

### 4. `subjects` (รายวิชา)
```typescript
interface SubjectDoc {
  id: string;
  code: string;             // รหัสวิชา เช่น "ศ15101"
  name: string;             // ชื่อวิชา เช่น "ศิลปะ 5"
  type: "basic" | "additional"; // พื้นฐาน หรือ เพิ่มเติม
  learningArea: string;     // กลุ่มสาระการเรียนรู้ (เช่น ศิลปะ)
  level: string;            // "ป.5"
  hours: number;            // ชั่วโมงเรียนต่อปี/ภาคเรียน
  credits?: number;         // หน่วยกิต
}
```

### 5. `attendances` (บันทึกเวลาเรียน)
```typescript
interface AttendanceRecord {
  id: string;               // format: {classroomId}_{subjectId}_{date}_{period}
  classroomId: string;
  subjectId: string;
  date: string;             // YYYY-MM-DD
  period: number;           // คาบที่
  records: {
    studentId: string;
    status: "present" | "late" | "leave" | "absent" | "activity"; // มา | สาย | ลา | ขาด | กิจกรรม
  }[];
  recordedBy: string;       // email ครูผู้บันทึก
  updatedAt: Date;
}
```

### 6. `scores` (บันทึกคะแนน)
```typescript
interface ScoreRecord {
  id: string;               // format: {studentId}_{activityId}
  studentId: string;
  activityId: string;       // รหัสกิจกรรม/ตัวชี้วัด/สอบ
  rawScore: number;         // คะแนนดิบที่ได้
  subjectId: string;
  termId: string;
  updatedAt: Date;
}
```

---

## 🧮 6. Core Business Logic & Algorithms

### 6.1 Grading Engine (`src/lib/calculations/engine.ts`)
- **การแปลงคะแนนถ่วงน้ำหนัก:**
  $$\text{Weighted Score} = \left(\frac{\text{Raw Score}}{\text{Max Score}}\right) \times \text{Weight}$$
- **เกณฑ์การตัดเกรดมาตรฐาน สพฐ. 8 ระดับ:**
  - $80 - 100 \rightarrow \mathbf{4}$
  - $75 - 79 \rightarrow \mathbf{3.5}$
  - $70 - 74 \rightarrow \mathbf{3}$
  - $65 - 69 \rightarrow \mathbf{2.5}$
  - $60 - 64 \rightarrow \mathbf{2}$
  - $55 - 59 \rightarrow \mathbf{1.5}$
  - $50 - 54 \rightarrow \mathbf{1}$
  - $0 - 49 \rightarrow \mathbf{0}$
- **เงื่อนไขพิเศษ:**
  - เวลาเรียนไม่ถึง $80\% \rightarrow \mathbf{ม.ส.}$ (ไม่มีสิทธิ์สอบ)
  - ขาดสอบปลายภาค หรือค้างส่งงานสำคัญ $\rightarrow \mathbf{ร}$ (รอการตัดสิน)

### 6.2 Attendance Engine (`src/lib/calculations/attendance.ts`)
- **สูตรคำนวณร้อยละการเข้าเรียน:**
  $$\% \text{ เวลาเรียน} = \left(\frac{\text{คาบที่เข้าเรียน (มา + สาย + กิจกรรม)}}{\text{จำนวนคาบทั้งหมด}}\right) \times 100$$
- หาก $\% \text{ เวลาเรียน} < 80\%$ ระบบจะตั้ง Flag เตือนสถานะทันที

### 6.3 ปพ.5 Excel Generator (`src/lib/excel/generator.ts`)
- ใช้ไลบรารี `exceljs` ในการขึ้นรูปไฟล์ Excel
- ฟอนต์หลักกำหนดเป็น `TH SarabunPSK`
- จัดรูปแบบหัวเอกสาร: ตราโรงเรียน, ชื่อรายวิชา, รหัสวิชา, ภาคเรียน, ครูผู้สอน
- จัดทำตารางคะแนนย่อย คะแนนกลางภาค คะแนนปลายภาค พร้อมสูตรคำนวณอัตโนมัติในเซลล์

---

## ⚙️ 7. Setup & Deployment Guide (คำแนะนำการติดตั้ง)

### 1. การเตรียมสภาพแวดล้อม (Prerequisites)
- Node.js version 18.18+ หรือ Node.js 20+
- บัญชี Google Firebase
- บัญชี Vercel & GitHub

### 2. การตั้งค่า Local Development
1. โคลนและติดตั้ง:
   ```bash
   git clone https://github.com/krupichayut/CLASS-SK-PW.git
   cd CLASS-SK-PW
   npm install
   ```
2. สร้างไฟล์ `.env.local` ในโฟลเดอร์ราก (Root) และนำค่าจาก Firebase Console มาใส่:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
   NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"
   ```
3. เริ่มรันเซิร์ฟเวอร์ทดสอบ:
   ```bash
   npm run dev
   ```
   เปิดเว็บที่ `http://localhost:3000`

### 3. การนำขึ้น Production (Vercel) & ข้อควรระวังสำคัญ
1. นำโค้ดขึ้น GitHub และเชื่อมต่อไปยัง Vercel
2. ใส่ค่า **Environment Variables** ในหน้าตั้งค่าโปรเจกต์ของ Vercel ให้ตรงกับ `.env.local`
3. ⚠️ **จุดสำคัญยิ่ง (Authorized Domains):**  
   เมื่อ Deploy บน Vercel จะได้โดเมนจริง (เช่น `sangkommm.vercel.app`)  
   **ต้องนำชื่อโดเมนนี้ไปเพิ่มใน Firebase Console เสมอ:**
   > **Firebase Console** ➜ เลือกโปรเจกต์ ➜ **Authentication** ➜ แท็บ **Settings** ➜ เมนู **Authorized domains** ➜ กด **Add domain** แล้วใส่ `sangkommm.vercel.app`
   *(หากไม่ทำขั้นตอนนี้ จะเกิดข้อผิดพลาด `auth/unauthorized-domain` และล็อกอินไม่ได้)*

---

## 🧪 8. Quality Assurance & Testing

- **Calculation Engine Tests:**
  ```bash
  npx tsx src/lib/calculations/engine.test.ts
  ```
- **Excel Generator Tests:**
  ```bash
  npx tsx src/lib/excel/generator.test.ts
  ```
- **Type Checking & Lint:**
  ```bash
  npm run lint
  ```

---
*เอกสารนี้ถูกจัดทำขึ้นเพื่อให้ระบบสามารถส่งต่อ พัฒนา หรือนำไปเทรน/สร้างบริบทให้แก่ AI พัฒนาซอฟต์แวร์ได้อย่างไร้รอยต่อ*
