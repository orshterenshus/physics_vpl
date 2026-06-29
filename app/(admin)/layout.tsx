import { auth } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/ui/SignOutButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["teacher", "admin"].includes(session.user.role)) redirect("/problems");
  if (session.user.mustChangePassword) redirect("/change-password");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-gray-900 dark:text-white">Physics Lab</span>
          <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 px-2 py-0.5 rounded font-medium">Admin</span>
          <nav className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/admin" className="hover:text-gray-900 dark:hover:text-white transition-colors">Users</Link>
            <Link href="/teacher" className="hover:text-gray-900 dark:hover:text-white transition-colors">Problems</Link>
            <Link href="/teacher/submissions" className="hover:text-gray-900 dark:hover:text-white transition-colors">Submissions</Link>
            <Link href="/teacher/analytics" className="hover:text-gray-900 dark:hover:text-white transition-colors">Analytics</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
