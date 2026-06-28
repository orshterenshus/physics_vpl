import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";
import { generateLoginCode } from "@/lib/generateCode";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["teacher", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const { id } = await params;
  const target = await User.findById(id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.role === "admin") {
    return NextResponse.json({ error: "Admin accounts sign in with a password, not a code — use 'Set new password' instead" }, { status: 400 });
  }
  const code = generateLoginCode();
  target.loginCode = code;
  await target.save();
  return NextResponse.json({ code });
}
