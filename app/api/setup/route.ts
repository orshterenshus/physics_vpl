import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

// One-time setup: creates the first admin account if no users exist.
// Call POST /api/setup with { name, email, password } to bootstrap.
export async function POST(req: Request) {
  await connectDB();
  const count = await User.countDocuments();
  if (count > 0) {
    return NextResponse.json({ error: "Setup already complete. Users already exist." }, { status: 403 });
  }
  const { name, email, password } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "name, email, and password required" }, { status: 400 });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ name, email, role: "admin", passwordHash });
  return NextResponse.json({ message: "Admin created. Sign in with email + password at /login." });
}
