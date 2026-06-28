const url = `${process.env.APP_URL ?? "http://app:3000"}/api/setup`;
const name = process.env.ADMIN_NAME ?? "Admin";
const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
const password = process.env.ADMIN_PASSWORD;

if (!password) {
  console.log("ADMIN_PASSWORD is not set — see .env.example. Skipping admin bootstrap.");
  process.exit(0);
}

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, email, password }),
});
const data = await res.json();

if (res.ok) {
  console.log("");
  console.log("========================================================");
  console.log(`First admin account created: ${name} <${email}>`);
  console.log("Sign in at http://localhost:3000/login using \"Admin? Sign in");
  console.log(`with email & password\" with that email and the ADMIN_PASSWORD`);
  console.log("you set in .env.");
  console.log("========================================================");
  console.log("");
} else {
  console.log(`Setup already completed previously (${data.error}) — an admin account already exists.`);
  console.log("If you're locked out, see the 'Locked out?' section in docs/DOCKER.md.");
}
