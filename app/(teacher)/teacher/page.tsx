import { connectDB } from "@/lib/db";
import { Problem } from "@/models/Problem";
import Link from "next/link";

interface ProblemDoc {
  _id: string;
  chapter: number;
  problemNumber: number;
  title: string;
}

export default async function TeacherDashboard() {
  await connectDB();
  const problems = await Problem.find({}, { title: 1, chapter: 1, problemNumber: 1 })
    .sort({ chapter: 1, problemNumber: 1 })
    .lean<ProblemDoc[]>();

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Problems</h1>
        <Link
          href="/teacher/problems/new"
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          New Problem
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {problems.map((p) => (
          <div
            key={p._id.toString()}
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 flex items-center justify-between"
          >
            <span className="font-medium">
              Ch.{p.chapter} #{p.problemNumber} — {p.title}
            </span>
            <div className="flex gap-3 text-sm">
              <Link href={`/teacher/problems/${p._id}/edit`} className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                Edit
              </Link>
              <Link href={`/teacher/submissions?problemId=${p._id}`} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                Submissions
              </Link>
            </div>
          </div>
        ))}
        {problems.length === 0 && (
          <p className="text-gray-400">No problems yet. Create your first one.</p>
        )}
      </div>
    </div>
  );
}
