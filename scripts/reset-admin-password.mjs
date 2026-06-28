import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { resolve } from "path";

function readMongoUri() {
  const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
  const match = content.match(/^MONGODB_URI=(.+)$/m);
  if (!match) throw new Error("MONGODB_URI not found in .env.local");
  return match[1].trim();
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log("Usage: node scripts/reset-admin-password.mjs <email> <new-password>");
  process.exit(1);
}

const client = new MongoClient(readMongoUri());
await client.connect();
const db = client.db();

const passwordHash = await bcrypt.hash(password, 10);
const result = await db.collection("users").updateOne(
  { email, role: "admin" },
  { $set: { passwordHash, mustChangePassword: true } }
);

console.log(
  result.matchedCount > 0
    ? `Password reset for admin ${email}. Sign in at /login with the new password.`
    : `No admin account found with email "${email}". Check the email and try again.`
);

await client.close();
