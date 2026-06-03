"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      code: code.trim().toUpperCase(),
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid or already-used code. Ask your instructor for a new one.");
    } else {
      router.push("/problems");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8 max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Physics Lab</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Enter the login code provided by your instructor</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading || code.length < 4}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
