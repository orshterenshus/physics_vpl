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

const name = process.env.ADMIN_NAME ?? "Admin";
const email = process.env.ADMIN_EMAIL ?? "admin";
const password = process.env.ADMIN_PASSWORD ?? "admin";

const client = new MongoClient(readMongoUri());
await client.connect();
const db = client.db();

const count = await db.collection("users").countDocuments();
if (count > 0) {
  console.log("Setup already complete — at least one user already exists. Not creating an admin.");
  console.log('If you\'re locked out, see "node scripts/reset-admin-password.mjs <email> <new-password>" in the README.');
} else {
  const passwordHash = await bcrypt.hash(password, 10);
  await db.collection("users").insertOne({
    name,
    email,
    role: "admin",
    passwordHash,
    mustChangePassword: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log("");
  console.log("========================================================");
  console.log(`First admin account created: ${name} <${email}>`);
  console.log("Sign in at http://localhost:3000/login using \"Admin? Sign in");
  console.log(`with email & password" with email "${email}" and password "${password}".`);
  console.log("You'll be asked to set a new password the first time you log in.");
  console.log("========================================================");
  console.log("");
}

await client.close();
