import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";
import { generateLoginCode } from "@/lib/generateCode";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session || !["teacher", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await connectDB();
  const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });
  return NextResponse.json(users);
}

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["student", "teacher", "admin"]),
  password: z.string().min(8).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !["teacher", "admin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await connectDB();
  const { name, email, role, password } = parsed.data;

  if (role === "admin") {
    if (!password) return NextResponse.json({ error: "Password required for admin accounts" }, { status: 400 });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, role, passwordHash });
    const { passwordHash: _omit, ...safeUser } = user.toObject();
    return NextResponse.json({ user: safeUser }, { status: 201 });
  }

  const code = generateLoginCode();
  const user = await User.create({ name, email, role, loginCode: code });
  return NextResponse.json({ user, code }, { status: 201 });
}
