"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/account/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to change password");
      setLoading(false);
      return;
    }
    // Re-authenticate to pick up a fresh session token with mustChangePassword cleared.
    await signIn("credentials", { email: data.email, password, redirect: false });
    router.push("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8 max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Set a new password</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          You're signing in with a default or temporary password. Choose a real one to continue.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            required
            placeholder="New password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
            autoComplete="new-password"
          />
          <input
            type="password"
            required
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
            autoComplete="new-password"
          />
          {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            {loading ? "Saving..." : "Set password"}
          </button>
        </form>
      </div>
    </div>
  );
}
