import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Submission } from "@/models/Submission";
import { Problem } from "@/models/Problem";
import { auth } from "@/lib/auth";
import { evaluateSubmission } from "@/lib/evaluate";
import { z } from "zod";

const SubmitSchema = z.object({
  problemId: z.string(),
  sourceCode: z.string(),
  executionOutput: z.string(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await connectDB();
  const problem = await Problem.findById(parsed.data.problemId);
  if (!problem) return NextResponse.json({ error: "Problem not found" }, { status: 404 });

  const submission = await Submission.create({
    studentId: session.user.id,
    problemId: parsed.data.problemId,
    sourceCode: parsed.data.sourceCode,
    executionOutput: parsed.data.executionOutput,
    grade: null,
    feedback: "Evaluation pending",
  });

  evaluateSubmission(submission._id.toString(), problem, parsed.data.sourceCode).catch(console.error);

  return NextResponse.json({ submissionId: submission._id }, { status: 201 });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const problemId = searchParams.get("problemId");

  const query: Record<string, string> = { studentId: session.user.id };
  if (problemId) query.problemId = problemId;

  const submissions = await Submission.find(query).sort({ createdAt: -1 });
  return NextResponse.json(submissions);
}
