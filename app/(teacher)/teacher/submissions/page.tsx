import { connectDB } from "@/lib/db";
import { Submission } from "@/models/Submission";
import { Problem } from "@/models/Problem";
import { User } from "@/models/User";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ problemId?: string }>;
}

export default async function SubmissionsPage({ searchParams }: PageProps) {
  const { problemId } = await searchParams;
  await connectDB();

  const query = problemId ? { problemId } : {};
  const submissions = await Submission.find(query).sort({ createdAt: -1 }).lean();

  const problemIds = [...new Set(submissions.map((s) => s.problemId.toString()))];
  const studentIds = [...new Set(submissions.map((s) => s.studentId.toString()))];

  const [problems, students] = await Promise.all([
    Problem.find({ _id: { $in: problemIds } }, { title: 1 }).lean(),
    User.find({ _id: { $in: studentIds } }, { name: 1, email: 1 }).lean(),
  ]);

  const problemMap = Object.fromEntries(problems.map((p) => [p._id.toString(), p]));
  const studentMap = Object.fromEntries(students.map((s) => [s._id.toString(), s]));

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Submissions</h1>
        {problemId && (
          <Link href="/teacher/submissions" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            Clear filter
          </Link>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <th className="pb-3 pr-4">Student</th>
              <th className="pb-3 pr-4">Problem</th>
              <th className="pb-3 pr-4">Grade</th>
              <th className="pb-3 pr-4">Physics</th>
              <th className="pb-3 pr-4">Code</th>
              <th className="pb-3 pr-4">Reasoning</th>
              <th className="pb-3">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => {
              const student = studentMap[s.studentId.toString()];
              const problem = problemMap[s.problemId.toString()];
              return (
                <tr key={s._id.toString()} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{student?.name ?? student?.email ?? "Unknown"}</td>
                  <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">{problem?.title ?? "Unknown"}</td>
                  <td className="py-3 pr-4">
                    {s.grade !== null ? (
                      <span className={`font-bold ${s.grade >= 70 ? "text-green-400" : "text-red-400"}`}>
                        {s.grade}%
                      </span>
                    ) : (
                      <span className="text-gray-500">Pending</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.physicsScore ?? "—"}</td>
                  <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.codingScore ?? "—"}</td>
                  <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{s.reasoningScore ?? "—"}</td>
                  <td className="py-3 text-gray-400 dark:text-gray-500 text-xs">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {submissions.length === 0 && (
          <p className="text-gray-400 mt-4">No submissions yet.</p>
        )}
      </div>
    </div>
  );
}
