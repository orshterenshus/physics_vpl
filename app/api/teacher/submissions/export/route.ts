import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Submission } from "@/models/Submission";
import { Problem } from "@/models/Problem";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";

function csvField(value: string | number): string {
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !["teacher", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const { searchParams } = new URL(req.url);
  const problemId = searchParams.get("problemId");
  const query = problemId ? { problemId, grade: { $ne: null } } : { grade: { $ne: null } };
  const submissions = await Submission.find(query).sort({ createdAt: -1 }).lean();

  const problemIds = [...new Set(submissions.map((s) => s.problemId.toString()))];
  const studentIds = [...new Set(submissions.map((s) => s.studentId.toString()))];
  const [problems, students] = await Promise.all([
    Problem.find({ _id: { $in: problemIds } }, { title: 1 }).lean(),
    User.find({ _id: { $in: studentIds } }, { name: 1, email: 1 }).lean(),
  ]);
  const problemMap = Object.fromEntries(problems.map((p) => [p._id.toString(), p]));
  const studentMap = Object.fromEntries(students.map((s) => [s._id.toString(), s]));

  const header = ["Student", "Email", "Problem", "Grade", "Physics", "Code", "Reasoning", "Overridden", "Submitted"];
  const lines = [header.map(csvField).join(",")];
  for (const s of submissions) {
    const student = studentMap[s.studentId.toString()];
    const problem = problemMap[s.problemId.toString()];
    const grade = s.overrideGrade ?? s.grade;
    lines.push(
      [
        student?.name ?? "Unknown",
        student?.email ?? "",
        problem?.title ?? "Unknown",
        grade ?? "",
        s.physicsScore ?? "",
        s.codingScore ?? "",
        s.reasoningScore ?? "",
        s.overrideGrade !== null ? "Yes" : "No",
        new Date(s.createdAt).toISOString(),
      ]
        .map(csvField)
        .join(",")
    );
  }
  const csv = lines.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="submissions-export.csv"`,
    },
  });
}
