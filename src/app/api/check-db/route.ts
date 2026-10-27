import { NextResponse } from "next/server";
import { getAllStudents, getAllClassrooms, getAllSubjects } from "@/lib/firebase/services";

export async function GET() {
  try {
    const [students, classrooms, subjects] = await Promise.all([
      getAllStudents(),
      getAllClassrooms(),
      getAllSubjects()
    ]);

    const byRoom: Record<string, any[]> = {};
    students.forEach(s => {
      byRoom[s.room] = byRoom[s.room] || [];
      byRoom[s.room].push({
        id: s.id,
        number: s.number,
        studentCode: s.studentCode,
        name: s.name,
        room: s.room
      });
    });

    Object.keys(byRoom).forEach(r => {
      byRoom[r].sort((a, b) => a.number - b.number);
    });

    return NextResponse.json({
      success: true,
      totalStudents: students.length,
      byRoom,
      classrooms: classrooms.map(c => ({ id: c.id, name: c.name })),
      subjects: subjects.map(s => ({ id: s.id, code: s.code, name: s.name, level: s.level }))
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
