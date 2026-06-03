import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Problem } from "@/models/Problem";
import { auth } from "@/lib/auth";

export async function GET() {
  await connectDB();
  const problems = await Problem.find({}, { teacherSolution: 0, evaluationHints: 0 }).sort({
    chapter: 1,
    problemNumber: 1,
  });
  return NextResponse.json(problems);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !["teacher", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const body = await req.json();
  const problem = await Problem.create(body);
  return NextResponse.json(problem, { status: 201 });
}
