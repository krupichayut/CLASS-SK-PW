# Classroom Management & ปพ.5 System

ระบบสารสนเทศเพื่อการจัดการชั้นเรียนและรายงานผล ปพ.5 สำหรับครูผู้สอน ออกแบบตามมาตรฐาน Modern UI/UX (Apple/Vercel Aesthetic) เน้นความสะอาดตา ลดภาระงานเอกสาร และประมวลผลคะแนนอัตโนมัติ

## 🚀 ฟีเจอร์หลัก (Features)
- **ระบบสมุดบันทึกคะแนน (Scorebook Engine)**: กรอกคะแนนแบบ Spreadsheet, คำนวณเกรดอัตโนมัติ 8 ระดับ
- **ระบบบันทึกเวลาเรียน (Attendance)**: เช็กชื่อรายวัน/รายคาบ
- **การจัดการหลักสูตร**: รองรับโครงสร้างตัวชี้วัด (Indicators) ตามมาตรฐานหลักสูตร
- **ระบบสร้างรายงาน ปพ.5 (Excel Generator)**: ส่งออกข้อมูลคะแนนเป็นไฟล์ Excel (.xlsx) แบบมีเส้นตารางและฟอนต์ TH SarabunPSK
- **ดีไซน์ Enterprise Grade**: รองรับ Responsive, สีโทนสว่าง (Light Slate), ถนอมสายตา

## 🛠️ Technology Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4, shadcn/ui
- **Backend/Database**: Firebase (Auth, Firestore)
- **Utilities**: Zod, React Hook Form, ExcelJS

## 💻 การติดตั้งและเรียกใช้งาน (Local Development)

1. **ติดตั้ง Dependencies**
   ```bash
   npm install
   ```

2. **ตั้งค่าฐานข้อมูล (Firebase)**
   - คัดลอกไฟล์ `.env.example` เป็น `.env.local`
   - นำค่า Config จาก Firebase Console (Project Settings) มาใส่ให้ครบถ้วน
   - หากยังไม่มีรหัส สามารถรัน UI เพื่อทดสอบแบบ Local State ได้

3. **รันระบบ (Development Server)**
   ```bash
   npm run dev
   ```
   เข้าใช้งานผ่านเบราว์เซอร์ที่ `http://localhost:3000`

## 📦 การนำขึ้นระบบจริง (Deployment)
ระบบนี้ถูกออกแบบมาให้ทำงานได้ดีที่สุดบน **Vercel**
1. พุชโค้ดขึ้น GitHub Repository
2. ล็อกอินเข้า Vercel และเลือก Import Project
3. ตั้งค่า Environment Variables (นำค่าจาก `.env.local` ไปใส่ใน Vercel)
4. กด Deploy

## 📄 โครงสร้างโปรเจกต์
- `/src/app/(dashboard)` - หน้าจอหลักทั้งหมดของระบบ
- `/src/components` - UI Components ที่ใช้ซ้ำ (shadcn/ui)
- `/src/lib/calculations/engine.ts` - ลอจิกการคำนวณคะแนนและการตัดเกรด (มี Unit Tests ผ่าน 100%)
- `/src/lib/excel/generator.ts` - ลอจิกการสร้างไฟล์ ปพ.5
- `/src/lib/firebase/services.ts` - ฟังก์ชันสำหรับติดต่อ Firestore

---
*Developed by Antigravity AI*
