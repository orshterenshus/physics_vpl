import { connectDB } from "@/lib/db";
import { Submission } from "@/models/Submission";
import { Problem } from "@/models/Problem";
import { User } from "@/models/User";
import Link from "next/link";
import { SubmissionsTable } from "@/components/teacher/SubmissionsTable";

interface PageProps {
  searchParams: Promise<{ problemId?: string }>;
}

export default async function SubmissionsPage({ searchParams }: PageProps) {
  const { problemId } = await searchParams;
  await connectDB();

  const query = problemId ? { problemId, grade: { $ne: null } } : { grade: { $ne: null } };
  const submissions = await Submission.find(query).sort({ createdAt: -1 }).lean();

  const problemIds = [...new Set(submissions.map((s) => s.problemId.toString()))];
  const studentIds = [...new Set(submissions.map((s) => s.studentId.toString()))];

  const [problems, students] = await Promise.all([
    Problem.find({ _id: { $in: problemIds } }, { title: 1 }).lean(),
    User.find({ _id: { $in: studentIds } }, { name: 1, email: 1 }).lean(),
  ]);

  const problemMap = Object.fromEntries(problems.map((p) => [p._id.toString(), p]));
  const studentMap = Object.fromEntries(students.map((s) => [s._id.toString(), s]));

  const rows = submissions.map((s) => {
    const student = studentMap[s.studentId.toString()];
    const problem = problemMap[s.problemId.toString()];
    return {
      id: s._id.toString(),
      studentLabel: student?.name ?? student?.email ?? "Unknown",
      problemTitle: problem?.title ?? "Unknown",
      grade: s.grade ?? null,
      physicsScore: s.physicsScore ?? null,
      codingScore: s.codingScore ?? null,
      reasoningScore: s.reasoningScore ?? null,
      feedback: s.feedback ?? "",
      overrideGrade: s.overrideGrade ?? null,
      overrideFeedback: s.overrideFeedback ?? null,
      createdAt: new Date(s.createdAt).toISOString(),
    };
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Submissions</h1>
        <div className="flex items-center gap-4">
          <a
            href={`/api/teacher/submissions/export${problemId ? `?problemId=${problemId}` : ""}`}
            className="text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1.5 transition-colors"
          >
            Export CSV
          </a>
          {problemId && (
            <Link href="/teacher/submissions" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              Clear filter
            </Link>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <SubmissionsTable rows={rows} />
        {submissions.length === 0 && (
          <p className="text-gray-400 mt-4">No submissions yet.</p>
        )}
      </div>
    </div>
  );
}
