import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Problem } from "@/models/Problem";
import { auth } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["teacher", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const problem = await Problem.findByIdAndUpdate(id, body, { new: true });
  if (!problem) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(problem);
}
