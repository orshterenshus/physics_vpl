import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Submission } from "@/models/Submission";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || !["teacher", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const { searchParams } = new URL(req.url);
  const problemId = searchParams.get("problemId");
  const query = problemId ? { problemId } : {};
  const submissions = await Submission.find(query).sort({ createdAt: -1 });
  return NextResponse.json(submissions);
}
