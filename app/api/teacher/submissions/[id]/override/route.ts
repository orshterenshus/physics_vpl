import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Submission } from "@/models/Submission";
import { auth } from "@/lib/auth";
import { z } from "zod";

const OverrideSchema = z.object({
  grade: z.number().min(0).max(100),
  feedback: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["teacher", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = OverrideSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await connectDB();
  const { id } = await params;
  const submission = await Submission.findByIdAndUpdate(
    id,
    {
      overrideGrade: parsed.data.grade,
      overrideFeedback: parsed.data.feedback?.trim() || null,
      overriddenBy: session.user.id,
      overriddenAt: new Date(),
    },
    { new: true }
  );
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(submission);
}

// Clears a previously-set override, reverting the displayed grade to the LLM's original.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["teacher", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const { id } = await params;
  const submission = await Submission.findByIdAndUpdate(
    id,
    { overrideGrade: null, overrideFeedback: null, overriddenBy: null, overriddenAt: null },
    { new: true }
  );
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(submission);
}
