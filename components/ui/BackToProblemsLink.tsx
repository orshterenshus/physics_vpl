"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export function BackToProblemsLink() {
  const pathname = usePathname();
  const isInsideProblem = /^\/problems\/.+/.test(pathname ?? "");
  if (!isInsideProblem) return null;

  return (
    <Link
      href="/problems"
      className="font-bold text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
    >
      ← Back to Problems
    </Link>
  );
}
