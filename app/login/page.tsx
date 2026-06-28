"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"code" | "admin">("code");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result =
      mode === "code"
        ? await signIn("credentials", { code: code.trim().toUpperCase(), redirect: false })
        : await signIn("credentials", { email: email.trim(), password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError(
        mode === "code"
          ? "Invalid or already-used code. Ask your instructor for a new one."
          : "Invalid email or password."
      );
    } else {
      router.push("/problems");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8 max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Physics Lab</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          {mode === "code" ? "Enter the login code provided by your instructor" : "Admin sign in"}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "code" ? (
            <input
              type="text"
              required
              placeholder="e.g. A4K9PX3M"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-mono tracking-widest text-center focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
              maxLength={12}
              autoComplete="off"
              autoCapitalize="characters"
            />
          ) : (
            <>
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                autoComplete="username"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white"
                autoComplete="current-password"
              />
            </>
          )}

          {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading || (mode === "code" ? code.length < 4 : !email || !password)}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <button
          onClick={() => { setMode((m) => (m === "code" ? "admin" : "code")); setError(""); }}
          className="mt-4 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-white text-center w-full"
        >
          {mode === "code" ? "Admin? Sign in with email & password" : "Have a login code instead?"}
        </button>
      </div>
    </div>
  );
}
