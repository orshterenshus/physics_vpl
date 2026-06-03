import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Problem } from "@/models/Problem";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session || !["teacher", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const problems = await Problem.find({}).sort({ chapter: 1, problemNumber: 1 });
  return NextResponse.json(problems);
}
