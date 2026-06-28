import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";
import { z } from "zod";

const SetPasswordSchema = z.object({ password: z.string().min(8) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || !["teacher", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = SetPasswordSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  await connectDB();
  const { id } = await params;
  const target = await User.findById(id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.role !== "admin") {
    return NextResponse.json({ error: "Only admin accounts use passwords — use 'New code' instead" }, { status: 400 });
  }

  target.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await target.save();
  return NextResponse.json({ success: true });
}
