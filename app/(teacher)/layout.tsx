import { auth } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/ui/SignOutButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["teacher", "admin"].includes(session.user.role)) redirect("/problems");
  if (session.user.mustChangePassword) redirect("/change-password");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/teacher" className="font-semibold text-gray-900 dark:text-white">
            Physics Lab
          </Link>
          <nav className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/teacher" className="hover:text-gray-900 dark:hover:text-white transition-colors">Problems</Link>
            <Link href="/teacher/submissions" className="hover:text-gray-900 dark:hover:text-white transition-colors">Submissions</Link>
            <Link href="/admin" className="hover:text-gray-900 dark:hover:text-white transition-colors">Users</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/problems" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">Student View</Link>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
