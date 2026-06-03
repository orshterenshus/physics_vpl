import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { generateLoginCode } from "@/lib/generateCode";

// One-time setup: creates the first admin account if no users exist.
// Call POST /api/setup with { name, email } to bootstrap.
export async function POST(req: Request) {
  await connectDB();
  const count = await User.countDocuments();
  if (count > 0) {
    return NextResponse.json({ error: "Setup already complete. Users already exist." }, { status: 403 });
  }
  const { name, email } = await req.json();
  if (!name || !email) return NextResponse.json({ error: "name and email required" }, { status: 400 });
  const code = generateLoginCode();
  await User.create({ name, email, role: "admin", loginCode: code });
  return NextResponse.json({ message: "Admin created", code });
}
