import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";
import { z } from "zod";

const ChangePasswordSchema = z.object({ password: z.string().min(8) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = ChangePasswordSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  await connectDB();
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await User.findByIdAndUpdate(session.user.id, { passwordHash, mustChangePassword: false });
  return NextResponse.json({ success: true, email: session.user.email });
}
