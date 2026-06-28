const url = `${process.env.APP_URL ?? "http://app:3000"}/api/setup`;
const name = process.env.ADMIN_NAME ?? "Admin";
const email = process.env.ADMIN_EMAIL ?? "admin@example.com";

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, email }),
});
const data = await res.json();

if (res.ok) {
  console.log("");
  console.log("========================================================");
  console.log(`First admin account created: ${name} <${email}>`);
  console.log(`LOGIN CODE: ${data.code}`);
  console.log("Go to http://localhost:3000/login and enter this code.");
  console.log("(One-time use — it's cleared the moment you log in. Create");
  console.log(" more accounts and new codes from the Users page afterward.)");
  console.log("========================================================");
  console.log("");
} else {
  console.log(`Setup already completed previously (${data.error}) — an admin account already exists.`);
  console.log("If you need a login code, see the mongosh command in docs/DOCKER.md, or log in as an existing admin and use the Users page.");
}
