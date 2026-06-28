import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log("Usage: node scripts/docker-reset-admin-password.mjs <email> <new-password>");
  process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI ?? "mongodb://mongo:27017/physics-lab");
await client.connect();
const db = client.db();

const passwordHash = await bcrypt.hash(password, 10);
const result = await db.collection("users").updateOne({ email, role: "admin" }, { $set: { passwordHash } });

console.log(
  result.matchedCount > 0
    ? `Password reset for admin ${email}. Sign in at /login with the new password.`
    : `No admin account found with email "${email}". Check the email and try again.`
);

await client.close();
