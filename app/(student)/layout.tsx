import { auth } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/ui/SignOutButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-3 flex items-center justify-between">
        <Link href="/problems" className="font-semibold text-gray-900 dark:text-white">
          Physics Lab
        </Link>
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>{session.user.email}</span>
          {["teacher", "admin"].includes(session.user.role) && (
            <Link href="/teacher" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              Teacher Dashboard
            </Link>
          )}
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
